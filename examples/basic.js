var NoodleJS = require('../index.js');

var client = NoodleJS.newClient({
    url: '192.168.66.66',
    name: 'NoodleJS'
});

client.on('userChange', function(event) {
    if(event.type === 'UserChangeChannel') {
        if(event.user.channel.id == client.self.channel.id) {
            event.user.sendMessage("Hello " + event.user.name + "!");
        }
    }
});
