var Channel = require('./Channel');
var Channels = function() {};

Channels.prototype.create = function(id) {
    var channel = new Channel();
    channel.id = id;
    channel.name = null;
    channel.links = {};
    channel.children = {};
    channel.users = {};
    this[id] = channel;
    return channel;
}

module.exports = Channels
