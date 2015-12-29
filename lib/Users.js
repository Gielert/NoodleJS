
var User = require('./User');

module.exports.list = {};

module.exports.create = function(data, client) {
    var user = new User(data, client);
    this.list[data.session] = user;
};

module.exports.findBySession = function(session) {
    return this.list[session];
};
