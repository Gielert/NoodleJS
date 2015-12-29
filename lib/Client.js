"use strict"
var Connection = require('./Connection');
var users = require('./Users');
var channels = require('./Channels');
var TextMessage = require('./TextMessage');
var EventEmitter = require('events').EventEmitter;
var Handler = require('./Handler');

var Client = function(options) {
    this.connection = new Connection(options);
    this.connection.on('error', function(error) {
        console.log('Error connecting to server: ' + error);
        return;
    });

    this.synced = false;

    this.channels = channels;
    this.users = users

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

    this.handler = new Handler(this);

    this.connection.on('ServerSync', this.handler.handleServerSync);
    this.connection.on('UserState', this.handler.handleUserState);
    this.connection.on('ChannelState', this.handler.handleChannelState);
    // this.connection.on('TextMessage', this.handler.handleTextMessage);
    // this.connection.on('UserRemove', this.handler.handleUserRemove);
}

Client.prototype = Object.create( EventEmitter.prototype );

function encodeVersion(major, minor, patch) {
    return ((major & 0xffff) << 16) |  // 2 bytes major
        ((minor & 0xff) << 8) |  // 1 byte minor
        (patch & 0xff); // 1 byte patch
}

Client.prototype.sendMessage = function(message) {
    message.writeMessage(this);
}

Client.prototype._pingRoutine = function() {
    var self = this;
    setInterval(function() {
        self.connection.writeProto('Ping', { timestamp: Date.now() });
    }, 1000);
};

module.exports = Client;
