require('dotenv').config();
const { createApp } = require('./app');

// Simple test server startup
const app = createApp();
app.listen(process.env.PORT || 5000, () => {
    console.log('Test server started', { port: process.env.PORT || 5000 });
});
