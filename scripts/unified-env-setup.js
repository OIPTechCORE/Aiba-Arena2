#!/usr/bin/env node

/**
 * Unified Environment Setup Script
 * 
 * This script generates service-specific .env files from the unified .env file
 * for deployment to different services (backend, miniapp, admin-panel)
 * 
 * Usage: node scripts/unified-env-setup.js [service]
 *   service: 'backend' | 'miniapp' | 'admin-panel' | 'all' (default: 'all')
 */

const fs = require('fs');
const path = require('path');

// Define prefix mappings for each service
const SERVICE_PREFIXES = {
    backend: ['BACKEND_', 'SHARED_'],
    miniapp: ['MINIAPP_', 'SHARED_'],
    'admin-panel': ['ADMIN_', 'SHARED_']
};

// Define output file paths
const OUTPUT_FILES = {
    backend: '.env',
    miniapp: 'miniapp/.env.local',
    'admin-panel': 'admin-panel/.env.local'
};

// Define variable transformations
const TRANSFORMATIONS = {
    // Miniapp: add NEXT_PUBLIC_ prefix to SHARED_ variables
    miniapp: (key, value) => {
        if (key.startsWith('SHARED_')) {
            return [`MINIAPP_NEXT_PUBLIC_${key.replace('SHARED_', '')}`, value];
        }
        return [key, value];
    },
    // Admin panel: add NEXT_PUBLIC_ prefix to SHARED_ variables  
    'admin-panel': (key, value) => {
        if (key.startsWith('SHARED_')) {
            return [`ADMIN_NEXT_PUBLIC_${key.replace('SHARED_', '')}`, value];
        }
        return [key, value];
    },
    // Backend: remove SHARED_ prefix
    backend: (key, value) => {
        if (key.startsWith('SHARED_')) {
            return [key.replace('SHARED_', ''), value];
        }
        return [key, value];
    }
};

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: Unified .env file not found at ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
        line = line.trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) {
            return;
        }

        // Parse key=value pairs (handle quoted values)
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) return;

        const key = line.substring(0, equalIndex).trim();
        let value = line.substring(equalIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        env[key] = value;
    });

    return env;
}

function generateServiceEnv(service, unifiedEnv) {
    const prefixes = SERVICE_PREFIXES[service];
    const transform = TRANSFORMATIONS[service];
    const serviceEnv = {};

    Object.entries(unifiedEnv).forEach(([key, value]) => {
        // Check if this variable belongs to this service
        const belongsToService = prefixes.some(prefix => key.startsWith(prefix));
        
        if (belongsToService) {
            const [transformedKey, transformedValue] = transform(key, value);
            serviceEnv[transformedKey] = transformedValue;
        }
    });

    return serviceEnv;
}

function writeEnvFile(filePath, envVars) {
    const content = Object.entries(envVars)
        .map(([key, value]) => {
            // Quote values that contain special characters or spaces
            if (value.includes(' ') || value.includes('"') || value.includes("'")) {
                return `${key}="${value}"`;
            }
            return `${key}=${value}`;
        })
        .join('\n');

    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Generated ${filePath} with ${Object.keys(envVars).length} variables`);
}

function main() {
    const targetService = process.argv[2] || 'all';
    const validServices = Object.keys(SERVICE_PREFIXES).concat(['all']);

    if (!validServices.includes(targetService)) {
        console.error(`Error: Invalid service "${targetService}". Valid options: ${validServices.join(', ')}`);
        process.exit(1);
    }

    console.log('🔧 Setting up environment files from unified configuration...');
    
    // Parse unified .env file
    const unifiedEnvPath = '.env';
    const unifiedEnv = parseEnvFile(unifiedEnvPath);

    console.log(`📖 Read ${Object.keys(unifiedEnv).length} variables from ${unifiedEnvPath}`);

    // Generate service-specific files
    const services = targetService === 'all' ? Object.keys(SERVICE_PREFIXES) : [targetService];
    
    services.forEach(service => {
        const serviceEnv = generateServiceEnv(service, unifiedEnv);
        const outputPath = OUTPUT_FILES[service];
        writeEnvFile(outputPath, serviceEnv);
    });

    console.log('\n✨ Environment setup complete!');
    console.log('\n📋 Generated files:');
    services.forEach(service => {
        console.log(`   - ${OUTPUT_FILES[service]} (${SERVICE_PREFIXES[service].join(', ')} prefixes)`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('   1. Review generated .env files');
    console.log('   2. Fill in any missing values');
    console.log('   3. Deploy to your respective services');
}

if (require.main === module) {
    main();
}

module.exports = {
    parseEnvFile,
    generateServiceEnv,
    writeEnvFile,
    SERVICE_PREFIXES,
    OUTPUT_FILES,
    TRANSFORMATIONS
};
