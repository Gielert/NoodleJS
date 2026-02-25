<div align="center">
<p>
<img width="400px" src="http://i.imgur.com/qCjY5JI.png"/>
</p>
<br>
<p>
<a href="https://www.npmjs.com/package/noodle.js"><img src="https://img.shields.io/npm/v/noodle.js.svg"/></a>
<a href="https://github.com/Gielert/NoodleJS/actions">
<img src="https://github.com/Gielert/NoodleJS/workflows/CI/badge.svg"/>
</a>
<a href="https://codeclimate.com/github/Gielert/NoodleJS">
<img src="https://img.shields.io/codeclimate/github/Gielert/NoodleJS.svg"/>
</a>
<a href="https://codecov.io/gh/Gielert/NoodleJS">
<img src="https://codecov.io/gh/Gielert/NoodleJS/branch/master/graph/badge.svg" alt="Codecov" />
</a>
<a href="https://www.npmjs.com/package/noodle.js"><img src="https://img.shields.io/npm/dt/noodle.js.svg"/></a>
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

### Requirements
- **Node.js >= 20.19.4**
- **OpenSSL** (required for native cryptographic module)

### Installation

#### Installing OpenSSL

**Windows:**
```powershell
choco install openssl
```

**Ubuntu/Debian:**
```bash
sudo apt-get install libssl-dev
```

**macOS:**
```bash
brew install openssl@3
```

#### Installing NoodleJS
```bash
npm install noodle.js
# or
yarn add noodle.js
```

The native cryptographic module will be built automatically during installation. If you encounter build errors, ensure OpenSSL is properly installed.

### Usage

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

## Development

### Building from Source
```bash
# Clone the repository
git clone https://github.com/Gielert/NoodleJS.git
cd NoodleJS

# Install dependencies
yarn install

# Build native module
yarn rebuild

# Run tests
yarn test

# Run linter
yarn lint
```

### CI/CD
This project uses GitHub Actions for continuous integration and automated npm publishing. See [.github/ACTIONS_SETUP.md](.github/ACTIONS_SETUP.md) for more information about the CI/CD setup.

## License
MIT
