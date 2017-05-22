const Collection = require('./Collection')

class Channel {

    constructor(client, data) {
        Object.defineProperty(this, 'client', {value: client})

        this.children = new Collection()
        this.links = new Collection()

        if (data) this.setup(data)
    }

    setup(data) {

        if (data.channelId == null)
            return

        this.channelId = data.channelId

        if (data.parent != null)
            this.parent = this.client.channels.get(data.parent)

        if (data.name != null)
            this.name = data.name

        if (data.links != null)
            data.links.forEach(val => {
                const channel = this.client.channels.get(val)
                if (channel)
                    this.links.set(channel.channelId, channel)
            })

        if (this.description != null)
            this.description = data.description

        if (data.linksAdd != null)
            data.linksAdd.forEach(val => {
                const channel = this.client.channels.get(val)
                if (channel)
                    this.links.set(channel.channelId, channel)
            })

        if (data.linksRemove != null)
            data.linksRemove.forEach(val => {
                const channel = this.client.channels.get(val)
                if (channel)
                    this.links.delete(channel.channelId)
            })

        if (this.temporary != null)
            this.temporary = data.temporary

        if (this.position != null)
            this.position = data.position
    }

    sendMessage() {
        console.log("keke")
    }

}

module.exports = Channel
