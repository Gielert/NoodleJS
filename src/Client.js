const EventEmitter = require('events').EventEmitter
const Connection = require('./Connection')
const Util = require('./Util')
const ServerSync = require('./handlers/ServerSync')
const UserState = require('./handlers/UserState')
const UserRemove = require('./handlers/UserRemove')
const ChannelState = require('./handlers/ChannelState')
const ChannelRemove = require('./handlers/ChannelRemove')
const TextMessage = require('./handlers/TextMessage')
const Collection = require('./structures/Collection')

class Client extends EventEmitter {
    constructor(options = {}) {
        super()
        options.url = options.url || '127.0.0.1'
        options.port = options.port || '64738'
        options.rejectUnauthorized = options.rejectUnauthorized || false
        this.connection = new Connection(options)
        this.connection.on('connected', () => {
            this.connection.writeProto('Version', {
                version: Util.encodeVersion(1, 0, 0),
                release: 'NoodleJS Client',
                os: 'NodeJS',
                os_version: process.version
            })
            this.connection.writeProto('Authenticate', {
                username: 'NoodleJS',
                password: options.password || '',
                opus: true,
                tokens: options.tokens || []
            })
            this._pingRoutine()
        })

        this.channels = new Collection()
        this.users = new Collection()

        const serverSync = new ServerSync(this)
        const userState = new UserState(this)
        const userRemove = new UserRemove(this)
        const channelState = new ChannelState(this)
        const channelRemove = new ChannelRemove(this)
        const textMessage = new TextMessage(this)

        this.connection.on('ServerSync', data => serverSync.handle(data))
        this.connection.on('UserState', data => userState.handle(data))
        this.connection.on('UserRemove', data => userRemove.handle(data));
        this.connection.on('ChannelRemove', data => channelRemove.handle(data));
        this.connection.on('ChannelState', data => channelState.handle(data))
        // this.connection.on('CryptSetup', data => console.log(data))
        this.connection.on('TextMessage', data => textMessage.handle(data));
    }

    _pingRoutine() {
        this.ping = setInterval(() => {
            this.connection.writeProto('Ping', {timestamp: Date.now()})
        }, 15000)
    }

    sendMessage(message, recursive) {
        return this.user.channel.sendMessage(message, recursive)
    }

}

module.exports = Client