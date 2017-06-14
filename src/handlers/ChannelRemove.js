const AbstractHandler = require('./AbstractHandler')

class ChannelRemove extends AbstractHandler {
    handle(data) {
        let channel = this.client.channels.get(data.channelId)

        if(channel) {
            this.client.channels.delete(channel.id)
            if (this.client.synced) this.client.emit('channelRemove', channel.id)
        }

    }
}

module.exports = ChannelRemove
