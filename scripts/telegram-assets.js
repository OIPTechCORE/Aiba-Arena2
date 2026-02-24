#!/usr/bin/env node
/**
 * Generate Telegram profile photo (512×512) and splash screen (1080×1920) from the AI Battle Arena logo.
 *
 * Usage:
 *   node scripts/telegram-assets.js [path-to-logo.png]
 *   Or set INPUT_IMAGE env.
 *
 * Outputs to assets/:
 *   telegram-profile-512.png   — square, for Telegram bot/profile photo (circular crop in-app)
 *   telegram-splash-1080x1920.png — portrait splash for Mini App loading screen
 */

const path = require('path');
const fs = require('fs');

const inputPath =
    process.env.INPUT_IMAGE || process.argv[2] || path.join(__dirname, '../assets/ai-battle-arena-logo.png');
const outDir = path.join(__dirname, '../assets');

async function main() {
    let sharp;
    try {
        sharp = require('sharp');
    } catch {
        console.error('Install sharp: npm install --no-save sharp');
        process.exit(1);
    }

    if (!fs.existsSync(inputPath)) {
        console.error('Input image not found:', inputPath);
        console.error('Usage: node scripts/telegram-assets.js <path-to-logo.png>');
        process.exit(1);
    }

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const image = sharp(inputPath);
    const meta = await image.metadata();
    const w = meta.width || 800;
    const h = meta.height || 800;

    // Profile: 512×512, logo centered and fitted, dark background
    const profileSize = 512;
    const scaleP = Math.min(profileSize / w, profileSize / h) * 0.95;
    const wp = Math.round(w * scaleP);
    const hp = Math.round(h * scaleP);
    const leftP = Math.round((profileSize - wp) / 2);
    const topP = Math.round((profileSize - hp) / 2);

    await sharp({
        create: {
            width: profileSize,
            height: profileSize,
            channels: 3,
            background: { r: 12, g: 12, b: 14 },
        },
    })
        .composite([{ input: await image.resize(wp, hp).toBuffer(), left: leftP, top: topP }])
        .png()
        .toFile(path.join(outDir, 'telegram-profile-512.png'));

    console.log('Written assets/telegram-profile-512.png');

    // Splash: 1080×1920 portrait, logo centered
    const splashW = 1080;
    const splashH = 1920;
    const scaleS = Math.min(splashW / w, splashH / h) * 0.7;
    const ws = Math.round(w * scaleS);
    const hs = Math.round(h * scaleS);
    const leftS = Math.round((splashW - ws) / 2);
    const topS = Math.round((splashH - hs) / 2);

    await sharp({
        create: {
            width: splashW,
            height: splashH,
            channels: 3,
            background: { r: 8, g: 8, b: 10 },
        },
    })
        .composite([{ input: await sharp(inputPath).resize(ws, hs).toBuffer(), left: leftS, top: topS }])
        .png()
        .toFile(path.join(outDir, 'telegram-splash-1080x1920.png'));

    console.log('Written assets/telegram-splash-1080x1920.png');
    console.log('Use telegram-profile-512.png as bot/profile photo; telegram-splash-1080x1920.png as Mini App splash.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
