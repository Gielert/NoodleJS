const CryptStateOCB2Native = require('../build/Release/cryptstate_ocb2').CryptStateOCB2;

/**
 * Node.js wrapper for native OCB2-AES128 implementation
 */
class CryptStateOCB2 {
    constructor() {
        this.native = new CryptStateOCB2Native();
    }

    setKey(key, clientNonce, serverNonce) {
        // Convert from base64 or Buffer to raw buffers
        const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(key, 'base64');
        const clientNonceBuf = Buffer.isBuffer(clientNonce) ? clientNonce : Buffer.from(clientNonce, 'base64');
        const serverNonceBuf = Buffer.isBuffer(serverNonce) ? serverNonce : Buffer.from(serverNonce, 'base64');
        
        return this.native.setKey(keyBuf, clientNonceBuf, serverNonceBuf);
    }

    encrypt(plainPacket) {
        return this.native.encrypt(plainPacket);
    }

    decrypt(packet) {
        return this.native.decrypt(packet);
    }
}

module.exports = CryptStateOCB2;
