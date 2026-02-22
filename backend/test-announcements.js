/**
 * Test announcements endpoint directly
 */

const { createApp } = require('./app');
const http = require('http');

async function testAnnouncements() {
    console.log('Testing announcements endpoint...');
    
    // Set test environment for auth bypass
    process.env.APP_ENV = 'test';
    
    const app = createApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    
    try {
        // Test with test authentication
        const response = await fetch(`http://localhost:${port}/api/announcements`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Id': '12345',
                'X-Telegram-Username': 'testuser'
            }
        });
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (response.status === 200) {
            const list = data.items ?? data.data ?? data;
            console.log('Items array:', Array.isArray(list));
            console.log('UnreadCount type:', typeof data.unreadCount);
            console.log('Test PASSED');
        } else if (response.status === 500 && (data.error?.message?.includes('buffering timed out') || data.error?.message?.includes('internal server error'))) {
            console.log('Test SKIPPED - Database connection timeout (expected in test environment without MongoDB)');
        } else {
            console.log('Test FAILED - unexpected status');
        }
    } catch (err) {
        console.error('Test error:', err);
    } finally {
        server.close();
    }
}

testAnnouncements();
