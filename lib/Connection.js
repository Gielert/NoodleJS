"use strict"

var tls = require('tls');
var Proto = require('./MumbleProto');
var EventEmitter = require('events').EventEmitter;
var OpusEncoder = require('node-opus').OpusEncoder;
var AudioStream = require('./AudioStream');
var util = require('./util');

var Connection = function(options) {
    var self = this;
    this.url = options.url || "127.0.0.1";
    this.port = options.port || 64738;
    options.rejectUnauthorized = false;

    this.socket = tls.connect(this.port, this.url, options, function(error) {
        //self.emit('error', error);
    });

    this.buffers = [];
    this.length = 0;
    this.readers = [];
    this.voiceSequence = 0;

    this.opusEncoder = new OpusEncoder( this.SAMPLE_RATE );
    this.currentEncoder = this.opusEncoder;
    this.codec = Connection.codec.Opus;

    this.socket.on('data', function(data) {
        self._onReceiveData(data);
    });

    this.socket.on('error', function(error) {
        self.socket.destroy();
    });

    this.socket.on('close', function() {
        console.log("Socket has been closed!\nExiting...");
        process.exit(1);
    })

    this._waitForPrefix(this);

};

Connection.codec = { Opus: 4 };

Connection.prototype = Object.create( EventEmitter.prototype );

Connection.prototype.SAMPLE_RATE = 48000;
Connection.prototype.FRAME_LENGTH = 10;
Connection.prototype.FRAME_SIZE = 48000 / 100;
Connection.prototype.MAX_FRAME_SIZE = 48000 / 1000 * 60;
Connection.prototype.DATA_BYTES = 40;
Connection.prototype.CHANNELS = 1;

Connection.prototype._waitForPrefix = function () {
    var self = this;

    this.read(6, function (data) {
        var type = data.readUInt16BE(0);
        var length = data.readUInt32BE(2);

        self.read(length, function (data) {
            self._processData(type, data);
            self._waitForPrefix();
        });
    });
};

/**
 * Connection.prototype._WritePacket - Write a buffer to the socket
 *
 * @param  {Buffer} buffer Data buffer to write
 */
Connection.prototype._writePacket = function(buffer) {
    this.socket.write(buffer);
};

Connection.prototype._onReceiveData = function (data) {
    this.buffers.push(data);
    this.length += data.length;
    this._checkReader();
};

Connection.prototype.read = function (length, callback) {
    this.readers.push({ length: length, callback: callback });
    if (this.readers.length === 1) { this._checkReader(); }
};

Connection.prototype._checkReader = function () {

    if (this.readers.length === 0) { return; }

    var reader = this.readers[0];
    if (this.length < reader.length) { return; }

    var buffer = new Buffer(reader.length);
    var written = 0;

    while (written < reader.length) {

        var received = this.buffers[0];

        var remaining = reader.length - written;
        if (received.length <= remaining) {

            received.copy(buffer, written);
            written += received.length;

            this.buffers.splice(0, 1);
            this.length -= received.length;
        } else {

            received.copy(buffer, written, 0, remaining);
            written += remaining;

            this.buffers[0] = received.slice(remaining);
            this.length -= remaining;
        }
    }
    this.readers.splice(0, 1);
    reader.callback(buffer);
};

Connection.prototype.voiceStream = function() {
    return new AudioStream(this);
}

Connection.prototype._processData = function (type, data) {
    if( Proto.nameById[ type ] === 'UDPTunnel' ) {

    } else {
        var msg = Proto.DecodePacket(type, data);
        this._processMessage(type, msg);
    }
};

Connection.prototype._processMessage = function( type, msg ) {
    this.emit(Proto.nameById[type], msg);
};

Connection.prototype.writeAudio = function (packet, whisperTarget, codec, voiceSequence, final) {
    packet = this.currentEncoder.encode(packet);

    var type = codec === Connection.codec.Opus ? 4 : 0;
    var target = whisperTarget || 0;
    var typetarget = type << 5 | target;

    if(typeof voiceSequence !== 'number')
        voiceSequence = this.voiceSequence;

    var packetLength = packet.length;

    var lengthVarint = util.toVarint(packetLength);
    var sequenceVarint = util.toVarint(voiceSequence);

    var header = new Buffer(1 + sequenceVarint.length + lengthVarint.length);
    header[0] = typetarget;
    sequenceVarint.value.copy(header, 1, 0);
    lengthVarint.value.copy(header, 1 + sequenceVarint.length, 0);

    if(codec === Connection.codec.Opus) {
        if(packet.length > 0x1FFF) {
            throw new TypeError("Audio frame too long! Opus max length " + 0x1FFF + " bytes.");
        }
    } else {
        throw new TypeError( "Celt is not supported!" );
    }

    voiceSequence++;

    this.writeHeader(Proto.idByName.UDPTunnel, header.length + packetLength);
    this._writePacket(header);
    this._writePacket(packet);

    if( voiceSequence > this.voiceSequence ) {
        this.voiceSequence = voiceSequence;
    }

    return 1;
};

Connection.prototype.writeHeader = function(type, data) {
    var header = new Buffer(6);
    header.writeUInt16BE(type, 0);
    header.writeUInt32BE(data, 2);
    this._writePacket(header);
}

Connection.prototype.writeProto = function(type, data) {
    var msg = Proto.EncodePacket(type, data);
    var packet = msg.toBuffer();
    this.writeHeader(Proto.idByName[type], packet.length);
    this._writePacket(packet);
}

module.exports = Connection;
