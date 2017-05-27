const DispatchStream = require('./DispatchStream')
const ffmpeg = require('fluent-ffmpeg')

class Dispatcher {
    constructor(connection) {
        this.dispatchStream = new DispatchStream(connection)
    }

    playFile(filename) {
        const command = ffmpeg(filename)
            .output(this.dispatchStream)
            .audioFrequency(48000)
            .audioChannels(1)
            .format('s16le')
            .on('error', function(e) {
                console.error(e)
            })
            .on('end', () => {
                console.log("cs")
            })
            .run()
    }

    playStream(stream) {
        const command = ffmpeg(stream)
            .output(this.dispatchStream)
            .audioFrequency(48000)
            .audioChannels(1)
            .format('s16le')
            .on('error', function(e) {
                console.error(e)
            })
            .run()
    }
}

module.exports = Dispatcher
