const WritableStream = require('stream').Writable
const EventEmitter = require('events').EventEmitter
const Constants = require('../Constants')

class DispatchStream extends WritableStream {
    constructor(connection) {
        super()
        this.connection = connection
        this.processObserver = new EventEmitter()
        this.processInterval = setInterval(
            this._processAudioBuffer.bind(this),
            Constants.Audio.frameLength
        )

        this.frameQueue = []
        this.lastFrame = this._createFrameBuffer()

        this.volume = 1
        this.lastFrameWritten = 0
        this.lastWrite = null
    }

    close() {
        clearInterval(this.processInterval)
    }

    _createFrameBuffer() {
        return new Buffer(Constants.Audio.frameSize * 2)
    }

    _processAudioBuffer() {
        if(!this.lastWrite ||
           this.lastWrite + 20 * Constants.Audio.frameLength < Date.now()) {
           this.voiceSequence = this.connection.voiceSequence
           this.lastWrite = Date.now()
           return
       }

       while (this.lastWrite + Constants.Audio.frameLength < Date.now()) {
           if (this.frameQueue.length > 0) {
               const frame = this.frameQueue.shift()

               if (this.frameQueue.length < 1)  {
                   this.voiceSequence += this.connection.writeAudio(
                       frame,
                       this.whisperId,
                       this.connection.codec,
                       this.voiceSequence,
                       true
                   )
               } else {
                   this.voiceSequence += this.connection.writeAudio(
                       frame,
                       this.whisperId,
                       this.connection.codec,
                       this.voiceSequence,
                       false
                   )
               }
               this.processObserver.emit('written')
           }

           this.lastWrite += Constants.Audio.frameLength
       }

       return
    }

    _write(chunk, encoding, next) {
        while(true) {
            if(this.frameQueue.length >= Constants.Audio.frameLength) {
                this.processObserver.once('written', () => {
                    this._write(chunk, encoding, next)
                })
                return
            }

            const writtenBefore = this.lastFrameWritten
            chunk.copy(this.lastFrame, this.lastFrameWritten, 0)
            let written = writtenBefore + chunk.length

            if( written >= this.lastFrame.length ) {
                written = this.lastFrame.length
                this.frameQueue.push(this.lastFrame)
                this.lastFrame = this._createFrameBuffer()
                this.lastFrameWritten = 0
            } else {
                this.lastFrameWritten = written
            }

            if(chunk.length > (written - writtenBefore)) {
                chunk = chunk.slice(written - writtenBefore)
            } else {
                return next()
            }

        }
    }
}

module.exports = DispatchStream
