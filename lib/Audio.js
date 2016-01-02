var ffmpeg = require('fluent-ffmpeg');

var Audio = function(conn, filename) {
    this.connection = conn;
    this.stream = null;
    this.filename = filename;
}

Audio.prototype.play = function() {
    this.stream = this.connection.voiceStream();
    var command = ffmpeg(this.filename)
    .output(this.stream)
    .audioFrequency(48000)
    .audioChannels(1)
    .format('s16le')
    .on('error', function(e) {
        console.error(e)
    })
    .run();
}

Audio.prototype.stop = function() {
    this.stream.close();
}

Audio.prototype.setVolume = function(volume) {
    if(this.stream != null) {
        this.stream.volume = volume;
    }
}

module.exports = Audio;
