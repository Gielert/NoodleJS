var Channel = function() {
    return {
        sendMessage: function(message, recursive) {
            console.log(message);
        }
    }
};

module.exports = Channel;
