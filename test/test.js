const Client = require('../src/Client')

const client = new Client();

client.on('connect', (data) => {
    console.log(client.channels)
})