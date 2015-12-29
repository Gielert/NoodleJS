"use strict"

var tls = require('tls');
var Proto = require('./MumbleProto');
var EventEmitter = require('events').EventEmitter;


/**
 * Connection - Sets up the connection to the Mumble server
 *
 * @param  {object} options The options to connection to the server
 */
var Connection = function(options) {
    var self = this;
    this.url = options.url;
    this.port = options.port || 64738;
    options.rejectUnauthorized = false;
    this.socket = tls.connect(this.port, this.url, options, function(error) {
        this.emit(error);
    });

    this.buffers = [];
    this.length = 0;
    this.readers = [];

    this.socket.on('data', function(data) {
        self._onReceiveData(data);
    });

    this._waitForPrefix(this);

};

Connection.prototype = Object.create( EventEmitter.prototype );

Connection.prototype._waitForPrefix = function () {
    var self = this;

    // Read 6 byte prefix.
    this.read(6, function (data) {
        var type = data.readUInt16BE(0);
        var length = data.readUInt32BE(2);

        // Read the rest of the message based on the length prefix.
        self.read(length, function (data) {
            self._processData(type, data);

            // Wait for the next message.
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

    // If there are no readers we'll wait for more.
    if (this.readers.length === 0) { return; }

    // If there's less data than the foremost reader requires, wait for more.
    var reader = this.readers[0];
    if (this.length < reader.length) { return; }

    // Allocate the buffer for the reader.
    var buffer = new Buffer(reader.length);
    var written = 0;

    // Gather the buffer contents from the queued data fragments.
    while (written < reader.length) {

        // Take the first unprocessed fragment.
        var received = this.buffers[0];

        // Calculate the amount of data missing from the reader buffer.
        var remaining = reader.length - written;
        if (received.length <= remaining) {

            // Write the current fragment in whole to the output buffer if
            // it is smaller than or equal in size to the data we require.
            received.copy(buffer, written);
            written += received.length;

            // We wrote the whole buffer. Remove it from the socket.
            this.buffers.splice(0, 1);
            this.length -= received.length;
        } else {

            // The current fragment is larger than what the reader requires.
            // Write only part of it to the buffer.
            received.copy(buffer, written, 0, remaining);
            written += remaining;

            // Slice the written part off the fragment.
            this.buffers[0] = received.slice(remaining);
            this.length -= remaining;
        }
    }
    this.readers.splice(0, 1);
    reader.callback(buffer);
};


Connection.prototype._processData = function (type, data) {
    if( Proto.nameById[ type ] === 'UDPTunnel' ) {
        console.log("UDP PACKET");
    } else {
        var msg = Proto.DecodePacket(type, data);
        this._processMessage(type, msg);
    }
};

Connection.prototype._processMessage = function( type, msg ) {
    this.emit(Proto.nameById[type], msg);
};

Connection.prototype.writeProto = function(type, data) {
    var msg = Proto.EncodePacket(type, data);
    var packet = msg.toBuffer();

    var header = new Buffer(6);
    header.writeUInt16BE(Proto.idByName[type], 0);
    header.writeUInt32BE(packet.length, 2);

    this._writePacket(header);
    this._writePacket(packet);
}

module.exports = Connection;
