class AbstractHandler {
    constructor(client) {
        this.client = client
    }

    handle(data) {
        return data
    }
}

module.exports = AbstractHandler