const AbstractHandler = require('./AbstractHandler')

class ServerSync extends AbstractHandler {
    handle(data) {
        let event = {}
        if (data.session)
            this.client.self = this.client.users[data.session]

        if (data.welcomeText)
            event.welcomeMessage = data.welcomeText

        if (data.maxBandwidth)
            event.maximumBitrate = data.maxBandwidth

        this.client.synced = true
        this.client.emit('connect', event)
    }
}

module.exports = ServerSync