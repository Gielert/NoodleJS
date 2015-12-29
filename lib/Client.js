"use strict"
var Connection = require('./Connection');
var users = require('./Users');
var channels = require('./Channels');
var TextMessage = require('./TextMessage');
var EventEmitter = require('events').EventEmitter;
var Events = require('./Events');

var Client = function(options) {
    this.connection = new Connection(options);
    this.connection.on('error', function(error) {
        console.log('Error connecting to server: ' + error);
        return;
    });

    this.synced = false;

    this._pingRoutine();

    var versionPacket = {
        version: encodeVersion(1, 2, 7),
        release: 'NoodleJS Client',
        os: 'Node.js',
        os_version: process.version
    };

    var authPacket = {
        username: options.name,
        password: options.password || '',
        opus: true,
        tokens: options.tokens || []
    };

    this.connection.writeProto('Version', versionPacket);
    this.connection.writeProto('Authenticate', authPacket);

    this.connection.on('ServerSync', this._onServerSync.bind(this));
    this.connection.on('UserState', this._onUserState.bind(this));
    this.connection.on('ChannelState', this._onChannelState.bind(this));
    this.connection.on('TextMessage', this._onTextMessage.bind(this));
    this.connection.on('UserRemove', this._onUserRemove.bind(this));
}

Client.prototype = Object.create( EventEmitter.prototype );

function encodeVersion(major, minor, patch) {
    return ((major & 0xffff) << 16) |  // 2 bytes major
        ((minor & 0xff) << 8) |  // 1 byte minor
        (patch & 0xff); // 1 byte patch
}

Client.prototype._onUserState = function(data) {
    if(!users.list[data.session]) {
        users.create(data, this);
        if(this.synced == true) {
            this.emit('userChange', Events.userChangeEvent(users.list[data.session], 'UserChangeConnected'));
        }
    } else {
        users.list[data.session].update(data);
    }
}

Client.prototype._onChannelState = function(data) {
    if(!channels.list[data.channel_id]) {
        channels.create(data);
    } else {
        channels.list[data.channel_id].update(data);
    }
}

Client.prototype._onTextMessage = function(data) {
    var message = new TextMessage(data);
    this.emit('textMessage', Events.textMessageEvent(message));
};

Client.prototype._onServerSync = function(data) {
    this.session = data.session;
    this.user = users.findBySession(data.session);
    this.synced = true;
};

Client.prototype._onUserRemove = function(data) {
    if(data.session && users.list[data.session]) {
        var user = users.list[data.session];
        this.emit('userChange', Events.userChangeEvent(user, 'UserChangeDisconnected'));
        delete users.list[user.session];
    }
}

Client.prototype._pingRoutine = function() {
    var self = this;
    setInterval(function() {
        self.connection.writeProto('Ping', { timestamp: Date.now() });
    }, 1000);
};

module.exports = Client;
