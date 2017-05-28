const DispatchStream = require('./DispatchStream')
const ffmpeg = require('fluent-ffmpeg')

class Dispatcher {
    constructor(connection) {
        this.dispatchStream = new DispatchStream(connection)
    }

    playFile(filename) {
        this.play(filename)
    }

    playStream(stream) {
        this.play(stream)
    }

    play(unknown) {
        this.command = ffmpeg(unknown)
            .output(this.dispatchStream)
            .audioFrequency(48000)
            .audioChannels(1)
            .format('s16le')
            .on('error', function(e) {
                console.error(e)
            })
        this.command.run()
    }

    stop() {
        if (this.command)
            this.command.kill()
    }
}

module.exports = Dispatcher
