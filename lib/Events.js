module.exports.channelChangeEvent = function() {
    this.type;
    this.channel;

    this.changeTypes = {
        ChannelChangeCreated: 1,
    	ChannelChangeRemoved: 2,
    	ChannelChangeMoved: 4,
    	ChannelChangeName: 8,
    	ChannelChangeLinks: 16,
    	ChannelChangeDescription: 32,
    	ChannelChangePosition: 64,
    	ChannelChangePermission: 128,
    }

    this.has = function(eventType) {
        return (this.type & eventType) != 0;
    }
};

module.exports.userChangeEvent = function() {
    this.type; //Bitmask for changeTypes
    this.user;
    this.actor;

    this.changeTypes = {
        UserChangeConnected: 1,
    	UserChangeDisconnected: 2,
    	UserChangeKicked: 4,
    	UserChangeBanned: 8,
    	UserChangeRegistered: 16,
    	UserChangeUnregistered: 32,
    	UserChangeName: 64,
    	UserChangeChannel: 128,
    	UserChangeComment: 256,
    	UserChangeAudio: 512,
    	UserChangeTexture: 1024,
    	UserChangePrioritySpeaker: 2048,
    	UserChangeRecording: 4096,
    	UserChangeStats: 8192
    }

    this.has = function(eventType) {
        return (this.type & eventType) != 0;
    };
};

module.exports.connectEvent = function() {
    this.welcomeMessage;
    this.maximumBitrate;
};

module.exports.textMessageEvent = function() {
    this.textMessage;
}
