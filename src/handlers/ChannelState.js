const AbstractHandler = require('./AbstractHandler')
const Channel = require('../Channel')

class ChannelState extends AbstractHandler {
    handle(data) {
        if (data.channelId == null)
            return client.emit('error', 'Incomplete Protobuf')

        let channelId = data.channelId
        let channel = this.client.channels[channelId] || new Channel(channelId)
        this.client.channels[channelId] = channel
        channel.client = this.client

        if (data.parent) {
            if(channel.parent)
                delete channel.parent.children[channelId]

            let newParent = this.client.channels[data.parent]
            if(newParent != channel.parent)
                channel.parent.children[channelId] = channel
        }

        if (data.name)
            channel.name = data.name

        if (data.description)
            channel.description = data.description

        if(data.position)
            channel.position = data.position

        if (data.descriptionHash)
            channel.descriptionHash = data.descriptionHash

    }
}

module.exports = ChannelState