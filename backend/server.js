require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');

const app = express();
app.use(
    cors({
        origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : true,
        credentials: true,
    })
);
app.use(express.json());

// Connect with error handling
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/game', require('./routes/game'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/battle', require('./routes/battle'));
app.use('/api/brokers', require('./routes/brokers'));
app.use('/api/vault', require('./routes/vault'));

// Ton transfer helper
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
                    console.log(
                        `Sending ${amount} to ${user.wallet} (user ${user._id}), attempt ${attempts}`
                    );
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

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 5000, () => console.log('Server listening'));
