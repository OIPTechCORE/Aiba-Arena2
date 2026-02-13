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
        const { expireRentals } = require('./jobs/expireRentals');
        const { accrueMentorRewards } = require('./jobs/accrueMentorRewards');
        seedRacingTracks().catch((err) => console.error('Seed racing tracks failed:', err));
        syncTopLeaderBadges().catch((err) => console.error('Initial top-leader badge sync failed:', err));
        cron.schedule('0 */6 * * *', () => {
            syncTopLeaderBadges().catch((err) => console.error('Cron top-leader badge sync failed:', err));
        });
        cron.schedule('0 * * * *', () => {
            expireRentals().catch((err) => console.error('Cron expire rentals failed:', err));
        });
        cron.schedule('0 * * * *', () => {
            accrueMentorRewards().catch((err) => console.error('Cron mentor rewards failed:', err));
        });

        // Holistic automated AIBA/TON oracle (when oracleAutoUpdateEnabled + oracleAibaUsd or fallback set)
        const { runOracleUpdate, shouldRunOracleCron } = require('./engine/aibaTonOracle');
        const oracleIntervalMin = Math.max(5, Number(process.env.ORACLE_UPDATE_INTERVAL_MINUTES) || 15);
        cron.schedule(`*/${oracleIntervalMin} * * * *`, async () => {
            try {
                const should = await shouldRunOracleCron();
                if (!should) return;
                const r = await runOracleUpdate();
                if (r.ok) console.log('Oracle: updated aibaPerTon=', r.oracleAibaPerTon);
            } catch (err) {
                console.error('Cron oracle update failed:', err);
            }
        });

        app.listen(process.env.PORT || 5000, () => console.log('Server listening'));
    } catch (err) {
        console.error('Backend startup failed:', err?.message || err);
        process.exit(1);
    }
})();
