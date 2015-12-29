# NoodleJS - A NodeJS Mumble client
NoodleJS is in a very early stage of development. So don't expect much of it.
This is based of Node-Mumble, but with the sort-like implementation of Gumble. I felt that Node-Mumble wasn't satisfying my needs so I decided to create my own client. The purpose of this client is most likely for creating bots.

Feel free to checkout both repositories as they are both great to use!
* [Node-Mumble](https://github.com/Rantanen/node-mumble)
* [Gumble](https://github.com/layeh/gumble)

## So whats working
* Receiving text messages
* Sending a message to a user
* Handling user events

## Basic setup
```javascript
var NoodleJS = require('noodle-js');

var client = NoodleJS.newClient({
    url: 'mymumbleserver.domain',
    name: 'NoodleJS'
});
```

## Events
The client emits events when something on the server happens, for example when a user disconnects or connects.

### UserChange events
You can handle user event by calling the 'userChange' event on the client.
###### UserChangeEvent
```javascript
{
    user: {...},
    type: ...
}
```
###### Event types
| Event                 | Returns         |
|-----------------------|-----------------|
|UserChangeConnected    | UserChangeEvent |
|UserChangeDisconnected | UserChangeEvent |
|UserChangeAudio        | UserChangeEvent |
|UserChangeName         | UserChangeEvent |
|UserChangeChannel      | UserChangeEvent |
|UserChangeComment      | UserChangeEvent |
|UserChangeTexture      | UserChangeEvent |

###### Example
```javascript
client.on('userChange', function(e) {
    if(e.type == 'UserChangeConnected') {
        e.user.sendMessage("Hello " + e.user.name + "!");
    }
});
```

For a full example check the examples in the repository.
