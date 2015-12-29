
var Channel = require('./Channel');

module.exports.list = {};

module.exports.create = function(data) {
    var channel = new Channel(data);
    this.list[data.channel_id] = channel;
};

module.exports.findById = function(id) {
    return this.list[id];
};
