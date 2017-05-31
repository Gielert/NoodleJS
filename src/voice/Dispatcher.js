const EventEmitter = require('events').EventEmitter
const DispatchStream = require('./DispatchStream')
const ffmpeg = require('fluent-ffmpeg')

class Dispatcher extends EventEmitter {
    constructor(client) {
        super()
        this.client = client
        this.connection = this.client.connection
    }

    playFile(filename) {
        this.play(filename)
    }

    playStream(stream) {
        this.play(stream)
    }

    play(unknown) {
        const dispatchStream = new DispatchStream(this.connection)
        dispatchStream.once('finish', () => {
            this.emit('end')
        })
        this.command = ffmpeg(unknown)
            .output(dispatchStream)
            .audioFrequency(48000)
            .audioChannels(1)
            .format('s16le')
            .on('error', (e) => {
                this.emit('error', e)
            })
        this.command.run()
    }

    stop() {
        if (this.command)
            this.command.kill()
    }
}

module.exports = Dispatcher
