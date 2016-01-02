var Channels = require('./Channels');
var Users = require('./Users');
var events = require('./Events');
var TextMessage = require('./TextMessage');
var client;
var Handler = function(c) {
    client = c;
};

Handler.prototype.handleUserState = function(data) {
    if(data.session === null) {
        return client.emit('error', 'Incomplete Protobuf');
    }

    var event = new events.userChangeEvent();

    var session = data.session;
    var user = client.users[session];
    if (user == null) {
        user = client.users.create(session);
        user.channel = client.channels[0];
        user.client = client;
        event.type |= event.changeTypes.UserChangeConnected;
        if(user.channel == null) {
            return client.emit('error', 'Invalid Protobuf');
        }
        event.type |= event.changeTypes.UserChangeChannel;
        user.channel.users[session] = user;
    }

    event.user = user;

    if(data.name != null) {
        user.name = data.name;
        event.type |= event.changeTypes.UserChangeName;
    }

    if(data.user_id != null) {
        user.id = data.user_id;
        event.type |= event.changeTypes.UserChangeRegistered;
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
            event.type |= event.changeTypes.UserChangeChannel;
        }
        user.channel.users[user.session] = user;
    }

    if(data.mute != null) {
        user.mute =  data.mute;
        event.type |= event.changeTypes.UserChangeAudio;
    }

    if(data.deaf != null) {
        user.deaf =  data.deaf;
        event.type |= event.changeTypes.UserChangeAudio;
    }

    if(data.surpress != null) {
        user.suppress =  data.surpress;
        event.type |= event.changeTypes.UserChangeAudio;
    }

    if(data.self_mute != null) {
        user.self_mute =  data.self_mute;
        event.type |= event.changeTypes.UserChangeAudio;
    }

    if(data.self_deaf != null) {
        user.self_deaf =  data.self_deaf;
        event.type |= event.changeTypes.UserChangeAudio;
    }

    if(data.texture != null) {
        user.texture =  data.texture;
        user.texture_hash = null;
        event.type |= event.changeTypes.UserChangeTexture;
    }

    if(data.comment != null) {
        user.comment =  data.comment;
        user.comment_hash = null;
        event.type |= event.changeTypes.UserChangeComment;
    }

    if(data.hash != null) {
        user.hash = data.hash;
    }

    if(data.comment_hash != null) {
        user.comment_hash =  data.comment_hash;
        user.comment = "";
        event.type |= event.changeTypes.UserChangeComment;
    }

    if(data.texture_hash != null) {
        user.texture_hash =  data.texture_hash;
        user.texture = null;
        event.type |= event.changeTypes.UserChangeTexture;
    }
    if(data.priority_speaker != null) {
        user.priority_speaker =  data.priority_speaker;
        event.type |= event.changeTypes.UserChangePrioritySpeaker;
    }

    if(data.recording != null) {
        user.recording =  data.recording;
        event.type |= event.changeTypes.UserChangeRecording;
    }

    if(client.synced) {
        client.emit('userChange', event);
    }

}

Handler.prototype.handleChannelState = function(data) {
    if(data.channel_id == null) {
        return client.emit('error', "Incomplete Protobuf");
    }

    var event = new events.channelChangeEvent();

    var channelId = data.channel_id;
    var channel = client.channels[channelId];
    if (channel == null) {
        channel = client.channels.create(channelId);
        channel.client = client;
        event.type |= event.changeTypes.ChannelChangeCreated;
    }
    event.channel = channel;
    if(data.parent != null) {
        if(channel.parent != null) {
            delete channel.parent.children[channelId];
        }
        var newParent = client.channels[data.parent];
        if(newParent != channel.parent) {
            event.type |= event.changeTypes.ChannelChangeMoved;
        }
        channel.parent = newParent;
        if(channel.parent != null) {
            channel.parent.children[channelId] = channel;
        }
    }

    if(data.name != null) {
        if(data.name != channel.name) {
            event.type |= event.changeTypes.ChannelChangeName;
        }
        channel.name = data.name;
    }

    if(data.links != null) {
        channel.links = Object.create(Channels);
        data.links.forEach(function(channelId) {
            var c = client.channels[channelId]
            if(c != null) {
                event.type |= event.changeTypes.ChannelChangeLinks;
                channel.links[channelId] = c;
            }
        });
    }

    data.links_add.forEach(function(channelId) {
        var c = client.channels[channelId];
        if(c != null) {
            event.type |= event.changeTypes.ChannelChangeLinks;
            channel.links[channelId] = c;
            c.links[channel.id] = channel;
        }
    });

    data.links_remove.forEach(function(channelId) {
        var c = client.channels[channelId];
        if(c != null) {
            event.type |= event.changeTypes.ChannelChangeLinks;
            delete channel.links[channelId];
            delete c.links[channelId];
        }
    });

    if(data.description != null) {
        if(data.description != channel.description) {
            event.type |= event.changeTypes.ChannelChangeDescription;
        }
        channel.description = data.description;
        channel.descriptionHash = null;
    }

    if(data.temporary != null) {
        channel.temporary = data.temporary;
    }

    if(data.position != null) {
        if(data.position != channel.position) {
            event.type |= event.changeTypes.ChannelChangePosition;
        }
        channel.position = data.position;
    }

    if(data.description_hash != null) {
        event.type |= event.changeTypes.ChannelChangeDescription;
        channel.descriptionHash = data.description_hash;
        channel.description = null;
    }

    if(client.synced) {
        client.emit('channelChange', event);
    }
}

