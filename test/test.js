const Client = require('../src/Client')

const client = new Client();

client.on('ready', data => {
    console.log(client.users)
    // client.users.find('name', 'SuperUser').sendMessage('check')

    client.sendMessage('Damn this works well')
        .then(message => console.log(message))
        .catch(err => console.log(err))
})

client.on('channelUpdate', (oldChannel, newChannel) => {
    console.log(oldChannel)
    console.log(newChannel)
})

client.on('channelCreate', channel => console.log(channel))

client.on('userChange', (oldUser, newUser) => {
    console.log(oldUser)
    console.log(newUser)
})

client.on('channelRemove', channelId => console.log(channelId))

client.on('textMessage', textMessage => {
    textMessage.reply("oke")
        .then(message => console.log(message))
})

client.on('userDisconnect', user => console.log(user))
