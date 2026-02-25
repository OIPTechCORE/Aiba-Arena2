const CivilizationStabilityEngine = require('../models/CivilizationStabilityEngine');
const StabilityEquationMonitor = require('../engine/stabilityEquationMonitor');
const CivilizationImmuneSystem = require('../engine/civilizationImmuneSystem');
const { PowerDiffusionLayer, EconomicShockAbsorber } = require('../engine/civilizationStabilityEngine');
const TrustVerificationLayer = require('../engine/trustVerificationLayer');
const ExploitationDetectionLayer = require('../engine/exploitationDetectionLayer');
const GovernanceFeedbackLoop = require('../engine/governanceFeedbackLoop');
const MeaningAndPurposeEngine = require('../engine/meaningAndPurposeEngine');
const RegenerativeGrowthLayer = require('../engine/regenerativeGrowthLayer');
const logger = require('../utils/logger');

class CSEDashboard {
  constructor() {
    this.refreshInterval = 30000; // 30 seconds
    this.maxDataPoints = 100; // Maximum historical data points
    this.alertThresholds = {
      critical: 0.3,
      warning: 0.5,
      optimal: 0.7
    };
  }

  // Get comprehensive dashboard data
  async getDashboardData() {
    try {
      const dashboardData = {
        timestamp: Date.now(),
        overview: await this.getOverviewData(),
        stabilityEquation: await this.getStabilityEquationData(),
        layers: await this.getLayersData(),
        alerts: await this.getAlertsData(),
        trends: await this.getTrendsData(),
        recommendations: await this.getRecommendationsData(),
        immuneSystem: await this.getImmuneSystemData(),
        forecasts: await this.getForecastsData()
      };

      return dashboardData;
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  // Get overview data
  async getOverviewData() {
    try {
      const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
      if (!cse) {
        return {
          stabilityScore: 0.5,
          status: 'UNKNOWN',
          health: 'UNKNOWN',
          lastUpdated: null,
          systemAge: 0
        };
      }

      const stabilityScore = cse.calculateStabilityEquation();
      const status = this.determineStatus(stabilityScore);
      const health = this.determineHealth(cse);

      return {
        stabilityScore,
        status,
        health,
        lastUpdated: cse.updatedAt,
        systemAge: Date.now() - cse.createdAt,
        activeStabilizers: cse.activeStabilizers.length,
        unresolvedAlerts: cse.alerts.filter(a => !a.resolved).length
      };
    } catch (error) {
      logger.error('Error getting overview data:', error);
      return {
        stabilityScore: 0.5,
        status: 'ERROR',
        health: 'ERROR',
        lastUpdated: null,
        systemAge: 0
      };
    }
  }

  // Get stability equation data
  async getStabilityEquationData() {
    try {
      const monitor = new StabilityEquationMonitor();
      const equationResult = await monitor.calculateStabilityEquation();

      return {
        equation: equationResult.equation,
        components: equationResult.components,
        componentAnalysis: equationResult.componentAnalysis,
        trend: equationResult.trend,
        historicalData: await this.getHistoricalStabilityData()
      };
    } catch (error) {
      logger.error('Error getting stability equation data:', error);
      return {
        equation: { numerator: 0, denominator: 0, stabilityScore: 0.5, status: 'ERROR' },
        components: {},
        componentAnalysis: {},
        trend: { direction: 'stable', rate: 0, confidence: 0 },
        historicalData: []
      };
    }
  }

  // Get layers data
  async getLayersData() {
    try {
      const [
        powerDiffusion,
        economicShockAbsorber,
        trustVerification,
        exploitationDetection,
        governanceFeedback,
        meaningEngine,
        regenerativeGrowth
      ] = await Promise.all([
        this.getPowerDiffusionData(),
        this.getEconomicShockAbsorberData(),
        this.getTrustVerificationData(),
        this.getExploitationDetectionData(),
        this.getGovernanceFeedbackData(),
        this.getMeaningEngineData(),
        this.getRegenerativeGrowthData()
      ]);

      return {
        powerDiffusion,
        economicShockAbsorber,
        trustVerification,
        exploitationDetection,
        governanceFeedback,
        meaningEngine,
        regenerativeGrowth
      };
    } catch (error) {
      logger.error('Error getting layers data:', error);
      return {};
    }
  }

  // Get power diffusion layer data
  async getPowerDiffusionData() {
    try {
      const powerDiffusion = new PowerDiffusionLayer();
      const metrics = await powerDiffusion.getPowerMetrics();

      return {
        name: 'Power Diffusion Layer',
        status: metrics.powerConcentrationIndex < 0.5 ? 'healthy' : 'concerning',
        metrics: {
          powerConcentrationIndex: metrics.powerConcentrationIndex,
          governanceDiversity: metrics.governanceDiversity,
          authorityDecayRate: metrics.authorityDecayRate,
          councilMembers: metrics.councilMembers,
          totalUsers: metrics.totalUsers
        },
        effectiveness: 1 - metrics.powerConcentrationIndex,
        lastUpdated: Date.now()
      };
    } catch (error) {
      logger.error('Error getting power diffusion data:', error);
      return { name: 'Power Diffusion Layer', status: 'error', metrics: {}, effectiveness: 0 };
    }
  }

  // Get economic shock absorber data
  async getEconomicShockAbsorberData() {
    try {
      const economicShockAbsorber = new EconomicShockAbsorber();
      const metrics = await economicShockAbsorber.getEconomicMetrics();

      return {
        name: 'Economic Shock Absorber',
        status: metrics.economicVolatility < 0.4 ? 'healthy' : 'concerning',
        metrics: {
          economicVolatility: metrics.economicVolatility,
          wealthInequalityGini: metrics.wealthInequalityGini,
          treasuryStabilityRatio: metrics.treasuryStabilityRatio,
          totalBalance: metrics.totalBalance,
          averageBalance: metrics.averageBalance
        },
        effectiveness: 1 - metrics.economicVolatility,
        lastUpdated: Date.now()
      };
    } catch (error) {
      logger.error('Error getting economic shock absorber data:', error);
      return { name: 'Economic Shock Absorber', status: 'error', metrics: {}, effectiveness: 0 };
    }
  }

  // Get trust verification layer data
  async getTrustVerificationData() {
    try {
      const trustVerification = new TrustVerificationLayer();
      const metrics = await trustVerification.getTrustMetrics();

      return {
        name: 'Trust Verification Layer',
        status: metrics.trustIndex > 0.6 ? 'healthy' : 'concerning',
        metrics: {
          trustIndex: metrics.trustIndex,
          reputationScore: metrics.reputationScore,
          fraudDetectionScore: metrics.fraudDetectionScore,
          fraudulentUsers: metrics.fraudulentUsers,
          totalUsers: metrics.totalUsers
        },
        effectiveness: metrics.trustIndex,
        lastUpdated: Date.now()
      };
    } catch (error) {
      logger.error('Error getting trust verification data:', error);
      return { name: 'Trust Verification Layer', status: 'error', metrics: {}, effectiveness: 0 };
    }
  }

  // Get exploitation detection layer data
  async getExploitationDetectionData() {
    try {
      const exploitationDetection = new ExploitationDetectionLayer();
      const metrics = await exploitationDetection.getExploitationMetrics();

      return {
        name: 'Exploitation Detection Layer',
        status: metrics.extractionPressure < 0.4 ? 'healthy' : 'concerning',
        metrics: {
          extractionPressure: metrics.extractionPressure,
          whaleDominanceRatio: metrics.whaleDominanceRatio,
          botActivityIndex: metrics.botActivityIndex,
          wealthInequalityGini: metrics.wealthInequalityGini,
          criticalAlerts: metrics.criticalAlerts
        },
        effectiveness: 1 - metrics.extractionPressure,
        lastUpdated: Date.now()
      };
    } catch (error) {
      logger.error('Error getting exploitation detection data:', error);
      return { name: 'Exploitation Detection Layer', status: 'error', metrics: {}, effectiveness: 0 };
    }
  }

  // Get governance feedback loop data
  async getGovernanceFeedbackData() {
    try {
      const governanceFeedback = new GovernanceFeedbackLoop();
      const metrics = await governanceFeedback.getGovernanceMetrics();

      return {
        name: 'Governance Feedback Loop',
        status: metrics.participationRate > 0.5 ? 'healthy' : 'concerning',
        metrics: {
          participationRate: metrics.participationRate,
          sentimentScore: metrics.sentimentScore,
          microGovernanceDecisions: metrics.microGovernanceDecisions,
          averageDecisionTime: metrics.averageDecisionTime,
          citizenConcerns: metrics.citizenConcerns
        },
        effectiveness: metrics.participationRate,
        lastUpdated: Date.now()
      };
    } catch (error) {
      logger.error('Error getting governance feedback data:', error);
      return { name: 'Governance Feedback Loop', status: 'error', metrics: {}, effectiveness: 0 };
    }
  }

  // Get meaning and purpose engine data
  async getMeaningEngineData() {
    try {
      const meaningEngine = new MeaningAndPurposeEngine();
      const metrics = await meaningEngine.getMeaningAndPurposeMetrics();

      return {
        name: 'Meaning & Purpose Engine',
        status: metrics.purposeAlignment > 0.5 ? 'healthy' : 'developing',
        metrics: {
          purposeAlignment: metrics.purposeAlignment,
          culturalVitality: metrics.culturalVitality,
          universityModules: metrics.universityModules,
          activeMentors: metrics.activeMentors,
          achievementsAvailable: metrics.achievementsAvailable
        },
        effectiveness: metrics.purposeAlignment,
        lastUpdated: Date.now()
      };
    } catch (error) {
      logger.error('Error getting meaning engine data:', error);
      return { name: 'Meaning & Purpose Engine', status: 'error', metrics: {}, effectiveness: 0 };
    }
  }

  // Get regenerative growth layer data
  async getRegenerativeGrowthData() {
    try {
      const regenerativeGrowth = new RegenerativeGrowthLayer();
      const metrics = await regenerativeGrowth.getRegenerativeGrowthMetrics();

      return {
        name: 'Regenerative Growth Layer',
        status: metrics.overallScore > 0.6 ? 'healthy' : 'developing',
        metrics: {
          decentralizationTrend: metrics.decentralizationTrend,
          resilienceIndex: metrics.resilienceIndex,
          growthQuality: metrics.growthQuality,
          overallScore: metrics.overallScore
        },
        effectiveness: metrics.overallScore,
        lastUpdated: Date.now()
      };
    } catch (error) {
      logger.error('Error getting regenerative growth data:', error);
      return { name: 'Regenerative Growth Layer', status: 'error', metrics: {}, effectiveness: 0 };
    }
  }

  // Get alerts data
  async getAlertsData() {
    try {
      const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
      if (!cse) {
        return {
          active: [],
          resolved: [],
          total: 0,
          critical: 0,
          warning: 0
        };
      }

      const active = cse.alerts.filter(a => !a.resolved);
      const resolved = cse.alerts.filter(a => a.resolved);
      const critical = active.filter(a => a.type === 'EMERGENCY' || a.type === 'CRITICAL');
      const warning = active.filter(a => a.type === 'WARNING');

      return {
        active: active.map(alert => ({
          id: alert._id,
          type: alert.type,
          message: alert.message,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
          timestamp: alert.timestamp,
          actions: alert.actions
        })),
        resolved: resolved.map(alert => ({
          id: alert._id,
          type: alert.type,
          message: alert.message,
          resolvedAt: alert.resolvedAt,
          duration: alert.resolvedAt - alert.timestamp
        })),
        total: active.length,
        critical: critical.length,
        warning: warning.length
      };
    } catch (error) {
      logger.error('Error getting alerts data:', error);
      return { active: [], resolved: [], total: 0, critical: 0, warning: 0 };
    }
  }

  // Get trends data
  async getTrendsData() {
    try {
      const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
      if (!cse || cse.stabilityHistory.length < 2) {
        return {
          stability: [],
          components: {},
          summary: {
            direction: 'stable',
            rate: 0,
            confidence: 0
          }
        };
      }

      const stabilityHistory = cse.stabilityHistory.slice(-this.maxDataPoints);
      
      // Calculate trends for each component
      const componentTrends = {};
      const components = ['trustIndex', 'participationRate', 'wealthInequalityGini', 'powerConcentrationIndex', 'extractionPressure'];
      
      components.forEach(component => {
        componentTrends[component] = this.calculateComponentTrend(cse, component);
      });

      return {
        stability: stabilityHistory.map(point => ({
          timestamp: point.timestamp,
          score: point.score,
          triggers: point.triggers,
          actions: point.actions
        })),
        components: componentTrends,
        summary: this.calculateOverallTrend(stabilityHistory)
      };
    } catch (error) {
      logger.error('Error getting trends data:', error);
      return { stability: [], components: {}, summary: { direction: 'stable', rate: 0, confidence: 0 } };
    }
  }

  // Get recommendations data
  async getRecommendationsData() {
    try {
      const monitor = new StabilityEquationMonitor();
      const equationResult = await monitor.calculateStabilityEquation();

      return {
        active: equationResult.recommendations.map(rec => ({
          priority: rec.priority,
          action: rec.action,
          description: rec.description,
          expectedImpact: rec.expectedImpact,
          timeframe: rec.timeframe,
          status: 'pending'
        })),
        implemented: await this.getImplementedRecommendations(),
        effectiveness: await this.calculateRecommendationEffectiveness()
      };
    } catch (error) {
      logger.error('Error getting recommendations data:', error);
      return { active: [], implemented: [], effectiveness: 0 };
    }
  }

  // Get immune system data
  async getImmuneSystemData() {
    try {
      // This would interface with the CivilizationImmuneSystem
      // For now, return placeholder data
      return {
        active: true,
        agents: {
          total: 8,
          active: 7,
          averageEffectiveness: 0.75,
          averageEnergy: 0.85
        },
        recentActivity: {
          threatsDetected: 3,
          threatsNeutralized: 2,
          responsesExecuted: 5,
          lastActivity: Date.now() - 300000 // 5 minutes ago
        },
        status: 'operational'
      };
    } catch (error) {
      logger.error('Error getting immune system data:', error);
      return { active: false, agents: {}, recentActivity: {}, status: 'error' };
    }
  }

  // Get forecasts data
  async getForecastsData() {
    try {
      const monitor = new StabilityEquationMonitor();
      const equationResult = await monitor.calculateStabilityEquation();
      const forecast = await monitor.generateStabilityForecast(equationResult);

      return {
        stability: forecast,
        confidence: equationResult.trend.confidence,
        methodology: 'linear_regression_with_confidence_adjustment',
        lastUpdated: Date.now(),
        accuracy: await this.calculateForecastAccuracy()
      };
    } catch (error) {
      logger.error('Error getting forecasts data:', error);
      return { stability: {}, confidence: 0, methodology: 'error', lastUpdated: Date.now(), accuracy: 0 };
    }
  }

  // Helper methods
  determineStatus(stabilityScore) {
    if (stabilityScore >= this.alertThresholds.optimal) return 'OPTIMAL';
    if (stabilityScore >= this.alertThresholds.warning) return 'STABLE';
    if (stabilityScore >= this.alertThresholds.critical) return 'AT_RISK';
    return 'CRITICAL';
  }

  determineHealth(cse) {
    const activeStabilizers = cse.activeStabilizers.length;
    const unresolvedAlerts = cse.alerts.filter(a => !a.resolved).length;
    
    if (unresolvedAlerts === 0 && activeStabilizers <= 2) return 'EXCELLENT';
    if (unresolvedAlerts <= 2 && activeStabilizers <= 4) return 'GOOD';
    if (unresolvedAlerts <= 5 && activeStabilizers <= 6) return 'FAIR';
    return 'POOR';
  }

  async getHistoricalStabilityData() {
    try {
      const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
      if (!cse) return [];

      return cse.stabilityHistory.slice(-this.maxDataPoints).map(point => ({
        timestamp: point.timestamp,
        score: point.score,
        triggers: point.triggers,
        actions: point.actions
      }));
    } catch (error) {
      logger.error('Error getting historical stability data:', error);
      return [];
    }
  }

  calculateComponentTrend(cse, component) {
    // This would calculate trend for a specific component
    // For now, return placeholder
    return {
      direction: 'stable',
      rate: 0,
      confidence: 0.5,
      dataPoints: 10
    };
  }

  calculateOverallTrend(history) {
    if (history.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }

    // Simple linear regression
    const n = history.length;
    const sumX = history.reduce((sum, point, index) => sum + index, 0);
    const sumY = history.reduce((sum, point) => sum + point.score, 0);
    const sumXY = history.reduce((sum, point, index) => sum + index * point.score, 0);
    const sumX2 = history.reduce((sum, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    const direction = slope > 0.01 ? 'improving' : slope < -0.01 ? 'declining' : 'stable';
    
    return {
      direction,
      rate: slope,
      confidence: Math.min(1, history.length / 20) // Confidence based on data points
    };
  }

  async getImplementedRecommendations() {
    // This would track implemented recommendations
    // For now, return placeholder
    return [
      {
        action: 'ACTIVATE_TRUST_VERIFICATION',
        implementedAt: Date.now() - 86400000, // 1 day ago
        effectiveness: 0.8
      }
    ];
  }

  async calculateRecommendationEffectiveness() {
    // This would calculate the effectiveness of implemented recommendations
    // For now, return placeholder
    return 0.75;
  }

  calculateForecastAccuracy() {
    // This would calculate forecast accuracy by comparing predictions to actual outcomes
    // For now, return placeholder
    return 0.82;
  }

  // Get real-time updates
  async getRealTimeUpdates() {
    try {
      const currentData = await this.getDashboardData();
      const previousData = await this.getPreviousDashboardData();
      
      return {
        timestamp: Date.now(),
        changes: this.calculateChanges(currentData, previousData),
        newAlerts: this.getNewAlerts(currentData.alerts, previousData.alerts),
        statusChanges: this.getStatusChanges(currentData, previousData)
      };
    } catch (error) {
      logger.error('Error getting real-time updates:', error);
      return { timestamp: Date.now(), changes: {}, newAlerts: [], statusChanges: [] };
    }
  }

  async getPreviousDashboardData() {
    // This would fetch the previous dashboard data for comparison
    // For now, return empty object
    return {};
  }

  calculateChanges(current, previous) {
    const changes = {};
    
    // Calculate changes for key metrics
    const keys = ['stabilityScore', 'trustIndex', 'participationRate'];
    keys.forEach(key => {
      if (current[key] !== undefined && previous[key] !== undefined) {
        const change = current[key] - previous[key];
        if (Math.abs(change) > 0.01) { // Only report significant changes
          changes[key] = {
            previous: previous[key],
            current: current[key],
            change: change,
            percentChange: (change / previous[key]) * 100
          };
        }
      }
    });
    
    return changes;
  }

  getNewAlerts(currentAlerts, previousAlerts) {
    if (!previousAlerts || !previousAlerts.active) return currentAlerts.active;
    
    const previousIds = previousAlerts.active.map(a => a.id);
    return currentAlerts.active.filter(a => !previousIds.includes(a.id));
  }

  getStatusChanges(current, previous) {
    const statusChanges = [];
    
    // Check for status changes in key components
    if (current.overview?.status !== previous.overview?.status) {
      statusChanges.push({
        component: 'overview',
        previous: previous.overview?.status,
        current: current.overview?.status,
        timestamp: Date.now()
      });
    }
    
    return statusChanges;
  }
}

module.exports = CSEDashboard;
