const AbstractHandler = require('./AbstractHandler')
const Channel = require('../structures/Channel')
const Util = require('../Util')

class UserRemove extends AbstractHandler {
    handle(data) {
        let user = this.client.users.get(data.session)

        if(user) {
            this.client.users.delete(user.session)
            if (this.client.synced) this.client.emit('userDisconnect', user)
        }

    }
}

module.exports = UserRemove
