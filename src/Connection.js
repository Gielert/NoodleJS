const tls = require('tls');
const Protobuf = require('./Protobuf')
const Promise = require('bluebird')
const EventEmitter = require('events').EventEmitter

class Connection extends EventEmitter {
    constructor(options) {
        super()

        new Protobuf().then((protobuf) => {
            this.protobuf = protobuf
            this.socket = tls.connect(options.port, options.url, {
                rejectUnauthorized: options.rejectUnauthorized
            }, error => {
                if (error) return this.emit('error', error)
                this.emit('connected')
            })

            this.socket.on('data', this._onReceiveData.bind(this))
        })

        this.buffers = []
        this.length = 0
        this.readers = []

        this._waitForPrefix()
    }

    _waitForPrefix() {
        this.read(6, (data) => {
            const type = data.readUInt16BE(0)
            const length = data.readUInt32BE(2)

            this.read(length, (data) => {
                this._processData(type, data)
                this._waitForPrefix()
            })
        })
    }

    read(length, callback) {
        this.readers.push({ length: length, callback: callback });
        if (this.readers.length === 1) { this._checkReader(); }
    }

    _onReceiveData(data) {
        this.buffers.push(data)
        this.length += data.length
        this._checkReader()
    }

    _processData(type, data) {
        if( this.protobuf.nameById(type) === 'UDPTunnel' ) {

        } else {
            var msg = this.protobuf.decodePacket(type, data);
            this._processMessage(type, msg);
        }
    }

    _processMessage(type, msg) {
        this.emit(this.protobuf.nameById(type), msg);
    }

    _checkReader() {
        if (this.readers.length === 0) return

        const reader = this.readers[0]

        if (this.length < reader.length) return
        const buffer = new Buffer(reader.length)
        var written = 0

        while(written < reader.length) {
            var received = this.buffers[0];

            var remaining = reader.length - written;
            if (received.length <= remaining) {

                received.copy(buffer, written);
                written += received.length;

                this.buffers.splice(0, 1);
                this.length -= received.length;
            } else {

                received.copy(buffer, written, 0, remaining);
                written += remaining;

                this.buffers[0] = received.slice(remaining);
                this.length -= remaining;
            }
        }

        this.readers.splice(0, 1);
        reader.callback(buffer);
    }

    _writePacket(buffer) {
        this.socket.write(buffer)
    }

    writeHeader(type, data) {
        const header = new Buffer(6)
        header.writeUInt16BE(type, 0)
        header.writeUInt32BE(data, 2)
        this._writePacket(header)
    }

    writeProto(type, data) {
        try {
            const packet = this.protobuf.encodePacket(type, data)
            this.writeHeader(this.protobuf.idByName(type), packet.length)
            this._writePacket(packet)
            return Promise.resolve()
        } catch(e) {
            return Promise.reject(e)
        }

    }
}

module.exports = Connection