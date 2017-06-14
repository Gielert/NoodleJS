const Constants = require('./Constants')

class Util {

    static toVarint(i) {

        var arr = [];
        if( i < 0 ) {
            i = ~i;
            if( i <= 0x3 ) { return new Buffer([ 0xFC | i ]); }

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
            value: new Buffer( arr ),
            length: arr.length
        };
    }

    static encodeVersion(major, minor, patch) {
        return  ((major & 0xffff) << 16) |
        ((minor & 0xff) << 8) |
        (patch & 0xff)
    }

    static cloneObject(obj) {
        return Object.assign(Object.create(obj), obj);
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
