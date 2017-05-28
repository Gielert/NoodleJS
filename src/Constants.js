exports.Audio = {
    sampleRate: 48000,
    channels: 1,
    bitDepth: 16,
    frameSize: 480,
    frameLength: 10
}

exports.Network = {
    framesPerPacket: 1,
    quality: 40000
}

/**
 * Options for a client
 * @typedef {Object} ClientOptions
 * @property {string} [url='localhost'] The URL of the Mumble server
 * @property {string} [port='64738'] The port the Mumble server is listening on
 * @property {boolean} [rejectUnauthorized=false] Whether we should reject invalid certificates
 * @property {string} [name='NoodleJS'] The name of the user that will connect
 * @property {string} [password=''] A password when the server has one
 */
exports.DefaultOptions = {
    url: 'localhost',
    port: '64738',
    rejectUnauthorized: false,
    name: 'NoodleJS',
    password: '',
    tokens: []
}
