const client = require('prom-client');

const register = new client.Registry();
// Default metrics collector creates an interval timer that keeps the event loop alive.
// Skip it in tests so `node --test` can exit cleanly.
const isNodeTestRunner = process.execArgv.includes('--test') || process.argv.includes('--test');
const isTestEnv = isNodeTestRunner || process.env.NODE_ENV === 'test' || process.env.APP_ENV === 'test';
if (!isTestEnv) {
    client.collectDefaultMetrics({ register, prefix: 'aiba_' });
}

const httpRequestDurationSeconds = new client.Histogram({
    name: 'aiba_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'path', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDurationSeconds);

// Domain metrics (low-cardinality labels only)
const battleRunsTotal = new client.Counter({
    name: 'aiba_battle_runs_total',
    help: 'Total battle run attempts',
    labelNames: ['arena', 'league', 'mode_key', 'result'], // result: ok|error
});
register.registerMetric(battleRunsTotal);

const battleAnomaliesTotal = new client.Counter({
    name: 'aiba_battle_anomalies_total',
    help: 'Total battle anomalies detected',
    labelNames: ['arena', 'league', 'mode_key'],
});
register.registerMetric(battleAnomaliesTotal);

const autoBansTotal = new client.Counter({
    name: 'aiba_auto_bans_total',
    help: 'Total automatic bans triggered by backend',
    labelNames: ['entity'], // entity: user|broker
});
register.registerMetric(autoBansTotal);

const economyEmissionsTotal = new client.Counter({
    name: 'aiba_economy_emissions_total',
    help: 'Economy emissions decisions (capped + windowed)',
    labelNames: ['currency', 'arena', 'league', 'result'], // result: ok|outside_window|cap_exceeded|skipped
});
register.registerMetric(economyEmissionsTotal);

const economySinksTotal = new client.Counter({
    name: 'aiba_economy_sinks_total',
    help: 'Economy sinks/burns (server-authoritative)',
    labelNames: ['currency', 'reason', 'arena', 'league'],
});
register.registerMetric(economySinksTotal);

const economyWithdrawalsTotal = new client.Counter({
    name: 'aiba_economy_withdrawals_total',
    help: 'AIBA credit withdrawals to on-chain claims',
    labelNames: ['result'], // result: ok|insufficient|error
});
register.registerMetric(economyWithdrawalsTotal);

function metricsMiddleware(req, res, next) {
    const path = String(req.path || '');
    const stop = httpRequestDurationSeconds.startTimer({ method: req.method, path });

    res.on('finish', () => {
        stop({ status_code: String(res.statusCode) });
    });

    return next();
}

async function metricsHandler(_req, res) {
    res.setHeader('Content-Type', register.contentType);
    res.end(await register.metrics());
}

module.exports = {
    register,
    metricsMiddleware,
    metricsHandler,
    metrics: {
        battleRunsTotal,
        battleAnomaliesTotal,
        autoBansTotal,
        economyEmissionsTotal,
        economySinksTotal,
        economyWithdrawalsTotal,
    },
};