Handler.prototype.handleTextMessage = function(data) {
    var event = new events.textMessageEvent();
    event.textMessage = new TextMessage();

    if(data.actor != null) {
        event.textMessage.sender = client.users[data.actor];
    }

    if(data.session != null) {
        event.textMessage.users = new Users();
        data.session.forEach(function(session) {
            if(client.users[session] != null) {
                event.textMessage.users[session] = client.users[session];
            }
        });
    }

    if(data.channel_id != null) {
        event.textMessage.channels = new Channels();
        data.channel_id.forEach(function(channelId) {
            if(client.channels[channelId] != null) {
                event.textMessage.channels[channelId] = client.channels[channelId];
            }
        });
    }

    if(data.tree_id != null) {
        event.textMessage.trees = new Channels();
        data.tree_id.forEach(function(channelId) {
            if(client.channels[channelId] != null) {
                event.textMessage.trees[channelId] = client.channels[channelId];
            }
        });
    }

    if(data.message != null) {
        event.textMessage.message = data.message;
    }

    client.emit('textMessage', event);
};

Handler.prototype.handleServerSync = function(data) {
    var event = new events.connectEvent();

    if(data.session !== null) {
        client.self = client.users[data.session];
    }

    if(data.welcome_text !== null) {
        event.welcomeMessage = data.welcome_text;
    }

    if(data.max_bandwidth !== null) {
        event.maximumBitrate = data.max_bandwidth;
    }

    client.synced = true;
    client.emit('connect', event);
};

Handler.prototype.handleUserRemove = function(data) {

    if(data.session == null) {
        return client.emit('error', "Incomplete Protobuf");
    }

    var event = new events.userChangeEvent();
    event.type |= event.changeTypes.UserChangeDisconnected;
    var session = data.session;
    event.user = client.users[session];

    if(event.user == null) {
        return client.emit('error', 'Invalid Protobuf');
    }

    if(event.user.channel != null) {
        delete event.user.channel.users[session];
    }

    delete client.users[session];

    if(data.actor != null) {
        event.actor = client.users[data.actor];
        if(event.actor == null) {
            return this.emit('error', 'Invalid Protobuf');
        }
        event.type |= event.changeTypes.UserChangeKicked;
    }

    if(data.reason != null) {
        event.reason = data.reason;
    }

    if(data.ban != null && data.ban) {
        event.type |= event.changeTypes.UserChangeBanned;
    }

    if(client.synced) {
        client.emit('userChange', event);
    }

}

Handler.prototype.handleChannelRemove = function(data) {
    if(data.channel_id == null) {
        return client.emit('error', 'Incomplete Protobuf');
    }
    channelId = data.channel_id;
    channel = client.channels[channelId];
    if(channel == null) {
        return client.emit('error', 'Invalid Protobuf');
    }
    delete client.channels[channelId];
    if(channel.parent != null) {
        delete channel.parent.children[channelId];
    }
    Object.keys(channel.links).forEach(function(id) {
        link = client.channels[id];
        delete link.links[channelId];
    });
    if(client.synced) {
        var event = new events.channelChangeEvent();
        event.channel = channel;
        event.type |= event.changeTypes.ChannelChangeRemoved;
        client.emit('channelChange', event);
    }
}
module.exports = Handler;
