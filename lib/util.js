"use strict";

/**
 * @summary Converts a number to Mumble varint
 *
 * @see {@link http://mumble-protocol.readthedocs.org/en/latest/voice_data.html#variable-length-integer-encoding}
 *
 * @param {Number} Integer to convert
 * @return {Buffer} Varint encoded number
 */
exports.toVarint = function( i ) {
    var absValue = Math.abs( i );

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
};
