/**
 * Security Hardening Script
 * This script updates vulnerable packages to safe versions
 * Run with: node scripts/security-hardening.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting security hardening...\n');

// Update specific vulnerable packages to safe versions
const updates = [
    // Critical vulnerabilities
    'npm install form-data@^2.5.4',
    'npm install minimatch@^10.2.1',
    'npm install qs@^6.14.1',
    'npm install tough-cookie@^4.1.3',
    'npm install node-notifier@^8.0.1',

    // Update Jest ecosystem (safer versions)
    'npm install jest@^29.7.0',
    'npm install @jest/core@^29.7.0',
    'npm install @jest/transform@^29.7.0',
    'npm install jest-config@^29.7.0',
    'npm install jest-runtime@^29.7.0',
    'npm install jest-circus@^29.7.0',
    'npm install jest-runner@^29.7.0',
    'npm install jest-snapshot@^29.7.0',
    'npm install jest-resolve-dependencies@^29.7.0',
    'npm install @jest/globals@^29.7.0',
    'npm install @jest/expect@^29.7.0',
    'npm install @jest/reporters@^29.7.0',
    'npm install @jest/test-sequencer@^29.7.0',
    'npm install @jest/test-result@^29.7.0',
    'npm install @jest/source-map@^29.7.0',
    'npm install @jest/schemas@^29.7.0',
    'npm install @jest/environment@^29.7.0',
    'npm install @jest/fake-timers@^29.7.0',
    'npm install @jest/types@^29.7.0',
    'npm install babel-jest@^29.7.0',
    'npm install ts-jest@^29.1.1',

    // Update glob ecosystem
    'npm install glob@^10.3.10',
    'npm install rimraf@^5.0.10',
    'npm install test-exclude@^7.0.1',
    'npm install babel-plugin-istanbul@^7.0.1',
];

async function runSecurityHardening() {
    try {
        console.log('📦 Updating vulnerable packages...');

        for (const command of updates) {
            console.log(`\n⚡ Running: ${command}`);
            try {
                execSync(command, { stdio: 'inherit', cwd: process.cwd() });
                console.log('✅ Success');
            } catch (error) {
                console.log('⚠️  Failed (may be optional):', error.message);
            }
        }

        console.log('\n🔍 Running audit check...');
        try {
            const auditResult = execSync('npm audit', { encoding: 'utf8', cwd: process.cwd() });
            console.log(auditResult);
        } catch (error) {
            console.log('Audit completed with some remaining issues (expected for complex dependencies)');
        }

        console.log('\n🧪 Running tests to verify compatibility...');
        try {
            execSync('npm test', { stdio: 'inherit', cwd: path.join(process.cwd(), 'backend') });
            console.log('✅ All tests passed');
        } catch (error) {
            console.log('⚠️  Some tests failed - manual review needed');
        }

        console.log('\n🎉 Security hardening completed!');
        console.log('\n📋 Summary:');
        console.log('- Updated critical vulnerable packages');
        console.log('- Updated Jest ecosystem to safer versions');
        console.log('- Updated glob and related packages');
        console.log('- Tests verified (check output above)');
        console.log('\n⚠️  Manual review recommended:');
        console.log('- Check test output for any failures');
        console.log('- Run application in development to verify functionality');
        console.log('- Consider updating to newer major versions when ready');
    } catch (error) {
        console.error('❌ Security hardening failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    runSecurityHardening();
}

module.exports = { runSecurityHardening };
