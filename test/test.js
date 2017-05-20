const Client = require('../src/Client')

const client = new Client();

client.on('connect', (data) => {
    // console.log(client.users)
})

client.on('channelUpdate', (oldChannel, newChannel) => {
    console.log(oldChannel)
    console.log(newChannel)
})

client.on('channelCreate', (channel) => {
    console.log(channel)
})

client.on('userChange', (oldUser, newUser) => {
    console.log(oldUser)
    console.log(newUser)
})