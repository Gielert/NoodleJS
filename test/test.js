const chai = require('chai')
const expect = chai.expect
const Client = require('../src/Client')
let client = null
let client2 = null

const url = process.env.MUMBLE_URL

before((done) => {
    client = new Client({url})
    client.on('ready', () => {
        client2 = new Client({name: 'bob', url})
        client2.on('ready', () => {
            done()
        })
    })
})

describe('TextMessage', () => {
    it('should send a textmessage to current channel', () => {
        return client.sendMessage('This is a test message')
            .then(message => {
                expect(message.content).to.equal('This is a test message')
            })
    })

    it('should send a textmessage to a user', () => {
        return client.users.find('name', 'bob').sendMessage('Hello')
            .then(message => {
                const user = message.users.find('name', 'bob')
                expect(user.name).to.equal('bob')
            })
    })

    it('should send a textmessage to a specific channel', () => {
        return client.channels.find('name', 'Root')
            .sendMessage('This is a specific channel message')
            .then(message => {
                const channel = message.channels.find('name', 'Root')
                expect(channel.name).to.equal('Root')
            })
    })

    it('should send a message recursive', () => {
        return client.channels.find('name', 'Root')
            .sendMessage('This is a recursive message', true)
            .then(message => {
                const channel = message.trees.find('name', 'Root')
                expect(channel.name).to.equal('Root')
            })
    })

    it('should reply to a textmessage from a user', (done) => {
        client.on('message', (message) => {
            message.reply('okay').then((reply) => {
                const user = reply.users.find('name', 'bob')
                expect(user.name).to.equal('bob')
                expect(reply.content).to.equal('okay')
                done()
            })
        })
        client2.sendMessage('Reply to me')
    })
})

describe('Channel', () => {
    it('should list all channels', () => {
        expect(client.channels.size).to.be.above(0)
    })

    it('should find a specific channel', () => {
        const channel = client.channels.find('name', 'Root')
        expect(channel.name).to.equal('Root')
    })
})

describe('User', () => {
    it('should list all users', () => {
        expect(client.users.size).to.be.above(1)
    })

    it('should find a specific user', () => {
        const user = client.users.find('name', 'bob')
        expect(user.name).to.equal('bob')
    })
})