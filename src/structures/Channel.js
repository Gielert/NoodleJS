const Collection = require('./Collection')
const TextMessage = require('./TextMessage')
const Util = require('../Util')
const Promise = require('bluebird')

/**
 * Represents a channel on Mumble
 */
class Channel {

    /**
     * @param  {Client} client The client that instantiated the channel
     * @param  {ChannelData} data Information about the channel
     */
    constructor(client, data) {
        Object.defineProperty(this, 'client', {value: client})

        this.children = new Collection()
        this.links = new Collection()

        if (data) this.setup(data)
    }

    setup(data) {

        if (data.channelId == null)
            return

        this.id = data.channelId
        if (data.parent != null) {
            if (this.parent) {
                if (this.parent.id !== data.parent) {
                    this.parent.children.delete(this.id)
                    this.parent = this.client.channels.get(data.parent)
                    this.parent.children.set(this.id, this)
                }
            } else {
                this.parent = this.client.channels.get(data.parent)
                this.parent.children.set(this.id, this)
            }
        }

        if (data.name != null)
            this.name = data.name

        if (data.links != null)
            data.links.forEach(val => {
                const channel = this.client.channels.get(val)
                if (channel)
                    this.links.set(channel.id, channel)
            })

        if (this.description != null)
            this.description = data.description

        if (data.linksAdd != null)
            data.linksAdd.forEach(val => {
                const channel = this.client.channels.get(val)
                if (channel)
                    this.links.set(channel.id, channel)
            })

        if (data.linksRemove != null)
            data.linksRemove.forEach(val => {
                const channel = this.client.channels.get(val)
                if (channel)
                    this.links.delete(channel.id)
            })

        if (this.temporary != null)
            this.temporary = data.temporary

        if (this.position != null)
            this.position = data.position
    }

    sendMessage(message, recursive) {
        let textMessage = new TextMessage()
        textMessage.content = message

        if (recursive) {
            textMessage.trees.set(this.id, this)
        } else {
            textMessage.channels.set(this.id, this)
        }

        return this.client.connection
            .writeProto('TextMessage', textMessage.toPacket())
            .then(() => Promise.resolve(textMessage))
    }

}

module.exports = Channel
