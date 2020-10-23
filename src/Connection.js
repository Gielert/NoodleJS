const tls = require('tls');
const Protobuf = require('./Protobuf')
const Promise = require('bluebird')
const EventEmitter = require('events').EventEmitter
const OpusEncoder = require('@discordjs/opus').OpusEncoder
const Constants = require('./Constants')
const Util = require('./Util')

class Connection extends EventEmitter {
    constructor(options) {
        super()

        this.options = options;
        this.opusEncoder = new OpusEncoder(Constants.Audio.sampleRate, 1)
        this.currentEncoder = this.opusEncoder
        this.codec = Connection.codec().Opus
        this.voiceSequence = 0

    }

    connect() {
        new Protobuf().then((protobuf) => {
            this.protobuf = protobuf
            this.socket = tls.connect(this.options.port, this.options.url, this.options, () => {
                this.emit('connected')
            })
            this.socket.on('error', error => {
                this.emit('error', error)
            })
            this.socket.on('data', this._onReceiveData.bind(this))
        })
    }

    close() {
        this.socket.end()
    }

    static codec() {
        return {
            Celt: 0,
            Opus: 4
        }
    }

    _onReceiveData(data) {
        while (data.length > 6) {
            const type = data.readUInt16BE(0)
            const length = data.readUInt32BE(2)
            if (data.length < length + 6)
                break
            const buf = data.slice(6, length + 6)
            data = data.slice(buf.length + 6)
            this._processData(type, buf)
        }
    }

    _processData(type, data) {
        if (this.protobuf.nameById(type) === 'UDPTunnel' ) {
            this.readAudio(data);
        } else {
            var msg = this.protobuf.decodePacket(type, data);
            this._processMessage(type, msg);
        }
    }

    _processMessage(type, msg) {
        this.emit(this.protobuf.nameById(type), msg);
    }

    _writePacket(buffer) {
        this.socket.write(buffer)
    }

    _writeHeader(type, data) {
        const header = Buffer.alloc(6)
        header.writeUInt16BE(type, 0)
        header.writeUInt32BE(data, 2)
        this._writePacket(header)
    }

    writeProto(type, data) {
        try {
            const packet = this.protobuf.encodePacket(type, data)
            this._writeHeader(this.protobuf.idByName(type), packet.length)
            this._writePacket(packet)
            return Promise.resolve()
        } catch(e) {
            return Promise.reject(e)
        }

    }

    readAudio(data) {
        // Packet format:
        // https://github.com/mumble-voip/mumble-protocol/blob/master/voice_data.rst#packet-format
        const audioType = (data[0] & 0xE0) >> 5;
        const audioTarget = data[0] & 0x1F;

        //console.debug("\nAUDIO DATA length:" + data.length + ' audioType:' + audioType + ' audioTarget: ' + audioTarget);

        if (audioType != Connection.codec().Opus) {
            // Not OPUS-encoded => not supported :/
            // Should we warn the user here? Throw an error?
            // Or just do nothing to not crash a program?
            return;
        }

        // Offset in data from where we are currently reading
        var offset = 1;

        var varInt = Util.fromVarInt(data.slice(offset, offset + 9));
        const sender = varInt.value;
        offset += varInt.consumed;

        varInt = Util.fromVarInt(data.slice(offset, offset + 9));
        const sequence = varInt.value;
        offset += varInt.consumed;

        //console.debug("\tsender:" + sender + ' sequence:' + sequence);

        // Opus header
        varInt = Util.fromVarInt(data.slice(offset, offset + 9));
        offset += varInt.consumed;
        const opusHeader = varInt.value;

        const opusLength = opusHeader & 0x1FFF;
        const lastFrame = (opusHeader & 0x2000) ? true : false; // Don't rely on it!

        //console.debug("\topus header:" + opusHeader + ' length:' + opusLength + ' lastFrame:' + lastFrame);

        const opusData = data.slice(offset, offset + opusLength);

        //console.debug("\tOPUS DATA LENGTH:" + opusData.length + ' DATA:', opusData);

        const decoded = this.currentEncoder.decode(opusData);
        //console.debug("\tDECODED DATA LENGTH:" + decoded.length + ' DATA:', decoded);

        const voiceData = {
            audioType: audioType,
            whisperTarget: audioTarget,
            sender: sender,
            sequence: sequence,
            lastFrame: lastFrame,
            opusData: opusData,
            decodedData: decoded
        }

        this.emit('voiceData', voiceData);
    }

    writeAudio(packet, whisperTarget, codec, voiceSequence, final) {
        packet = this.currentEncoder.encode(packet)

        const type = codec === Connection.codec().Opus ? 4 : 0
        const target = whisperTarget || 0
        const typeTarget = type << 5 | target

        if (typeof voiceSequence !== 'number')
            voiceSequence = this.voiceSequence

        const sequenceVarint = Util.toVarint(voiceSequence)

        const voiceHeader = Buffer.alloc(1 + sequenceVarint.length)
        voiceHeader[0] = typeTarget
        sequenceVarint.value.copy(voiceHeader, 1, 0)
        let header

        if (codec == Connection.codec().Opus) {
            if (packet.length > 0x1FFF)
                throw new TypeError(`Audio frame too long! Max Opus length is ${0x1FFF} bytes.`)

            let headerValue = packet.length

            if (final)
                headerValue += (1 << 7)

            const headerVarint = Util.toVarint(headerValue)
            header = headerVarint.value
        } else {
            throw new TypeError('Celt is not supported')
        }

        const frame = Buffer.alloc(header.length + packet.length)
        header.copy(frame, 0)

        packet.copy(frame, header.length)

        voiceSequence++

        this._writeHeader(this.protobuf.idByName('UDPTunnel'), voiceHeader.length + frame.length)
        this._writePacket(voiceHeader)
        this._writePacket(frame)

        if (voiceSequence > this.voiceSequence)
            this.voiceSequence = voiceSequence

        return 1
    }
}

module.exports = Connection
