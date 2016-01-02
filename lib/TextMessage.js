var TextMessage = function() {
    this.sender;
    this.users;
    this.channels;
    this.trees;
    this.message;
    this.writeMessage = function(client) {
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
            this.channels.forEach(function(channel) {
                textMessagePacket.channel_id.push(channel.id);
            });
        }

        if(this.trees != null) {
            textMessagePacket.tree_id = [];
            this.trees.forEach(function(channel) {
                textMessagePacket.tree_id.push(channel.id);
            });
        }
        client.connection.writeProto('TextMessage', textMessagePacket);
    }
};

module.exports = TextMessage;
