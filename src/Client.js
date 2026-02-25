const EventEmitter = require('events').EventEmitter
const Promise = require('bluebird')
const Connection = require('./Connection')
const Util = require('./Util')
const Constants = require('./Constants')
const ServerSync = require('./handlers/ServerSync')
const UserState = require('./handlers/UserState')
const UserRemove = require('./handlers/UserRemove')
const ChannelState = require('./handlers/ChannelState')
const ChannelRemove = require('./handlers/ChannelRemove')
const TextMessage = require('./handlers/TextMessage')
const Collection = require('./structures/Collection')
const Dispatcher = require('./voice/Dispatcher')
const os = require('os')

/**
 * The main class for interacting with the Mumble server
 * @extends EventEmitter
 */
class Client extends EventEmitter {

    /**
     * @param  {ClientOptions} [options] Options for the client
     */
    constructor(options = {}) {
        super()

        this.pingStatsTCP = {
            avg: 0,
            var: 0,
            nb: 0
        }

        this.pingStatsUDP = {
            avg: 0,
            var: 0,
            nb: 0
        }

        /**
         * The options the client is instantiated with
         * @type {ClientOptions}
         */
        this.options = Util.mergeDefault(Constants.DefaultOptions, options)

        /**
         * The connection to the Mumble server
         * @type {Connection}
         * @private
         */
        this.connection = new Connection(this.options)
        this.connection.on('error', (error) => {
            this.emit('error', error)
        })

        this.connection.on('connected', () => {
            this.connection.writeProto('Version', {
                versionV1: Util.encodeVersion(1, 5, 0),
                versionV2: Util.encodeVersionV2(1, 5, 0),
                release: 'NoodleJS Client',
                os: os.version(),
                osVersion: os.release()
            })
            this.connection.writeProto('Authenticate', {
                username: this.options.name,
                password: this.options.password,
                opus: true,
                tokens: this.options.tokens,
                clientType: this.options.clientType || Constants.ClientTypes.Bot
            })
            this._pingRoutine()
        })

        /**
         * All of the {@link Channel} objects that are synced with the server,
         * mapped by their IDs
         * @type {Collection<id, Channel>}
         */
        this.channels = new Collection()

        /**
         * All of the {@link User} objects that are synced with the server,
         * mapped by their sessions
         * @type {Collection<session, User>}
         */
        this.users = new Collection()

        /**
         * The {@link Dispatcher} for the voiceConnection
         * @type {Dispatcher}
         */
        this.voiceConnection = null

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
        this.connection.on('TextMessage', data => textMessage.handle(data));
        
        this.connection.on('CryptSetup', (data) => {
            this.connection.cryptState.setKey(data.key, data.clientNonce, data.serverNonce)
            this._ping()
        })
        
        this.connection.on('Ping', data => {
            const now = Date.now()
            const rtt = now - data.timestamp

            const type = data.udp ? 'UDP' : 'TCP'

            // Update stats (average and variance) for the next ping packet
            this[`pingStats${type}`].var = ((this[`pingStats${type}`].nb * this[`pingStats${type}`].var) + ((rtt - this[`pingStats${type}`].avg) * (rtt - this[`pingStats${type}`].avg))) / (this[`pingStats${type}`].nb + 1)
            this[`pingStats${type}`].avg = ((this[`pingStats${type}`].nb * this[`pingStats${type}`].avg) + rtt) / (this[`pingStats${type}`].nb + 1)
            this[`pingStats${type}`].nb += 1
        })

        this.connection.on('voiceData', (voiceData) => {
            this.emit('voiceData', voiceData)
        })

        this.connection.on("CodecVersion", (data) => {
            if (data.opus) {
                this.voiceConnection = new Dispatcher(this)
            } else {
                console.log("Warning: Server does not support Opus codec, voice features will not work")
            }
        });
    }

