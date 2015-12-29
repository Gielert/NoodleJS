module.exports.userChangeEvent = function(user, type) {
    return {
        user: user,
        type: type
    };
};

module.exports.textMessageEvent = function(message) {
    return {
        sender: message.sender,
        channels: message.channels,
        message: message.message
    };
};
