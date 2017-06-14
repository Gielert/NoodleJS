<div align="center">
<p>
<img width="400px" src="http://i.imgur.com/qCjY5JI.png"/>
</p>
<br>
<p>
<a href="https://www.npmjs.com/package/noodle.js" title="dependencies status"><img src="https://img.shields.io/npm/v/noodle.js.svg"/></a>
<a href="https://travis-ci.org/Gielert/NoodleJS">
<img src="https://travis-ci.org/Gielert/NoodleJS.svg?branch=master"/>
</a>
<a href="https://codecov.io/gh/Gielert/NoodleJS">
<img src="https://codecov.io/gh/Gielert/NoodleJS/branch/master/graph/badge.svg" alt="Codecov" />
</a>
<a href="https://www.npmjs.com/package/noodle.js" title="dependencies status"><img src="https://img.shields.io/npm/dt/noodle.js.svg"/></a>
<a href="https://david-dm.org/Gielert/NoodleJS" title="dependencies status"><img src="https://img.shields.io/david/gielert/noodlejs.svg"/></a>
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
You can send audio in two ways.
```js
const NoodleJS = require('noodle.js');
const client = new NoodleJS();

client.on('ready', () => {
    client.voiceConnection.playFile('pathtofile');
    // or
    client.voiceConnection.playStream(somestream);
});

client.connect();
```

## Example usage
```js
const NoodleJS = require('noodle.js');
const client = new NoodleJS({
    url: 'myawesomemumbleserver'
});

client.on('ready', info => {
    console.log(info.welcomeMessage);
});

client.on('message', message => {
    if (message.content === 'ping') {
        message.reply('pong');
    }
});

client.connect();
```
