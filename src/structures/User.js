class User {

    constructor(client, data) {
        Object.defineProperty(this, 'client', {value: client})

        if (data) this.setup(data)
    }

    setup(data) {
        for (const prop of [
            'session', 'name', 'mute', 'deaf',
            'suppress', 'selfMute', 'selfDeaf', 'texture', 'pluginContext',
            'pluginIdentity', 'comment', 'hash', 'commentHash', 'textureHash',
            'prioritySpeaker', 'recording'
        ]) {
            if (data[prop] != null) this[prop] = data[prop]
        }

        if (data.userId != null)
            this.id = data.userId

        if (data.channelId != null) {
            this.channel = this.client.channels.get(data.channelId)
        } else {
            this.channel = this.client.channels.get(0)
        }

        if (data.actor != null)
            this.actor = this.client.users.get(data.actor)
    }

    sendMessage() {

    }

}

module.exports = User