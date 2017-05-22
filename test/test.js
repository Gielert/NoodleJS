const Client = require('../src/Client')

const client = new Client();

client.on('ready', (data) => {
    client.channels.first().sendMessage('check')
        .then(message => console.log(message))
        .catch(err => console.log(err))
    // client.sendMessage('Damn this works well')
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

client.on('textMessage', textMessage => console.log(textMessage))

client.on('userDisconnect', user => console.log(user))
