var TextMessage = require('./TextMessage');
var User = function() {
    return {
        sendMessage: function(message) {
            var textMessage = new TextMessage();
            textMessage.users = [
                this
            ];
            textMessage.message = message;
            this.client.sendMessage(textMessage);
        }
    }
};

module.exports = User;
