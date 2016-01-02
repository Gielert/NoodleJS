var ffmpeg = require('fluent-ffmpeg');

var Audio = function(conn, filename) {
    this.connection = conn;
    this.playing = false;
    this.filename = filename
    this.stream = null;
}

Audio.prototype.play = function() {
    if(this.stream != null) {
        this.stream.close();
    }
    this.stream = this.connection.voiceStream();
    var self = this;
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

module.exports = Audio;
