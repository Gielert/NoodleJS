const protobufjs = require('protobufjs')
const fs = require('fs')
const path = require('path')
const Messages = require('./Messages')
const Promise = require('bluebird')

class Protobuf {
    constructor() {
        return protobufjs.load(path.join(__dirname, 'Mumble.proto'))
            .then((root) => {
                this.mumble = root
                return Promise.resolve(this)
            }).catch((err) => {
                throw new Error('Something went wrong loading the protobuf file!')
            })
    }

    encodePacket(type, payload) {
        const packet = this.mumble.lookup(`MumbleProto.${type}`)
        if(packet.verify(payload))
            throw new Error(`Error verifying payload for packet ${type}`)
        const message = packet.create(payload)
        return packet.encode(message).finish()
    }

    decodePacket(type_id, buffer) {
        const type = this.nameById(type_id)
        const packet = this.mumble.lookup(`MumbleProto.${type}`)
        return packet.decode(buffer)
    }

    nameById(id) {
        return Messages[id]
    }

    idByName(name) {
        for (const key in Messages) {
            if(Messages[key] == name)
                return key
        }
    }
}

module.exports = Protobuf
