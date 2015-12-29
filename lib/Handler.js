var Channel = require('./Channel');
var events = require('./Events');
var client;
var Handler = function(c) {
    client = c;
};

Handler.prototype.handleUserState = function(data) {
    if(data.session === null) {
        return client.emit('error', 'Incomplete Protobuf');
    }

    var event = events.userChangeEvent;

    var session = data.session;
    var user = client.users[session];
    if (user == null) {
        user = client.users.create(session);
        user.channel = client.channels[0];
        user.client = client;
        event.type = 'UserChangeConnected';
        if(user.channel == null) {
            return client.emit('error', 'Invalid Protobuf');
        }
        event.type = 'UserChangeChannel';
    }

    event.user = user;

    if(data.name != null) {
        user.name = data.name;
        event.type = 'UserChangeName';
    }

    if(data.user_id != null) {
        user.id = data.user_id;
        event.type = 'UserChangeRegistered'
    }

    if(data.channel_id != null) {
        if(user.channel != null) {
            delete user.channel.users[user.session];
        }
        var newChannel = client.channels[data.channel_id];
        if(newChannel == null) {
            return client.emit('error', 'Invalid Protobuf');
        }
        if(newChannel != user.channel) {
            user.channel = newChannel;
            event.type = 'UserChangeChannel';
        }
        user.channel.users[user.session] = user;
    }

    if(data.mute != null) {
        user.mute =  data.mute;
        event.type = 'UserChangeAudio';
    }

    if(data.deaf != null) {
        user.deaf =  data.deaf;
        event.type = 'UserChangeAudio';
    }

    if(data.surpress != null) {
        user.suppress =  data.surpress;
        event.type = 'UserChangeAudio';
    }

    if(data.self_mute != null) {
        user.self_mute =  data.self_mute;
        event.type = 'UserChangeAudio';
    }

    if(data.self_deaf != null) {
        user.self_deaf =  data.self_deaf;
        event.type = 'UserChangeAudio';
    }

    if(data.texture != null) {
        user.texture =  data.texture;
        user.texture_hash = null;
        event.type = 'UserChangeTexture';
    }

    if(data.comment != null) {
        user.comment =  data.comment;
        user.comment_hash = null;
        event.type = 'UserChangeComment';
    }

    if(data.hash != null) {
        user.hash = data.hash;
    }

    if(data.comment_hash != null) {
        user.comment_hash =  data.comment_hash;
        user.comment = "";
        event.type = 'UserChangeComment';
    }

    if(data.texture_hash != null) {
        user.texture_hash =  data.texture_hash;
        user.texture = null;
        event.type = 'UserChangeTexture';
    }
    if(data.priority_speaker != null) {
        user.priority_speaker =  data.priority_speaker;
        event.type = 'UserChangePrioritySpeaker';
    }

    if(data.recording != null) {
        user.recording =  data.recording;
        event.type = 'UserChangeRecording';
    }

    if(client.synced) {
        client.emit('userChange', event);
    }

}

Handler.prototype.handleChannelState = function(data) {
    if(data.channel_id === null) {
        return client.emit('error', "Incomplete Protobuf");
    }

    var event = events.channelChangeEvent;

    var channelId = data.channel_id;
    var channel = client.channels[channelId];
    if (channel == null) {
        channel = client.channels.create(channelId);
        channel.client = client;
        event.type = 'ChannelChangeCreated';
    }

    event.channel = channel;
    if(data.parent !== null) {
        //TODO ChannelChangeMoved
    }

    if(data.name !== null) {
        if(data.name !== channel.name) {
            event.type = 'ChannelChangeName';
        }
        channel.name = data.name;
    }

    if(client.synced) {
        client.emit('channelChange', event);
    }
}

Handler.prototype.handleTextMessage = function(data) {
    // this.emit('textMessage', Events.textMessageEvent(data));
};

Handler.prototype.handleServerSync = function(data) {
    if(data.session !== null) {
        client.self = client.users[data.session];
    }
    if(data.welcome_text !== null) {

    }
    if(data.max_bandwidth !== null) {

    }
    client.synced = true;
};

Handler.prototype.handleUserRemove = function(data) {
    // if(data.session && users.list[data.session]) {
    //     var user = users.list[data.session];
    //     this.emit('userChange', Events.userChangeEvent(user, 'UserChangeDisconnected'));
    //     delete users.list[user.session];
    // }
}

module.exports = Handler;