    _ping() {
        const now = Date.now()
        this.connection.writeProto('Ping', {
            timestamp: now,
            tcp_ping_avg: this.pingStatsTCP.avg,
            tcp_ping_var: this.pingStatsTCP.var,
            tcp_packets: this.pingStatsTCP.nb,
            udp_ping_avg: this.pingStatsUDP.avg,
            udp_ping_var: this.pingStatsUDP.var,
            udp_packets: this.pingStatsUDP.nb
        })
        this.connection.writeProtoUDP('Ping', {
            timestamp: now
        });
    }

    /**
     * The ping routine for the client to keep the connection alive
     * 10 seconds is the recommended interval according to the Mumble protocol
     * @private
     */
    _pingRoutine() {
        this.ping = setInterval(() => {
            this._ping()
        }, 10000)
    }

    connect() {
        this.connection.connect()
    }

    /**
     * Sends a message to the {@link Channel} where the client is currently
     * connected
     * @param  {String} message   The message to be sent
     * @param  {Boolean} recursive If the message should be sent down the tree
     * @return {Promise<TextMessage>}
     */
    sendMessage(message, recursive) {
        return this.user.channel.sendMessage(message, recursive)
    }

    /**
     * Switches to another channel
     * @param  {Number} id         The id of the channel to switch to
     * @return {Promise<any>}
     */
    switchChannel(id) {
        if (this.channels.has(id)) {
            return this.connection.writeProto('UserState', {session: this.user.session, actor: this.user.session , channelId: id})
        } else {
            return Promise.reject('ChannelId unknown')
        }
    }

    /**
     * Starts listening to another channel without joining it
     * @param  {Number} id         The id of the channel to start listening to
     * @return {Promise<any>}
     */
    startListeningToChannel(id) {
        if (this.channels.has(id)) {
            return this.connection.writeProto('UserState', {session: this.user.session, listeningChannelAdd: [id]})
        } else {
            return Promise.reject('ChannelId unknown')
        }
    }

    /**
     * Stops listening to another channel
     * @param  {Number} id         The id of the channel to stop listening to
     * @return {Promise<any>}
     */
    stopListeningToChannel(id) {
        if (this.channels.has(id)) {
            return this.connection.writeProto('UserState', {session: this.user.session, listeningChannelRemove: [id]})
        } else {
            return Promise.reject('ChannelId unknown')
        }
    }

    /**
     * Set up a voiceTarget to be optionally used when sending voice data
     * @param  {Number} targetId       The id for this voiceTarget. Must be between 4 and 30
     * @param  {Array.<Number>} userIds  Array of user sessions to send to. Can be empty.
     * @param  {Number} channelId      ChannelId to send to. Ignored when userIds is not empty.
     * @return {Promise<any>}
     */
    setupVoiceTarget(targetId, userIds, channelId) {
        if (targetId < 4 || targetId > 30) {
            return Promise.reject('targetId must be between 3 and 30')
        }

        if (userIds.length) {
            for (var idx in userIds) {
                if (!this.users.has(userIds[idx])) {
                    return Promise.reject('userId ' + userIds[idx] + ' unknown')
                }
            }
            return this.connection.writeProto('VoiceTarget', {id: targetId, targets: [{session: userIds}]})
        } else {
            if (!this.channels.has(channelId)) {
                return Promise.reject('ChannelId unknown')
            }
            return this.connection.writeProto('VoiceTarget', {id: targetId, targets: [{channelId: channelId}]})
        }
    }

    mute() {
        this.connection.writeProto('UserState', {session: this.user.session, actor: this.user.session , selfMute: true})
    }

    unmute() {
        this.connection.writeProto('UserState', {session: this.user.session, actor: this.user.session, selfMute: false})
    }

    destroy() {
        try {
            clearInterval(this.ping)
            this.connection.close()
            return Promise.resolve()
        } catch(e) {
            return Promise.reject(e)
        }
    }

}

module.exports = Client
