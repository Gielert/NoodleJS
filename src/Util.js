const Constants = require('./Constants')

class Util {

    static toVarint(i) {

        var arr = [];
        if( i < 0 ) {
            i = ~i;
            if( i <= 0x3 ) { return Buffer.from([ 0xFC | i ]); }

            arr.push( 0xF8 );
        }

        if( i < 0x80 ) {
            arr.push( i );
        } else if ( i < 0x4000 ) {
            arr.push(( i >> 8 ) | 0x80 );
            arr.push(i & 0xFF );
        } else if ( i < 0x200000 ) {
            arr.push((i >> 16) | 0xC0);
            arr.push((i >> 8) & 0xFF);
            arr.push(i & 0xFF);
        } else if ( i < 0x10000000 ) {
            arr.push((i >> 24) | 0xE0);
            arr.push((i >> 16) & 0xFF);
            arr.push((i >> 8) & 0xFF);
            arr.push(i & 0xFF);
        } else if ( i < 0x100000000 ) {
            arr.push(0xF0);
            arr.push((i >> 24) & 0xFF);
            arr.push((i >> 16) & 0xFF);
            arr.push((i >> 8) & 0xFF);
            arr.push(i & 0xFF);
        } else {
            throw new TypeError( "Non-integer values are not supported. (" + i + ")" );
        }

        return {
            value: Buffer.from( arr ),
            length: arr.length
        };
    }

    static fromVarInt(buf) {
        // TODO: 111110__ + varint	Negative recursive varint
        // TODO: 111111xx       	Byte-inverted negative two bit number (~xx)

        var retVal = {
            value: 0,
            consumed: 0
        }

        if (buf[0] < 0x80) {
            // 0xxxxxxx            7 bit positive number
            retVal.value = buf[0];
            retVal.consumed = 1;
        } else if (buf[0] < 0xC0) {
            // 10xxxxxx + 1 byte   14-bit positive number
            retVal.value = (buf[0] & 0x3F) << 8;
            retVal.value |= buf[1];
            retVal.consumed = 2;
        } else if (buf[0] < 0xE0) {
            // 110xxxxx + 2 bytes  21-bit positive number
            retVal.value = (buf[0] & 0x1F) << 16;
            retVal.value |= (buf[1]) << 8;
            retVal.value |= (buf[2]);
            retVal.consumed = 3;
        } else if (buf[0] < 0xF0) {
            // 1110xxxx + 3 bytes  28-bit positive number
            retVal.value = (buf[0] & 0x0F) << 24;
            retVal.value |= (buf[1]) << 16;
            retVal.value |= (buf[2]) << 8;
            retVal.value |= (buf[3]);
            retVal.consumed = 4;
        } else if (buf[0] < 0xF4) {
            // 111100__ + int (32-bit)
            retVal.value = (buf[1]) << 24;
            retVal.value |= (buf[2]) << 16;
            retVal.value |= (buf[3]) << 8;
            retVal.value |= (buf[4]);
            retVal.consumed = 5;
        } else if (buf[0] < 0xFC) {
            // 111101__ + long (64-bit)
            retVal.value = (buf[1]) << 56;
            retVal.value |= (buf[2]) << 48;
            retVal.value |= (buf[3]) << 40;
            retVal.value |= (buf[4]) << 32;
            retVal.value |= (buf[5]) << 24;
            retVal.value |= (buf[6]) << 16;
            retVal.value |= (buf[7]) << 8;
            retVal.value |= (buf[8]);
            retVal.consumed = 9;
        }

        return retVal;
    }

    static encodeVersion(major, minor, patch) {
        // To uint32
        if (patch > 255) {
            return (major << 16) | (minor << 8) + 255;
        } else {
            return (major << 16) | (minor << 8) | patch;
        }
    }

    static encodeVersionV2(major, minor, patch) {
        // To uint64 - use protobufjs Long for compatibility
        const protobuf = require('protobufjs')
        const Long = protobuf.util.Long
        
        // Encode as: major (16 bits) << 48 | minor (16 bits) << 32 | patch (16 bits) << 16
        const value = (BigInt(major) << 48n) | (BigInt(minor) << 32n) | (BigInt(patch) << 16n)
        
        // Convert BigInt to Long
        return Long.fromString(value.toString(), true) // true = unsigned
    }

    static cloneObject(obj) {
        return { ...obj }
    }

    static adjustNetworkBandwidth(bitspersec) {
        let frames = Constants.Network.framesPerPacket
        let bitrate = Constants.Network.quality

        if(this.getNetworkBandwidth(bitrate, frames) > bitspersec) {
            while(bitrate > 8000 && (this.getNetworkBandwidth(bitrate, frames) > bitspersec)) {
                bitrate -= 1000
            }
        }

        return bitrate
    }

    static getNetworkBandwidth(bitrate, frames) {
        let overhead = 20 + 8 + 4 + 1 + 2 + frames + 12
        overhead *= (800 / frames)
        return overhead + bitrate
    }

    /**
    * Sets default properties on an object that aren't already specified.
    * @param {Object} def Default properties
    * @param {Object} given Object to assign defaults to
    * @returns {Object}
    * @private
    */
    static mergeDefault(def, given) {
        if (!given) return def;
        for (const key in def) {
            if (!{}.hasOwnProperty.call(given, key)) {
                given[key] = def[key];
            } else if (given[key] === Object(given[key])) {
                given[key] = this.mergeDefault(def[key], given[key]);
            }
        }

        return given;
    }
}

module.exports = Util
