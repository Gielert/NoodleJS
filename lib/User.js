var channels = require('./Channels');
var Events = require('./Events');
var client;
var User = function(data, c) {
    client = c;
    this.session = data.session;
    this.userID = data.user_id;
    this.name = data.name;
    this.channel = channels.findById(data.channel_id) || channels.findById(0);
    this.mute =  data.mute || false;
    this.deaf =  data.deaf || false;
    this.suppress =  data.surpress || false;
    this.self_mute =  data.self_mute || false;
    this.self_deaf =  data.self_deaf || false;
    this.texture =  data.texture;
    this.comment =  data.comment;
    this.hash = data.hash;
    this.comment_hash =  data.comment_hash;
    this.texture_hash =  data.texture_hash;
    this.priority_speaker =  data.priority_speaker || false;
    this.recording =  data.recording || false;
};

User.prototype.update = function(data) {
    var eventType = null;

    if(data.name != null) {
        this.name = data.name;
        eventType = 'UserChangeName';
    }

    if(data.user_id != null) {
        this.userID = data.user_id;
        eventType = 'UserChangeRegistered'
    }

    if(data.channel_id != null) {
        this.channel = channels.findById(data.channel_id) || channels.findById(0);
        eventType = 'UserChangeChannel';
    }

    if(data.mute != null) {
        this.mute =  data.mute || false;
        eventType = 'UserChangeAudio';
    }

    if(data.deaf != null) {
        this.deaf =  data.deaf || false;
        eventType = 'UserChangeAudio';
    }

    if(data.surpress != null) {
        this.suppress =  data.surpress || false;
        eventType = 'UserChangeAudio';
    }

    if(data.self_mute != null) {
        this.self_mute =  data.self_mute || false;
        eventType = 'UserChangeAudio';
    }

    if(data.self_deaf != null) {
        this.self_deaf =  data.self_deaf || false;
        eventType = 'UserChangeAudio';
    }

    if(data.texture != null) {
        this.texture =  data.texture;
        this.texture_hash = null;
        eventType = 'UserChangeTexture';
    }

    if(data.comment != null) {
        this.comment =  data.comment;
        this.comment_hash = null;
        eventType = 'UserChangeComment';
    }

    if(data.hash != null) {
        this.hash = data.hash;
    }

    if(data.comment_hash != null) {
        this.comment_hash =  data.comment_hash;
        this.comment = "";
        eventType = 'UserChangeComment';
    }

    if(data.texture_hash != null) {
        this.texture_hash =  data.texture_hash;
        this.texture = null;
        eventType = 'UserChangeTexture';
    }
    if(data.priority_speaker != null) {
        this.priority_speaker =  data.priority_speaker || false;
        eventType = 'UserChangePrioritySpeaker';
    }

    if(data.recording != null) {
        this.recording =  data.recording || false;
        eventType = 'UserChangeRecording';
    }

    client.emit('userChange', Events.userChangeEvent(this, eventType));
}

User.prototype.sendMessage = function(message) {
    var packet = {
        actor: client.session,
        session: this.session,
        message: message
    };
    client.connection.writeProto('TextMessage', packet);
}

module.exports = User;
