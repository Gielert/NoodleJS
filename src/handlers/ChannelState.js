const AbstractHandler = require('./AbstractHandler')
const Channel = require('../Channel')
const Util = require('../Util')

class ChannelState extends AbstractHandler {
    handle(data) {
        let channel = this.client.channels.get(data.channelId)

        if(channel) {
            const oldChannel = new Channel(this.client, channel)
            channel.setup(data)
            if (this.client.synced) this.client.emit('channelUpdate', oldChannel, channel)
        } else {
            channel = new Channel(this.client, data)
            if (this.client.synced) this.client.emit('channelCreate', channel)
        }

        this.client.channels.set(channel.channelId, channel)
    }
}

module.exports = ChannelState
