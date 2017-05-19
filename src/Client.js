const EventEmitter = require('events').EventEmitter
const Connection = require('./Connection')
const util = require('./util')
const ServerSync = require('./handlers/ServerSync')
const UserState = require('./handlers/UserState')
const ChannelState = require('./handlers/ChannelState')

class Client extends EventEmitter {
    constructor(options = {}) {
        super()
        options.url = options.url || '127.0.0.1'
        options.port = options.port || '64738'
        options.rejectUnauthorized = options.rejectUnauthorized || false
        this.connection = new Connection(options)
        this.connection.on('connected', () => {
            this.connection.writeProto('Version', {
                version: util.encodeVersion(1, 0, 0),
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

        this.channels = {}
        this.users = {}

        this.connection.on('ServerSync', data => new ServerSync(this).handle(data))
        this.connection.on('UserState', data => new UserState(this).handle(data));
        this.connection.on('ChannelState', data => new ChannelState(this).handle(data));
        // this.connection.on('TextMessage', data => console.log(data));
        // this.connection.on('UserRemove', data => console.log(data));
        // this.connection.on('ChannelRemove', data => console.log(data));
    }

    _pingRoutine() {
        this.ping = setInterval(() => {
            this.connection.writeProto('Ping', {timestamp: Date.now()})
        }, 15000)
    }
}

module.exports = Client