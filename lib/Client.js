"use strict"
var Connection = require('./Connection');
var Users = require('./Users');
var Channels = require('./Channels');
var TextMessage = require('./TextMessage');
var EventEmitter = require('events').EventEmitter;
var Handler = require('./Handler');
var Audio = require('./Audio');

var Client = function(options) {
    this.connection = new Connection(options);
    this.connection.on('error', function(error) {
        console.log('Error connecting to server: ' + error);
        return;
    });

    this.synced = false;
    this.audio = null;
    this.channels = new Channels();
    this.users = new Users();
    this.volume = 1;

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

    this.audio = null;

    this.connection.on('ServerSync', this.handler.handleServerSync);
    this.connection.on('UserState', this.handler.handleUserState);
    this.connection.on('ChannelState', this.handler.handleChannelState);
    this.connection.on('TextMessage', this.handler.handleTextMessage);
    this.connection.on('UserRemove', this.handler.handleUserRemove);
    this.connection.on('ChannelRemove', this.handler.handleChannelRemove);
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

Client.prototype.setVolume = function(volume) {
    this.volume = volume;
    if(this.audio != null) {
        this.audio.setVolume(this.volume);
    }
}

Client.prototype.playAudio = function(filename) {
    if(this.audio != null) {
        this.audio.stop();
    }
    this.audio = new Audio(this.connection, filename, this.volume);
    this.audio.play();
}

Client.prototype.stopAudio = function() {
    if(this.audio != null) {
        this.audio.stop();
    }
}

Client.prototype._pingRoutine = function() {
    var self = this;
    setInterval(function() {
        self.connection.writeProto('Ping', { timestamp: Date.now() });
    }, 1000);
};

module.exports = Client;
