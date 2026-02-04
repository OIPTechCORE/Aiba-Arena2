require('dotenv').config();
const cron = require('node-cron');

const { createApp } = require('./app');
const { initDb } = require('./db');

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
        console.log('Cron: starting pendingAIBA dispatch');
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
                        console.log(`Sending ${amount} to ${user.wallet} (user ${user._id}), attempt ${attempts}`);
                        await sendAIBA(user.wallet, amount);
                        user.pendingAIBA = 0;
                        await user.save();
                        sent = true;
                        console.log(`Sent AIBA to ${user._id}`);
                    } catch (err) {
                        console.error(`Failed to send AIBA to ${user._id} (attempt ${attempts}):`, err);
                        await new Promise((r) => setTimeout(r, 2000 * attempts));
                    }
                }

                if (!sent) {
                    console.error(`Giving up sending to ${user._id} after ${maxAttempts} attempts`);
                }
            }
        } catch (err) {
            console.error('Cron: unexpected error:', err);
        }
    });
} else {
    console.log('Legacy pendingAIBA dispatch disabled (set ENABLE_LEGACY_PENDING_AIBA_DISPATCH=true to enable).');
}

(async () => {
    try {
        await initDb();
        console.log('MongoDB Connected');

        const { syncTopLeaderBadges } = require('./jobs/syncTopLeaderBadges');
        const { seedRacingTracks } = require('./jobs/seedRacingTracks');
        seedRacingTracks().catch((err) => console.error('Seed racing tracks failed:', err));
        syncTopLeaderBadges().catch((err) => console.error('Initial top-leader badge sync failed:', err));
        cron.schedule('0 */6 * * *', () => {
            syncTopLeaderBadges().catch((err) => console.error('Cron top-leader badge sync failed:', err));
        });

        app.listen(process.env.PORT || 5000, () => console.log('Server listening'));
    } catch (err) {
        console.error('Backend startup failed:', err?.message || err);
        process.exit(1);
    }
})();
