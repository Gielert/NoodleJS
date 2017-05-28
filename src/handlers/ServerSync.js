const AbstractHandler = require('./AbstractHandler')
const Util = require('../Util')

class ServerSync extends AbstractHandler {
    handle(data) {
        let event = {}
        this.client.user = this.client.users.get(data.session)
        event.welcomeMessage = data.welcomeText
        event.maximumBitrate = data.maxBandwidth
        if (data.maxBandwidth != null) {
            const bitrate = Util.adjustNetworkBandwidth(data.maxBandwidth)
            this.client.connection.opusEncoder.setBitrate(bitrate)
        }

        this.client.synced = true
        this.client.emit('ready', event)
    }
}

module.exports = ServerSync
