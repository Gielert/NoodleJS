const tls = require('tls');
const dgram = require('dgram');
const Protobuf = require('./Protobuf')
const Promise = require('bluebird')
const EventEmitter = require('events').EventEmitter
const OpusEncoder = require('@discordjs/opus').OpusEncoder
const Constants = require('./Constants')
const Util = require('./Util')
const CryptStateOCB2 = require('./CryptStateOCB2Native')

class Connection extends EventEmitter {
    constructor(options) {
        super()

        this.options = options;
        this.opusEncoder = new OpusEncoder(Constants.Audio.sampleRate, 1)
        this.currentEncoder = this.opusEncoder
        this.codec = Connection.codec().Opus
        this.voiceSequence = 0
        this.codecWarningShown = {};
        this.cryptState = new CryptStateOCB2()
        
        this.tcpSocket = null
        this.udpSocket = null
    }

    connect() {
        new Protobuf().then((protobuf) => {
            this.protobuf = protobuf
            this.tcpSocket = tls.connect(this.options.port, this.options.url, this.options, () => {
                this.emit('connected')
            })
            this.tcpSocket.on('error', error => {
                this.emit('error', error)
            })
            this.tcpSocket.on('data', this._onReceiveData.bind(this))

            
            this.udpSocket = dgram.createSocket('udp4')
            this.udpSocket.connect(this.options.port, this.options.url, () => {
                this.emit('udpConnected')
            })
            this.udpSocket.on('error', error => {
                this.emit('error', error);
            });
            this.udpSocket.on('message', this._onReceiveUDPData.bind(this));
        })
    }

    close() {
        if (this.udpSocket) {
            this.udpSocket.close()
        }
        this.tcpSocket.end()
    }

    static codec() {
        return {
            Celt: 0,
            Ping: 1,
            Speex: 2,
            CeltBeta: 3,
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

    _onReceiveUDPData(data) {
        // Decrypt incoming UDP packet
        const buf = this.cryptState.decrypt(data)
        if (!buf) {
            console.warn('Failed to decrypt UDP packet')
            return
        }
        const type = buf[0]
        this._processUDPData(type, buf.slice(1))
    }

    _processData(type, data) {
        if (this.protobuf.nameById(type) === 'UDPTunnel' ) {
            this.readAudio(data);
        } else {
            var msg = this.protobuf.decodePacket(type, data);
            this._processMessage(type, msg);
        }
    }

    _processUDPData(type, data) {
        const typeName = this.protobuf.nameById(type, true)
        var msg = this.protobuf.decodeUDPPacket(typeName, data);
        if (typeName === 'Audio') {
            this.emit('voiceData', msg)
        } else {
            this.emit("Ping", {...msg, udp: true})
        }
    }

    _processMessage(type, msg) {
        this.emit(this.protobuf.nameById(type), msg);
    }

    _writePacket(buffer) {
        this.tcpSocket.write(buffer)
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

    writeProtoUDP(type, data) {
        try {
            const packet = this.protobuf.encodeUDPPacket(type, data)
            const encryptedPacket = this.cryptState.encrypt(packet)
            this.udpSocket.send(encryptedPacket, (err) => {
                if (err) {
                    Promise.reject(err)
                }
            })
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

        if (audioType == Connection.codec().Ping) {
            // Nothing to do but don't display a warning
            console.log('Audio PING packet received');
            return;
        } else if (audioType > 4) {
            // We don't know what type this is
            console.warn('Unknown audioType in packet detected: ' + audioType);
            return;
        }

        // It's an "Encoded audio data packet" (CELT Alpha, Speex, CELT Beta 
        // or Opus). So it's safe to parse the header

        // Offset in data from where we are currently reading
        var offset = 1;

        var varInt = Util.fromVarInt(data.slice(offset, offset + 9));
        const sender = varInt.value;
        offset += varInt.consumed;

        varInt = Util.fromVarInt(data.slice(offset, offset + 9));
        const sequence = varInt.value;
        offset += varInt.consumed;

        if (audioType != Connection.codec().Opus) {
            // Not OPUS-encoded => not supported :/
            // Check if we already printed a warning for this audiostream
            if ((!this.codecWarningShown[sender]) || (sequence < this.codecWarningShown[sender])) {
                console.warn('Unspported audio codec in voice stream from user ' + sender + ': ', audioType);
            }
            this.codecWarningShown[sender] = sequence;
            return;
        }

        //console.debug("\tsender:" + sender + ' sequence:' + sequence);

        // Opus header
        varInt = Util.fromVarInt(data.slice(offset, offset + 9));
        offset += varInt.consumed;
        const opusHeader = varInt.value;

        const opusLength = opusHeader & 0x1FFF;
        const lastFrame = (opusHeader & 0x2000) ? true : false;

        //console.debug("\topus header:" + opusHeader + ' length:' + opusLength + ' lastFrame:' + lastFrame);

        const opusData = data.slice(offset, offset + opusLength);

        //console.debug("\tOPUS DATA LENGTH:" + opusData.length + ' DATA:', opusData);

        const decoded = this.currentEncoder.decode(opusData);
        //console.debug("\tDECODED DATA LENGTH:" + decoded.length + ' DATA:', decoded);

        const voiceData = {
            audioType: audioType,        // For the moment, will be 4 = OPUS
            whisperTarget: audioTarget,
            sender: sender,              // Session ID of the user sending the audio
            sequence: sequence,
            lastFrame: lastFrame,        // Don't rely on it!
            opusData: opusData,          // Voice data encoded, as it came in
            decodedData: decoded         // Voice data decoded (48000, 1ch, 16bit)
        }

        this.emit('voiceData', voiceData);
    }

    _writeAudioTCP(packet, whisperTarget, codec, voiceSequence, final) {
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
    }

    _writeAudioUDP(packet, whisperTarget, codec, voiceSequence, final) {
         packet = this.currentEncoder.encode(packet)

        if (codec !== Connection.codec().Opus) {
            throw new TypeError('Only Opus codec is supported with protobuf UDP format')
        }

        if (typeof voiceSequence !== 'number')
            voiceSequence = this.voiceSequence

        const audioMessage = {
            target: whisperTarget || 0,
            frameNumber: voiceSequence,
            opusData: packet,
            isTerminator: final || false
        }


        const encodedAudio = this.protobuf.encodeUDPPacket('Audio', audioMessage)
        const packetWithType = Buffer.concat([Buffer.from([0x00]), encodedAudio])

        voiceSequence++

        const encryptedPacket = this.cryptState.encrypt(packetWithType)
            
        this.udpSocket.send(encryptedPacket, (err) => {
            if (err) {
                this.emit('error', err)
            }
        })
    }

    writeAudio(packet, whisperTarget, codec, voiceSequence, final) {
        if (this.udpSocket) {
            this._writeAudioUDP(packet, whisperTarget, codec, voiceSequence, final)
            
        } else {
            this._writeAudioTCP(packet, whisperTarget, codec, voiceSequence, final)
        }

        if (voiceSequence > this.voiceSequence)
            this.voiceSequence = voiceSequence

        return 1
    }
}

module.exports = Connection
