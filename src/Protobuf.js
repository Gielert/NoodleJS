const protobufjs = require('protobufjs')
const path = require('path')
const MessagesTCP = require('./MessagesTCP')
const MessagesUDP = require('./MessagesUDP')
const Promise = require('bluebird')

class Protobuf {
    constructor() {
        return Promise.all([
            protobufjs.load(path.join(__dirname, 'Mumble.proto')),
            protobufjs.load(path.join(__dirname, 'MumbleUDP.proto'))
        ]).then(([tcpRoot, udpRoot]) => {
            this.mumble = tcpRoot
            this.mumbleUDP = udpRoot
            return Promise.resolve(this)
        }).catch((err) => {
            throw new Error(err)
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
        return packet.decode(buffer).toJSON()
    }

    nameById(id, isUDP = false) {
        return isUDP ? MessagesUDP[id] : MessagesTCP[id]
    }

    idByName(name, isUDP = false) {
        const messages = isUDP ? MessagesUDP : MessagesTCP
        for (const key in messages) {
            if(messages[key] == name)
                return key
        }
    }

    encodeUDPPacket(type, payload) {
        const packet = this.mumbleUDP.lookup(`MumbleUDP.${type}`)
        if(packet.verify(payload))
            throw new Error(`Error verifying payload for UDP packet ${type}`)
        const message = packet.create(payload)
        return packet.encode(message).finish()
    }

    decodeUDPPacket(type, buffer) {
        const packet = this.mumbleUDP.lookup(`MumbleUDP.${type}`)
        return packet.decode(buffer).toJSON()
    }
}

module.exports = Protobuf
