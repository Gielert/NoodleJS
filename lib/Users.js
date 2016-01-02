var User = require('./User');
var Users = function() {};

Users.prototype.create = function(session) {
    var user = new User();
    user.session = session;
    this[session] = user;
    return user;
};

module.exports = Users;
