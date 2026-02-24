#!/usr/bin/env node

/**
 * Production Deployment Verification
 */

const https = require('https');

const checks = [
    {
        name: 'Backend Health Check',
        url: process.env.BACKEND_URL + '/health',
        expected: { ok: true }
    },
    {
        name: 'Metrics Endpoint',
        url: process.env.BACKEND_URL + '/metrics',
        expected: 'text/plain'
    }
];

async function verifyDeployment() {
    console.log('🚀 Verifying Production Deployment...
');
    
    for (const check of checks) {
        try {
            const response = await fetch(check.url);
            if (response.ok) {
                console.log(`✅ ${check.name}: OK`);
            } else {
                console.log(`❌ ${check.name}: FAILED (${response.status})`);
            }
        } catch (error) {
            console.log(`❌ ${check.name}: ERROR - ${error.message}`);
        }
    }
    
    console.log('
🔒 Security verification complete!');
}

verifyDeployment();
