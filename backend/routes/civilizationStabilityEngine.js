const express = require('express');
const router = express.Router();
const CivilizationStabilityEngine = require('../models/CivilizationStabilityEngine');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Middleware for CSE routes
const cseAuth = async (req, res, next) => {
  // CSE endpoints require either admin auth or governance token
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

// GET /api/cse/stability - Get current stability report
router.get('/stability', cseAuth, async (req, res) => {
  try {
    const report = await CivilizationStabilityEngine.getStabilityReport();
    res.json(report);
  } catch (error) {
    logger.error('Error fetching stability report:', error);
    res.status(500).json({ error: 'Failed to fetch stability report' });
  }
});

// GET /api/cse/metrics - Get detailed metrics
router.get('/metrics', cseAuth, async (req, res) => {
  try {
    const latest = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
    if (!latest) {
      return res.status(404).json({ error: 'No stability data found' });
    }
    
    res.json({
      timestamp: latest.createdAt,
      metrics: {
        // Power Diffusion Layer
        powerConcentrationIndex: latest.powerConcentrationIndex,
        governanceDiversity: latest.governanceDiversity,
        authorityDecayRate: latest.authorityDecayRate,
        
        // Economic Shock Absorber
        economicVolatility: latest.economicVolatility,
        wealthInequalityGini: latest.wealthInequalityGini,
        treasuryStabilityRatio: latest.treasuryStabilityRatio,
        
        // Trust Verification Layer
        trustIndex: latest.trustIndex,
        reputationScore: latest.reputationScore,
        fraudDetectionScore: latest.fraudDetectionScore,
        
        // Exploitation Detection Layer
        extractionPressure: latest.extractionPressure,
        whaleDominanceRatio: latest.whaleDominanceRatio,
        botActivityIndex: latest.botActivityIndex,
        
        // Governance Feedback Loop
        participationRate: latest.participationRate,
        sentimentScore: latest.sentimentScore,
        
        // Meaning & Purpose Engine
        purposeAlignment: latest.purposeAlignment,
        culturalVitality: latest.culturalVitality,
        
        // Regenerative Growth Layer
        decentralizationTrend: latest.decentralizationTrend,
        resilienceIndex: latest.resilienceIndex
      },
      alerts: latest.alerts.filter(alert => !alert.resolved),
      activeStabilizers: latest.activeStabilizers
    });
  } catch (error) {
    logger.error('Error fetching CSE metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// POST /api/cse/update - Update stability metrics
router.post('/update', cseAuth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Find or create latest CSE record
    let cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
    if (!cse) {
      cse = new CivilizationStabilityEngine();
    }
    
    // Update metrics
    Object.keys(updates).forEach(key => {
      if (cse[key] !== undefined) {
        cse[key] = updates[key];
      }
    });
    
    // Calculate new stability score
    const newStabilityScore = cse.calculateStabilityEquation();
    cse.stabilityScore = newStabilityScore;
    
    // Check for risks and trigger auto-corrections
    const risks = cse.detectCollapseRisk();
    const corrections = cse.triggerAutoCorrection();
    
    // Add to history
    cse.stabilityHistory.push({
      timestamp: new Date(),
      score: newStabilityScore,
      triggers: risks,
      actions: corrections.map(c => c.action)
    });
    
    // Process corrections if auto-correction is enabled
    if (cse.autoCorrectionEnabled && corrections.length > 0) {
      corrections.forEach(correction => {
        // Activate stabilizer
        const existingStabilizer = cse.activeStabilizers.find(
          s => s.type === correction.action.replace('ACTIVATE_', '')
        );
        
        if (existingStabilizer) {
          existingStabilizer.activated = new Date();
          existingStabilizer.parameters = correction.parameters;
        } else {
          cse.activeStabilizers.push({
            type: correction.action.replace('ACTIVATE_', ''),
            activated: new Date(),
            effectiveness: 0,
            parameters: correction.parameters
          });
        }
      });
      
      cse.lastCorrection = {
        timestamp: new Date(),
        action: corrections[0].action,
        effectiveness: 0
      };
    }
    
    // Create alerts for critical risks
    risks.forEach(risk => {
      const existingAlert = cse.alerts.find(a => a.metric === risk && !a.resolved);
      if (!existingAlert) {
        cse.alerts.push({
          type: 'WARNING',
          message: `Risk detected: ${risk}`,
          metric: risk,
          value: cse[risk.toLowerCase()] || 0,
          threshold: 0.7,
          actions: corrections.map(c => c.action)
        });
      }
    });
    
    await cse.save();
    
    res.json({
      stabilityScore: newStabilityScore,
      risks,
      corrections,
      message: 'Stability metrics updated successfully'
    });
  } catch (error) {
    logger.error('Error updating CSE metrics:', error);
    res.status(500).json({ error: 'Failed to update metrics' });
  }
});

// POST /api/cse/stabilizers/:stabilizer/activate - Manually activate a stabilizer
router.post('/stabilizers/:stabilizer/activate', cseAuth, async (req, res) => {
  try {
    const { stabilizer } = req.params;
    const parameters = req.body.parameters || {};
    
    const validStabilizers = [
      'POWER_DIFFUSION', 'ECONOMIC_SHOCK_ABSORBER', 'TRUST_VERIFICATION',
      'EXPLOITATION_DETECTION', 'GOVERNANCE_FEEDBACK', 'MEANING_ENGINE',
      'REGENERATIVE_GROWTH', 'IMMUNE_SYSTEM'
    ];
    
    if (!validStabilizers.includes(stabilizer)) {
      return res.status(400).json({ error: 'Invalid stabilizer' });
    }
    
    let cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
    if (!cse) {
      cse = new CivilizationStabilityEngine();
    }
    
    // Activate stabilizer
    const existingStabilizer = cse.activeStabilizers.find(s => s.type === stabilizer);
    if (existingStabilizer) {
      existingStabilizer.activated = new Date();
      existingStabilizer.parameters = { ...existingStabilizer.parameters, ...parameters };
    } else {
      cse.activeStabilizers.push({
        type: stabilizer,
        activated: new Date(),
        effectiveness: 0,
        parameters
      });
    }
    
    await cse.save();
    
    res.json({
      message: `${stabilizer} activated successfully`,
      stabilizer: cse.activeStabilizers.find(s => s.type === stabilizer)
    });
  } catch (error) {
    logger.error(`Error activating stabilizer ${req.params.stabilizer}:`, error);
    res.status(500).json({ error: 'Failed to activate stabilizer' });
  }
});

// POST /api/cse/alerts/:alertId/resolve - Resolve an alert
router.post('/alerts/:alertId/resolve', cseAuth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolution } = req.body;
    
    const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
    if (!cse) {
      return res.status(404).json({ error: 'No CSE data found' });
    }
    
    const alert = cse.alerts.id(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alert.resolved = true;
    alert.resolution = resolution;
    
    await cse.save();
    
    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    logger.error(`Error resolving alert ${req.params.alertId}:`, error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// GET /api/cse/history - Get stability history
router.get('/history', cseAuth, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
    if (!cse) {
      return res.status(404).json({ error: 'No CSE data found' });
    }
    
    const history = cse.stabilityHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit));
    
    res.json({
      history,
      total: cse.stabilityHistory.length
    });
  } catch (error) {
    logger.error('Error fetching CSE history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/cse/auto-correction/toggle - Toggle auto-correction
router.post('/auto-correction/toggle', cseAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
    if (!cse) {
      return res.status(404).json({ error: 'No CSE data found' });
    }
    
    cse.autoCorrectionEnabled = enabled;
    await cse.save();
    
    res.json({
      message: `Auto-correction ${enabled ? 'enabled' : 'disabled'}`,
      autoCorrectionEnabled: cse.autoCorrectionEnabled
    });
  } catch (error) {
    logger.error('Error toggling auto-correction:', error);
    res.status(500).json({ error: 'Failed to toggle auto-correction' });
  }
});

module.exports = router;
