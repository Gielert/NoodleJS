var ffmpeg = require('fluent-ffmpeg');

var Audio = function(conn, filename, volume) {
    this.connection = conn;
    this.stream = null;
    this.filename = filename;
    this.volume = volume || 1;
}

Audio.prototype.play = function() {
    this.stream = this.connection.voiceStream();
    console.log(this.volume);
    this.stream.volume = this.volume;
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
    this.volume = volume;
    if(this.stream != null) {
        this.stream.volume = volume;
    }
}

module.exports = Audio;
