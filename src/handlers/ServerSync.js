const AbstractHandler = require('./AbstractHandler')
const Util = require('../Util')

class ServerSync extends AbstractHandler {
    handle(data) {
        let info = {}
        this.client.user = this.client.users.get(data.session)
        info.welcomeMessage = data.welcomeText
        info.maximumBitrate = data.maxBandwidth
        if (data.maxBandwidth != null) {
            const bitrate = Util.adjustNetworkBandwidth(data.maxBandwidth)
            this.client.connection.opusEncoder.setBitrate(bitrate)
        }

        this.client.synced = true
        
        /**
         * Emitted when the client is connected and ready
         * @event Client#ready
         * @param {ServerInfo} info The information from the server
         */
        this.client.emit('ready', info)
    }
}

module.exports = ServerSync
