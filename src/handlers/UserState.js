const AbstractHandler = require('./AbstractHandler')
const User = require('../User')

class UserState extends AbstractHandler {
    handle(data) {

        if (data.session == null)
            return this.client.emit('error', 'Incomplete Protobuf')

        let event = {}

        let session = data.session
        let user = this.client.users[session] || new User(session)
        user.channel = this.client.channels[0]
        user.client = this.client

        if (user.channel == null)
            return this.client.emit('error', 'Invalid Protobuf')

        user.channel.users[session] = user

        if(data.name)
            user.name = data.name

        if(data.userId)
            user.id = data.userId
    }
}

module.exports = UserState