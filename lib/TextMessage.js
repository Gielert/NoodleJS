var users = require('./Users');
var channels = require('./Channels');

var TextMessage = function(data) {
    this.sender = users.findBySession(data.actor);
    this.users = data.session;
    var chs = []
    for(var id in data.channel_id) {
        chs.push(channels.findById(id));
    }
    this.channels = chs;
    this.message = data.message;
};

module.exports = TextMessage;
