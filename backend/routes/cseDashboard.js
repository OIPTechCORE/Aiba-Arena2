const express = require('express');
const router = express.Router();
const CSEDashboard = require('../engine/cseDashboard');
const CivilizationImmuneSystem = require('../engine/civilizationImmuneSystem');
const StabilityEquationMonitor = require('../engine/stabilityEquationMonitor');
const logger = require('../utils/logger');

// Middleware for CSE dashboard routes
const cseAuth = async (req, res, next) => {
  // CSE dashboard requires admin or governance access
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token required.' });
  }
  
  try {
    // For now, allow any valid token (in production, implement proper governance token validation)
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const dashboard = new CSEDashboard();

// GET /api/cse/dashboard - Get comprehensive dashboard data
router.get('/dashboard', cseAuth, async (req, res) => {
  try {
    const dashboardData = await dashboard.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/cse/overview - Get overview data only
router.get('/overview', cseAuth, async (req, res) => {
  try {
    const overview = await dashboard.getOverviewData();
    res.json(overview);
  } catch (error) {
    logger.error('Error fetching overview data:', error);
    res.status(500).json({ error: 'Failed to fetch overview data' });
  }
});

// GET /api/cse/stability - Get stability equation data
router.get('/stability', cseAuth, async (req, res) => {
  try {
    const stabilityData = await dashboard.getStabilityEquationData();
    res.json(stabilityData);
  } catch (error) {
    logger.error('Error fetching stability data:', error);
    res.status(500).json({ error: 'Failed to fetch stability data' });
  }
});

// GET /api/cse/layers - Get all layers data
router.get('/layers', cseAuth, async (req, res) => {
  try {
    const layersData = await dashboard.getLayersData();
    res.json(layersData);
  } catch (error) {
    logger.error('Error fetching layers data:', error);
    res.status(500).json({ error: 'Failed to fetch layers data' });
  }
});

// GET /api/cse/layers/:layerName - Get specific layer data
router.get('/layers/:layerName', cseAuth, async (req, res) => {
  try {
    const { layerName } = req.params;
    const layersData = await dashboard.getLayersData();
    
    if (!layersData[layerName]) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    res.json(layersData[layerName]);
  } catch (error) {
    logger.error(`Error fetching layer ${req.params.layerName} data:`, error);
    res.status(500).json({ error: 'Failed to fetch layer data' });
  }
});

// GET /api/cse/alerts - Get alerts data
router.get('/alerts', cseAuth, async (req, res) => {
  try {
    const alertsData = await dashboard.getAlertsData();
    res.json(alertsData);
  } catch (error) {
    logger.error('Error fetching alerts data:', error);
    res.status(500).json({ error: 'Failed to fetch alerts data' });
  }
});

// GET /api/cse/trends - Get trends data
router.get('/trends', cseAuth, async (req, res) => {
  try {
    const trendsData = await dashboard.getTrendsData();
    res.json(trendsData);
  } catch (error) {
    logger.error('Error fetching trends data:', error);
    res.status(500).json({ error: 'Failed to fetch trends data' });
  }
});

// GET /api/cse/recommendations - Get recommendations data
router.get('/recommendations', cseAuth, async (req, res) => {
  try {
    const recommendationsData = await dashboard.getRecommendationsData();
    res.json(recommendationsData);
  } catch (error) {
    logger.error('Error fetching recommendations data:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations data' });
  }
});

// GET /api/cse/immune-system - Get immune system data
router.get('/immune-system', cseAuth, async (req, res) => {
  try {
    const immuneSystemData = await dashboard.getImmuneSystemData();
    res.json(immuneSystemData);
  } catch (error) {
    logger.error('Error fetching immune system data:', error);
    res.status(500).json({ error: 'Failed to fetch immune system data' });
  }
});

// GET /api/cse/forecasts - Get forecasts data
router.get('/forecasts', cseAuth, async (req, res) => {
  try {
    const forecastsData = await dashboard.getForecastsData();
    res.json(forecastsData);
  } catch (error) {
    logger.error('Error fetching forecasts data:', error);
    res.status(500).json({ error: 'Failed to fetch forecasts data' });
  }
});

// GET /api/cse/real-time - Get real-time updates
router.get('/real-time', cseAuth, async (req, res) => {
  try {
    const realTimeData = await dashboard.getRealTimeUpdates();
    res.json(realTimeData);
  } catch (error) {
    logger.error('Error fetching real-time updates:', error);
    res.status(500).json({ error: 'Failed to fetch real-time updates' });
  }
});

// POST /api/cse/immune-system/initialize - Initialize immune system
router.post('/immune-system/initialize', cseAuth, async (req, res) => {
  try {
    const immuneSystem = new CivilizationImmuneSystem();
    await immuneSystem.initialize();
    
    res.json({
      message: 'Immune system initialized successfully',
      status: 'active',
      agents: immuneSystem.agents.length
    });
  } catch (error) {
    logger.error('Error initializing immune system:', error);
    res.status(500).json({ error: 'Failed to initialize immune system' });
  }
});

// POST /api/cse/immune-system/status - Get immune system status
router.get('/immune-system/status', cseAuth, async (req, res) => {
  try {
    const immuneSystem = new CivilizationImmuneSystem();
    const status = await immuneSystem.getImmuneSystemStatus();
    
    res.json(status);
  } catch (error) {
    logger.error('Error getting immune system status:', error);
    res.status(500).json({ error: 'Failed to get immune system status' });
  }
});

// POST /api/cse/monitoring/start - Start stability monitoring
router.post('/monitoring/start', cseAuth, async (req, res) => {
  try {
    const monitor = new StabilityEquationMonitor();
    monitor.startMonitoring();
    
    res.json({
      message: 'Stability monitoring started',
      interval: monitor.monitoringInterval
    });
  } catch (error) {
    logger.error('Error starting stability monitoring:', error);
    res.status(500).json({ error: 'Failed to start stability monitoring' });
  }
});

// POST /api/cse/monitoring/stop - Stop stability monitoring
router.post('/monitoring/stop', cseAuth, async (req, res) => {
  try {
    const monitor = new StabilityEquationMonitor();
    monitor.stopMonitoring();
    
    res.json({
      message: 'Stability monitoring stopped'
    });
  } catch (error) {
    logger.error('Error stopping stability monitoring:', error);
    res.status(500).json({ error: 'Failed to stop stability monitoring' });
  }
});

// GET /api/cse/health - Get CSE system health
router.get('/health', cseAuth, async (req, res) => {
  try {
    const overview = await dashboard.getOverviewData();
    const immuneSystemData = await dashboard.getImmuneSystemData();
    
    const health = {
      overall: overview.health,
      stability: overview.status,
      immuneSystem: immuneSystemData.status,
      lastUpdated: overview.lastUpdated,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      activeComponents: {
        dashboard: 'active',
        monitoring: 'active',
        immuneSystem: immuneSystemData.active ? 'active' : 'inactive'
      }
    };
    
    res.json(health);
  } catch (error) {
    logger.error('Error getting CSE health:', error);
    res.status(500).json({ error: 'Failed to get CSE health' });
  }
});

// GET /api/cse/metrics - Get raw metrics for external monitoring
router.get('/metrics', cseAuth, async (req, res) => {
  try {
    const overview = await dashboard.getOverviewData();
    const stabilityData = await dashboard.getStabilityEquationData();
    const alertsData = await dashboard.getAlertsData();
    
    // Format for monitoring systems (Prometheus-style)
    const metrics = [
      `cse_stability_score ${overview.stabilityScore}`,
      `cse_active_alerts ${alertsData.total}`,
      `cse_critical_alerts ${alertsData.critical}`,
      `cse_warning_alerts ${alertsData.warning}`,
      `cse_active_stabilizers ${overview.activeStabilizers}`,
      `cse_trust_index ${stabilityData.components.trust}`,
      `cse_participation_rate ${stabilityData.components.participation}`,
      `cse_fairness_score ${stabilityData.components.fairness}`,
      `cse_power_concentration ${stabilityData.components.powerConcentration}`,
      `cse_extraction_pressure ${stabilityData.components.extractionPressure}`
    ];
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics.join('\n'));
  } catch (error) {
    logger.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// WebSocket endpoint for real-time updates (would require WebSocket implementation)
// This is a placeholder for WebSocket functionality
router.get('/ws', cseAuth, (req, res) => {
  res.json({
    message: 'WebSocket endpoint for real-time CSE updates',
    note: 'WebSocket implementation required for real-time streaming',
    alternative: 'Use GET /api/cse/real-time for polling-based updates'
  });
});

// Export data endpoints
router.get('/export/stability-history', cseAuth, async (req, res) => {
  try {
    const { format = 'json', days = 30 } = req.query;
    const trendsData = await dashboard.getTrendsData();
    
    // Filter by days if specified
    const cutoffDate = Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000);
    const filteredData = trendsData.stability.filter(point => point.timestamp > cutoffDate);
    
    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'timestamp,score,triggers,actions\n';
      const csvData = filteredData.map(point => 
        `${new Date(point.timestamp).toISOString()},${point.score},"${point.triggers.join(';')}","${point.actions.join(';')}"`
      ).join('\n');
      
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="stability-history.csv"');
      res.send(csvHeader + csvData);
    } else {
      // Return JSON
      res.json({
        data: filteredData,
        exportedAt: Date.now(),
        period: `${days} days`,
        totalPoints: filteredData.length
      });
    }
  } catch (error) {
    logger.error('Error exporting stability history:', error);
    res.status(500).json({ error: 'Failed to export stability history' });
  }
});

router.get('/export/alerts', cseAuth, async (req, res) => {
  try {
    const { format = 'json', resolved = 'false' } = req.query;
    const alertsData = await dashboard.getAlertsData();
    
    const alerts = resolved === 'true' ? alertsData.resolved : alertsData.active;
    
    if (format === 'csv') {
      const csvHeader = 'id,type,message,metric,value,threshold,timestamp,actions\n';
      const csvData = alerts.map(alert => 
        `${alert.id},${alert.type},"${alert.message}",${alert.metric},${alert.value},${alert.threshold},${new Date(alert.timestamp).toISOString()},"${alert.actions.join(';')}"`
      ).join('\n');
      
      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', 'attachment; filename="alerts.csv"');
      res.send(csvHeader + csvData);
    } else {
      res.json({
        data: alerts,
        exportedAt: Date.now(),
        includeResolved: resolved === 'true',
        total: alerts.length
      });
    }
  } catch (error) {
    logger.error('Error exporting alerts:', error);
    res.status(500).json({ error: 'Failed to export alerts' });
  }
});

module.exports = router;
