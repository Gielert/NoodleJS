var NoodleJS = require('../index.js');

var client = NoodleJS.newClient({
    url: '192.168.66.66',
    name: 'NoodleJS'
});

client.on('textMessage', onTextMessage);
client.on('userChange', onUserChange);

function onUserChange(e) {
    if(e.type == 'UserChangeConnected') {
        e.user.sendMessage("Hello " + e.user.name + "!");
    }
}

function onTextMessage(e) {
    e.sender.sendMessage("Hallo " + e.message);
}
