var User = require('./User');
var Users = {};

var create = function(session) {
    var user = new User();
    user.session = session;
    this[session] = user;
    return user;
};

module.exports = {
    Users: Users,
    create: create
};
