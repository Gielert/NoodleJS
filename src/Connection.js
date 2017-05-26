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
        if( this.protobuf.nameById(type) === 'UDPTunnel' ) {
            //TODO handle voice packets
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
        const header = new Buffer(6)
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
}

module.exports = Connection