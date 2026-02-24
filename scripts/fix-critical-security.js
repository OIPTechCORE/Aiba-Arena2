#!/usr/bin/env node

/**
 * Critical Security Vulnerability Fix Script
 * Automatically updates vulnerable dependencies to secure versions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Critical Security Fix...\n');

// Critical vulnerabilities to fix
const criticalFixes = {
    'form-data': '^4.0.1',
    'qs': '^6.14.1', 
    'tough-cookie': '^4.1.3',
    'minimatch': '^10.2.1',
    'node-notifier': '^8.0.1',
    'json5': '^1.0.2',
    'merge': '^2.1.1'
};

// Update root package.json
console.log('📦 Updating root package.json...');
const rootPackagePath = path.join(__dirname, '../package.json');
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, 'utf8'));

// Update critical dependencies
Object.keys(criticalFixes).forEach(dep => {
    if (rootPackage.dependencies && rootPackage.dependencies[dep]) {
        rootPackage.dependencies[dep] = criticalFixes[dep];
        console.log(`✅ Updated ${dep} to ${criticalFixes[dep]}`);
    }
    if (rootPackage.devDependencies && rootPackage.devDependencies[dep]) {
        rootPackage.devDependencies[dep] = criticalFixes[dep];
        console.log(`✅ Updated dev ${dep} to ${criticalFixes[dep]}`);
    }
});

fs.writeFileSync(rootPackagePath, JSON.stringify(rootPackage, null, 2));

// Update backend package.json
console.log('\n📦 Updating backend package.json...');
const backendPackagePath = path.join(__dirname, '../backend/package.json');
const backendPackage = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));

// Fix tonweb to secure version
backendPackage.dependencies['tonweb'] = '^0.0.66';

// Update other critical deps
Object.keys(criticalFixes).forEach(dep => {
    if (backendPackage.dependencies && backendPackage.dependencies[dep]) {
        backendPackage.dependencies[dep] = criticalFixes[dep];
        console.log(`✅ Updated backend ${dep} to ${criticalFixes[dep]}`);
    }
});

fs.writeFileSync(backendPackagePath, JSON.stringify(backendPackage, null, 2));

// Install updated dependencies
console.log('\n🔄 Installing updated dependencies...');
try {
    execSync('cd .. && npm install --legacy-peer-deps', { stdio: 'inherit' });
    console.log('✅ Root dependencies updated');
    
    execSync('cd ../backend && npm install', { stdio: 'inherit' });
    console.log('✅ Backend dependencies updated');
    
    execSync('cd ../miniapp && npm install', { stdio: 'inherit' });
    console.log('✅ Miniapp dependencies updated');
} catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
}

console.log('\n🔒 Security fix complete!');
console.log('📊 Run "npm audit" to verify fixes');
