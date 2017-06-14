const chai = require('chai')
const fs = require('fs')
const expect = chai.expect
const Client = require('../src/Client')
const Channel = require('../src/structures/Channel')
const ChannelRemove = require('../src/handlers/ChannelRemove')
let client = null
let client2 = null

const url = process.env.MUMBLE_URL

before((done) => {
    client = new Client({url})
    client.connect()
    client.on('ready', () => {
        client2 = new Client({name: 'bob', url})
        client2.connect()
        client2.on('ready', () => {
            done()
        })
    })
})

describe('Connection', () => {
    it('should error when it can\'t connect', (done) => {
        const shouldError = new Client({url: 'somenonexistingurl'})
        shouldError.connect()
        shouldError.on('error', () => {
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
        client.once('message', (message) => {
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

    // This is a mocked test. ACL isn't implemented yet.
    it('should update a channel', () => {
        const fclient = new Client()

        const rootChannel = new Channel(fclient, {
            channelId: 0,
            name: 'Root',
            position: 0
        })

        fclient.channels.set(rootChannel.id, rootChannel)

        const channel = new Channel(fclient, {
            channelId: 1,
            name: 'fake channel',
            description: "some description",
            position: 1,
            temporary: true,
            links: [0]
        })

        const channelTwo = new Channel(fclient, {
            channelId: 2,
            name: 'fake channel two',
            position: 2
        })

        fclient.channels.set(channelTwo.id, channelTwo)
        fclient.channels.set(channel.id, channel)

        channel.setup({
            channelId: 1,
            name: "new fake name",
            parent: 0,
            linksRemove: [0]
        })

        expect(channel.parent.id).to.equal(rootChannel.id)

        channel.setup({
            channelId: 1,
            linksAdd: [0],
            parent: 2
        })

        expect(channel.parent.id).to.equal(channelTwo.id)

    })

    it('should not update a channel when channelId is missing', () => {
        const channel = new Channel(null, {
            channelId: 1,
            name: 'fake channel'
        })

        channel.setup({
            name: 'new fake name'
        })

        expect(channel.name).to.equal('fake channel')
    })

    it('should handle channel remove', () => {
        const fclient = new Client()
        fclient.synced = true
        const channelRemove = new ChannelRemove(fclient);
        const channel = new Channel(fclient, {channelId: 0, name: 'test'})
        fclient.channels.set(channel.id, channel)
        channelRemove.handle({channelId: 0})
        expect(fclient.channels.size).to.equal(0)
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

    it('should receive an event when a user changes', done => {
        client.once('userChange', (oldUser, newUser) => {
            expect(newUser.selfMute).to.be.true
            done()
        })
        client2.mute()
    })

    it('should receive an event when a user disconnects', done => {
        client.once('userDisconnect', user => {
            expect(user.name).to.equal('bob')
            done()
        })
        client2.destroy()
    })
})

describe('Audio', () => {
    it('should play a file', done => {
        client.voiceConnection.playFile('test/test.mp3')
        return client.voiceConnection.once('end', () => {
            done()
        })
    })

    it('should play a stream', done => {
        client.voiceConnection.playStream(fs.createReadStream('test/test.mp3'))
        return client.voiceConnection.once('end', () => {
            done()
        })
    })

    it('should error when playing a non existing file', done => {
        client.voiceConnection.playFile('nope.mp3')
        return client.voiceConnection.once('error', () => {
            done()
        })
    })
})