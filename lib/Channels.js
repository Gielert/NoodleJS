var Channel = require('./Channel');
var Channels = {};

var create = function(id) {
    var channel = new Channel();
    channel.id = id;
    channel.links = {};
    channel.children = {};
    channel.users = {};
    this[id] = channel;
    return channel;
}

module.exports = {
    Channels: Channels,
    create: create
}
