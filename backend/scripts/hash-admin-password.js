#!/usr/bin/env node
/**
 * Generate bcrypt hash for ADMIN_PASSWORD_HASH (production).
 * Usage: node scripts/hash-admin-password.js "your-secure-password"
 * Then set ADMIN_PASSWORD_HASH=<output> in your production env.
 */
const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password) {
    console.error('Usage: node scripts/hash-admin-password.js "your-password"');
    process.exit(1);
}
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
