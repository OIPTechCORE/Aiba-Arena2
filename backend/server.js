require('dotenv').config();
const cron = require('node-cron');

// Enable environment validation for production security
const { validateAndReport } = require('./config/envValidation');
if (!validateAndReport()) {
    console.error('[FATAL] Environment validation failed. Exiting.');
    process.exit(1);
}

const { createApp } = require('./app');
const { initDb } = require('./db');
const logger = require('./utils/logger');

const app = createApp();

// Legacy auto-dispatch (deprecated): the mainnet/hardened flow uses AIBA credits + signed vault claims.
// Keep this OFF by default; only enable for legacy migrations/debugging.
const enableLegacyPendingAibaDispatch =
    String(process.env.ENABLE_LEGACY_PENDING_AIBA_DISPATCH ?? '')
        .trim()
        .toLowerCase() === 'true';

if (enableLegacyPendingAibaDispatch) {
    const sendAIBA = require('./ton/sendAiba');
    const User = require('./models/User');

    // Run hourly, process each user safely, per-user try/catch and retries
    cron.schedule('0 * * * *', async () => {
        console.log('Starting pendingAIBA dispatch');
        try {
            const users = await User.find({ pendingAIBA: { $gt: 0 } });
            for (const user of users) {
                if (!user.wallet) {
                    console.warn(`Skipping user ${user._id} — no wallet set`);
                    continue;
                }

                const amount = user.pendingAIBA;
                let attempts = 0;
                const maxAttempts = 3;
                let sent = false;

                while (attempts < maxAttempts && !sent) {
                    attempts++;
                    try {
                        console.log(`Sending AIBA to user`, {
                            amount,
                            wallet: user.wallet,
                            userId: user._id,
                            attempt: attempts,
                        });
                        await sendAIBA(user.wallet, amount);
                        user.pendingAIBA = 0;
                        await user.save();
                        sent = true;
                        console.log(`Successfully sent AIBA to user`, { userId: user._id, amount });
                    } catch (err) {
                        console.error(`Failed to send AIBA to user`, {
                            userId: user._id,
                            attempt: attempts,
                            error: err.message,
                        });
                        await new Promise((r) => setTimeout(r, 2000 * attempts));
                    }
                }

                if (!sent) {
                    console.error(`Failed to send AIBA to user after all attempts`, { userId: user._id, amount });
                }
            }
        } catch (err) {
            console.error('Error in pendingAIBA dispatch', { error: err.message });
        }
    });
} else {
    console.log('Legacy pendingAIBA dispatch disabled');
}

(async () => {
    try {
        // Skip database connection for testing frontend
        console.log('[INFO] Skipping MongoDB connection for frontend testing');
    
        // Start server without database
        app.listen(process.env.PORT || 5000, () =>
            console.log('Server started (without database)', { port: process.env.PORT || 5000 }),
        );
    } catch (err) {
        console.error('Backend startup failed', { error: err.message });
        process.exit(1);
    }
})();
