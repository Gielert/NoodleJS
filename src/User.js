class User {

    constructor(client, data) {
        Object.defineProperty(this, 'client', {value: client})

        if (data) this.setup(data)
    }

    setup(data) {
        Object.assign(this, data)
    }

    sendMessage() {

    }

}

module.exports = User