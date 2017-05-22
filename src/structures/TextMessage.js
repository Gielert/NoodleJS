const Util = require('../Util')
const Collection = require('./Collection')

class TextMessage {

    constructor(client, data) {
        Object.defineProperty(this, 'client', {value: client})

        this.users = new Collection()
        this.channels = new Collection()
        this.trees = new Collection()

        if (data) this.setup(data)
    }

    setup(data) {

        if (data.actor != null)
            this.sender = this.client.users.get(data.actor)

        if (data.session != null)
            data.session.forEach(session => {
                const user = this.client.users.get(session)
                if (user)
                    this.users.set(user.session, user)
            })

        if (data.channelId != null)
            data.channelId.forEach(id => {
                const channel = this.client.channels.get(id)
                if (channel)
                    this.channels.set(channel.id, channel)
            })

        if (data.treeId != null)
            data.treeId.forEach(id => {
                const channel = this.client.channels.get(id)
                if (channel)
                    this.trees.set(channel.id, channel)
            })

        if (data.message != null)
            this.content = data.message

    }

    toPacket() {
        let packet = {}

        packet.message = this.content

        if (this.users.size) {
            packet.session = []
            for (const session in this.users.array()) {
                packet.session.push(Number(session))
            }
        }
        if (this.channels.size) {
            packet.channelId = []
            for (const id in this.channels.array()) {
                packet.channelId.push(Number(id))
            }
        }

        if (this.trees.size) {
            packet.treeId = []
            for (const id in this.trees.array()) {
                packet.treeId.push(Number(id))
            }
        }

        return packet
    }

}

module.exports = TextMessage