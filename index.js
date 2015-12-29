var Client = require('./lib/Client');

module.exports.newClient = function(options) {
    return new Client(options);
}
