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
            for (const user of this.users.array()) {
                packet.session.push(Number(user.session))
            }
        }
        if (this.channels.size) {
            packet.channelId = []
            for (const channel of this.channels.array()) {
                packet.channelId.push(Number(channel.id))
            }
        }

        if (this.trees.size) {
            packet.treeId = []
            for (const channel of this.trees.array()) {
                packet.treeId.push(Number(channel.id))
            }
        }

        return packet
    }

}

module.exports = TextMessage