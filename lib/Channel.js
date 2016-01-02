var TextMessage = require('./TextMessage');
var Channel = function() {
    return {
        sendMessage: function(message, recursive) {
            var textMessage = new TextMessage();
            if(recursive) {
                textMessage.trees = [
                    this
                ];
            } else {
                textMessage.channels = [
                    this
                ];
            }
            textMessage.message = message;
            this.client.sendMessage(textMessage);
        }
    }
};

module.exports = Channel;
