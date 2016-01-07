# NoodleJS - A NodeJS Mumble client
NoodleJS is in a very early stage of development. So don't expect much of it.
This client is based on Node-Mumble, but with the sort-like implementation of Gumble. I felt that Node-Mumble wasn't satisfying my needs so I decided to create my own client. The purpose of this client is most likely for creating bots.

Feel free to checkout both repositories as they are both great to use!
* [Node-Mumble](https://github.com/Rantanen/node-mumble)
* [Gumble](https://github.com/layeh/gumble)

## So whats working
* Receiving text messages
* Sending a message to a user
* Sending a message to a channel
* Handling user events
* Handling channel events
* Handling client connect event
* Playing audio from the client
* Setting volume of the client

## Basic setup
```javascript
var NoodleJS = require('noodle-js');

var client = NoodleJS.newClient({
    url: 'mymumbleserver.domain',
    name: 'NoodleJS'
});
```

## More info
For more info check the [wiki](https://github.com/Gielert/NoodleJS/wiki)

For a full example check the examples in the repository.
