module.exports.channelChangeEvent = {
    type: null,
    channel: null
};

module.exports.userChangeEvent = {
    type: null,
    user: null
};

module.exports.serverSyncEvent = {
    welcomeMessage: null,
    maximumBitrate: null
};

module.exports.textMessageEvent = function(message) {
    return {
        sender: message.sender,
        channels: message.channels,
        message: message.message
    };
};
