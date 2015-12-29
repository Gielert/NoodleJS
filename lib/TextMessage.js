var users = require('./Users');
var channels = require('./Channels');

var TextMessage = function() {
    return {
        writeMessage: function(client) {
            var textMessagePacket = {};

            textMessagePacket.message = this.message;

            if(this.users != null) {
                textMessagePacket.session = [];
                this.users.forEach(function(user) {
                    textMessagePacket.session.push(user.session);
                });
            }

            if(this.channels != null) {
                textMessagePacket.channel_id = [];
                for(var channel in this.channels) {
                    textMessagePacket.channel_id.push(channel.id);
                }
            }

            if(this.trees != null) {
                textMessagePacket.tree_id = [];
                for(var channel in this.trees) {
                    textMessagePacket.tree_id.push(channel.id);
                }
            }

            client.connection.writeProto('TextMessage', textMessagePacket);
        }
    };
};

module.exports = TextMessage;
