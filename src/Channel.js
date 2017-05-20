const Collection = require('./Collection')

class Channel {

    constructor(client, data) {
        Object.defineProperty(this, 'client', {value: client})

        if (data) this.setup(data)
    }

    setup(data) {

        if (data.channelId == null)
            return

        this.channelId = data.channelId

        this.children = new Collection()

        if (data.parent != null) {
            const oldParent = this.parent
            this.parent = this.client.channels.get(data.parent)
            if (this.parent != null)
                this.parent.children.set(this.channelId, this)
            if (oldParent != null)
                oldParent.children.delete(this.channelId)
        }

        if (data.name != null)
            this.name = data.name

        this.links = new Collection()
        data.links.forEach(val => {
            let channel = this.client.channels.get(val)
            this.links.set(channel.channelId, channel)
        })

        if (this.description != null)
            this.description = data.description

        this.linksAdd = new Collection()
        data.linksAdd.forEach(val => {
            let channel = this.client.channels.get(val)
            this.linksAdd.set(channel.channelId, channel)
        })

        this.linksRemove = new Collection()
        data.linksRemove.forEach(val => {
            let channel = this.client.channels.get(val)
            this.linksRemove.set(channel.channelId, channel)
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