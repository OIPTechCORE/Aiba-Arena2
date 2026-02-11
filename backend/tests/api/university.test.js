const test = require('node:test');
const assert = require('node:assert/strict');
const { getApp } = require('../helpers/appForTests');
const http = require('http');

test('GET /api/university/courses returns courses with modules', async () => {
    const app = getApp();
    const server = http.createServer(app);
    const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
    try {
        const res = await fetch(`http://127.0.0.1:${port}/api/university/courses`);
        assert.equal(res.status, 200);
        const body = await res.json();
        assert.equal(body.ok, true);
        const { courses, totalModules } = body.data;
        assert.ok(Array.isArray(courses), 'courses is array');
        assert.ok(courses.length >= 1, 'at least one course');
        assert.equal(typeof totalModules, 'number');
        const course = courses[0];
        assert.ok(course.id);
        assert.ok(course.title);
        assert.ok(Array.isArray(course.modules));
        if (course.modules.length > 0) {
            assert.ok(course.modules[0].id);
            assert.ok(course.modules[0].title);
        }
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});
