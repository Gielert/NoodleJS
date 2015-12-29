
var Channel = function(data) {
    this.id = data.channel_id;
    this.parent = data.parent;
    this.name = data.name
    this.links = data.links
    this.description = data.description;
    this.links_add = data.links_add;
    this.links_remove = data.links_remove;
    this.temporary = data.temporary;
    this.position = data.position;
    this.description_hash = data.description_hash;
    this.max_users = data.max_users;
};

Channel.prototype.update = function(data) {
    this.id = data.channel_id;
    this.parent = data.parent;
    this.name = data.name
    this.links = data.links
    this.description = data.description;
    this.links_add = data.links_add;
    this.links_remove = data.links_remove;
    this.temporary = data.temporary;
    this.position = data.position;
    this.description_hash = data.description_hash;
    this.max_users = data.max_users;
}

module.exports = Channel;
