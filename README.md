<div align="center">
    <p>
        <img width="400px" src="http://i.imgur.com/qCjY5JI.png"/>
    </p>
    <br>
    <p>
        <a href="https://www.npmjs.com/package/noodle.js" title="dependencies status"><img src="https://img.shields.io/npm/v/noodle.js.svg"/></a>
        <a href="https://www.npmjs.com/package/noodle.js" title="dependencies status"><img src="https://img.shields.io/npm/dt/noodle.js.svg"/></a>
        <a href="https://david-dm.org/Gielert/NoodleJS" title="dependencies status"><img src="https://david-dm.org/Gielert/NoodleJS/status.svg"/></a>
    </p>
    <p>
        <a href="https://www.npmjs.com/package/noodle.js">
        <img src="https://nodei.co/npm/noodle.js.png?downloads=true&stars=true">
        </a>
    </p>
</div>

## NoodleJS - A Mumble Client
NoodleJS is a node.js module that allows you to interact with Mumble servers very easily.
This is a complete rewrite from the previous version of NoodleJS.

### Installation
**Node.js >= 6.0.0 is required.**

#### Audio
Audio is currently not implemented. I'm working on this as hard as I can :D

## Example usage
```js
const NoodleJS = require('noodle.js');
const client = new NoodleJS({
    url: 'myawesomemumbleserver'
});

client.on('ready' info => {
    console.log(info.welcomeMessage)
});

client.on('message', message => {
    if (message.content === 'ping') {
        message.reply('pong');
    }
});
```
