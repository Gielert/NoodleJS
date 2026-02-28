const EventEmitter = require('events').EventEmitter
const DispatchStream = require('./DispatchStream')
const ffmpeg = require('fluent-ffmpeg')

class Dispatcher extends EventEmitter {
    constructor(client) {
        super()
        this.client = client
        this.connection = this.client.connection
        this.volume = 1
    }

    playFile(filename, voiceTarget) {
        this.play(filename, voiceTarget)
    }

    playStream(stream, voiceTarget) {
        this.play(stream, voiceTarget)
    }

    play(unknown, voiceTarget) {
        this.dispatchStream = new DispatchStream(this.connection, voiceTarget)
        this.dispatchStream.volume = this.volume
        this.dispatchStream.once('finish', () => {
            this.emit('end')
        })
        this.command = ffmpeg(unknown)
            .output(this.dispatchStream)
            .audioFrequency(48000)
            .audioChannels(1)
            .format('s16le')
            .on('error', (e) => {
                this.emit('error', e)
            })
        this.command.run()
    }

    setVolume(volume) {
        this.volume = volume
        if (this.dispatchStream) {
            this.dispatchStream.volume = volume
        }
    }

    getVolume() {
        return this.volume
    }

    stopStream() {
        if(this.dispatchStream)
            this.dispatchStream.close()
    }

    stop() {
        if (this.command)
            this.command.kill()
    }
}

module.exports = Dispatcher
