"use strict"
var WritableStream = require('stream').Writable;
var EventEmitter = require('events').EventEmitter;

var AudioStream = function(connection) {
    this.connection = connection;

    this.processObserver = new EventEmitter();
    this.processInterval = setInterval(
        this._processAudioBuffer.bind( this ),
        this.connection.INTERVAL );

    this.frameQueue = [];

    this.lastFrame = this._createFrameBuffer();

    this.lastFrameWritten = 0;
    this.lastWrite = null;

    WritableStream.call( this );
}

AudioStream.prototype = Object.create( WritableStream.prototype );

AudioStream.prototype.LOCAL_BUFFER_SIZE = 10;

AudioStream.prototype.close = function () {
    clearInterval( this.processInterval );
};

AudioStream.prototype._createFrameBuffer = function() {
    return new Buffer(this.connection.FRAME_SIZE * 2);
};

AudioStream.prototype._processAudioBuffer = function() {
    if( !this.lastWrite ||
        this.lastWrite + 20*this.connection.FRAME_LENGTH < Date.now() ) {
        this.voiceSequence = this.connection.voiceSequence;
        this.lastWrite = Date.now();
        return;
    }

    while( this.lastWrite + this.connection.FRAME_LENGTH < Date.now() ) {
        if( this.frameQueue.length > 0 ) {

            var frame = this.frameQueue.shift();
            if(this.frameQueue.length < 1) {
                this.voiceSequence += this.connection.writeAudio(frame, this.whisperId, this.connection.codec, this.voiceSequence, true);
            } else {
                this.voiceSequence += this.connection.writeAudio(frame, this.whisperId, this.connection.codec, this.voiceSequence, false);
            }
            this.processObserver.emit('written');
        }

        this.lastWrite += this.connection.FRAME_LENGTH;
    }

    return;
};

AudioStream.prototype._write = function(chunk, encoding, callback) {
    while( true ) {

        // If we are at the buffer cap, wait until the buffer is emptied
        // before writing the rest.
        if( this.frameQueue.length >= this.LOCAL_BUFFER_SIZE ) {
            var self = this;
            this.processObserver.once( 'written', function () {
                self._write( chunk, encoding, callback );
            });
            return;
        }

        // Write the chunk to the current buffer.
        var writtenBefore = this.lastFrameWritten;
        chunk.copy( this.lastFrame, this.lastFrameWritten, 0 );
        var written = writtenBefore + chunk.length;

        // Check if we've written the last frame full.
        if( written >= this.lastFrame.length ) {

            // Frame is full.
            // Fix the 'written' value and queue the frame.
            written = this.lastFrame.length;
            this.frameQueue.push( this.lastFrame );
            this.lastFrame = this._createFrameBuffer();
            this.lastFrameWritten = 0;

        } else {

            // Frame not full. Advance the lastFrameWritten.
            this.lastFrameWritten = written;

        }

        // Check if the chunk was written in full or if some remains.
        if( chunk.length > (written - writtenBefore) ) {

            // Chunk was larger than remaining space in the last frame.
            chunk = chunk.slice( written - writtenBefore );

        } else {

            // Chunk was written completely.
            return callback();

        }

    }
};


module.exports = AudioStream;
