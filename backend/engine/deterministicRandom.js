const crypto = require('crypto');

function hmacSha256Hex(secret, message) {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function seedFromHex(hex) {
    // take first 8 hex chars => 32-bit unsigned int
    return parseInt(hex.slice(0, 8), 16) >>> 0;
}

function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

module.exports = { hmacSha256Hex, seedFromHex, mulberry32 };

