// cronWorker.js
const cron = require('node-cron');

// Example cron job that runs every minute
cron.schedule('* * * * *', () => {
  console.log('Cron job is running every minute');
  // Add your cron job logic here
});

module.exports = cron;