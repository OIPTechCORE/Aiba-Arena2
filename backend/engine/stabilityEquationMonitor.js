const CivilizationStabilityEngine = require('../models/CivilizationStabilityEngine');
const { PowerDiffusionLayer, EconomicShockAbsorber } = require('./civilizationStabilityEngine');
const TrustVerificationLayer = require('./trustVerificationLayer');
const ExploitationDetectionLayer = require('./exploitationDetectionLayer');
const GovernanceFeedbackLoop = require('./governanceFeedbackLoop');
const MeaningAndPurposeEngine = require('./meaningAndPurposeEngine');
const RegenerativeGrowthLayer = require('./regenerativeGrowthLayer');
const logger = require('../utils/logger');

class StabilityEquationMonitor {
  constructor() {
    this.monitoringInterval = 60000; // 1 minute
    this.alertThresholds = {
      critical: 0.3,
      warning: 0.5,
      optimal: 0.7
    };
    this.historicalDataPoints = 100; // Keep last 100 data points
  }

  // Calculate the Stability Equation: (Trust × Participation × Fairness) / Power Concentration > Extraction Pressure
  async calculateStabilityEquation() {
    try {
      // Get all component metrics
      const metrics = await this.getAllComponentMetrics();
      
      // Calculate equation components
      const trust = metrics.trustIndex;
      const participation = metrics.participationRate;
      const fairness = 1 - metrics.wealthInequalityGini; // Fairness is inverse of inequality
      const powerConcentration = metrics.powerConcentrationIndex;
      const extractionPressure = metrics.extractionPressure;
      
      // Calculate numerator and denominator
      const numerator = trust * participation * fairness;
      const denominator = powerConcentration + extractionPressure;
      
      // Calculate stability score
      const stabilityScore = denominator > 0 ? numerator / denominator : 0;
      
      // Determine stability status
      const status = this.determineStabilityStatus(stabilityScore);
      
      // Calculate component contributions
      const componentAnalysis = this.analyzeComponentContributions(
        trust, participation, fairness, powerConcentration, extractionPressure
      );
      
      // Calculate trend
      const trend = await this.calculateStabilityTrend(stabilityScore);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        stabilityScore, status, componentAnalysis, metrics
      );
      
      const equationResult = {
        timestamp: Date.now(),
        equation: {
          numerator,
          denominator,
          stabilityScore,
          status
        },
        components: {
          trust,
          participation,
          fairness,
          powerConcentration,
          extractionPressure
        },
        componentAnalysis,
        trend,
        recommendations,
        alerts: this.generateAlerts(stabilityScore, status, componentAnalysis)
      };
      
      // Store in database
      await this.storeStabilityEquationResult(equationResult);
      
      logger.info(`Stability Equation calculated: Score=${stabilityScore.toFixed(3)}, Status=${status}`);
      return equationResult;
    } catch (error) {
      logger.error('Error calculating stability equation:', error);
      throw error;
    }
  }

  // Get all component metrics from various layers
  async getAllComponentMetrics() {
    try {
      const powerDiffusion = new PowerDiffusionLayer();
      const economicShockAbsorber = new EconomicShockAbsorber();
      const trustVerification = new TrustVerificationLayer();
      const exploitationDetection = new ExploitationDetectionLayer();
      const governanceFeedback = new GovernanceFeedbackLoop();
      const meaningEngine = new MeaningAndPurposeEngine();
      const regenerativeGrowth = new RegenerativeGrowthLayer();
      
      // Get metrics from all layers
      const [
        powerMetrics,
        economicMetrics,
        trustMetrics,
        exploitationMetrics,
        governanceMetrics,
        meaningMetrics,
        growthMetrics
      ] = await Promise.all([
        powerDiffusion.getPowerMetrics(),
        economicShockAbsorber.getEconomicMetrics(),
        trustVerification.getTrustMetrics(),
        exploitationDetection.getExploitationMetrics(),
        governanceFeedback.getGovernanceMetrics(),
        meaningEngine.getMeaningAndPurposeMetrics(),
        regenerativeGrowth.getRegenerativeGrowthMetrics()
      ]);
      
      return {
        // Trust component
        trustIndex: trustMetrics.trustIndex,
        reputationScore: trustMetrics.reputationScore,
        fraudDetectionScore: trustMetrics.fraudDetectionScore,
        
        // Participation component
        participationRate: governanceMetrics.participationRate,
        sentimentScore: governanceMetrics.sentimentScore,
        governanceDiversity: powerMetrics.governanceDiversity,
        
        // Fairness component
        wealthInequalityGini: economicMetrics.wealthInequalityGini,
        economicVolatility: economicMetrics.economicVolatility,
        treasuryStabilityRatio: economicMetrics.treasuryStabilityRatio,
        
        // Power Concentration component
        powerConcentrationIndex: powerMetrics.powerConcentrationIndex,
        authorityDecayRate: powerMetrics.authorityDecayRate,
        councilMembers: powerMetrics.councilMembers,
        
        // Extraction Pressure component
        extractionPressure: exploitationMetrics.extractionPressure,
        whaleDominanceRatio: exploitationMetrics.whaleDominanceRatio,
        botActivityIndex: exploitationMetrics.botActivityIndex,
        criticalAlerts: exploitationMetrics.criticalAlerts,
        
        // Additional context
        purposeAlignment: meaningMetrics.purposeAlignment,
        culturalVitality: meaningMetrics.culturalVitality,
        decentralizationTrend: growthMetrics.decentralizationTrend,
        resilienceIndex: growthMetrics.resilienceIndex
      };
    } catch (error) {
      logger.error('Error getting component metrics:', error);
      throw error;
    }
  }

  // Determine stability status based on score
  determineStabilityStatus(stabilityScore) {
    if (stabilityScore >= this.alertThresholds.optimal) {
      return 'OPTIMAL';
    } else if (stabilityScore >= this.alertThresholds.warning) {
      return 'STABLE';
    } else if (stabilityScore >= this.alertThresholds.critical) {
      return 'AT_RISK';
    } else {
      return 'CRITICAL';
    }
  }

  // Analyze component contributions to stability
  analyzeComponentContributions(trust, participation, fairness, powerConcentration, extractionPressure) {
    const contributions = {};
    
    // Calculate each component's impact on the equation
    const baseNumerator = trust * participation * fairness;
    const baseDenominator = powerConcentration + extractionPressure;
    
    // Trust impact
    const trustImpact = ((1 * participation * fairness) / baseDenominator) - (baseNumerator / baseDenominator);
    contributions.trust = {
      value: trust,
      impact: trustImpact,
      weight: Math.abs(trustImpact) / (Math.abs(trustImpact) + Math.abs(participation * trust / baseDenominator) + Math.abs(fairness * trust * participation / (baseDenominator * baseDenominator))),
      status: trust > 0.7 ? 'strong' : trust > 0.5 ? 'moderate' : 'weak'
    };
    
    // Participation impact
    const participationImpact = ((trust * 1 * fairness) / baseDenominator) - (baseNumerator / baseDenominator);
    contributions.participation = {
      value: participation,
      impact: participationImpact,
      weight: Math.abs(participationImpact) / (Math.abs(trustImpact) + Math.abs(participationImpact) + Math.abs(fairness * trust * participation / (baseDenominator * baseDenominator))),
      status: participation > 0.6 ? 'strong' : participation > 0.4 ? 'moderate' : 'weak'
    };
    
    // Fairness impact
    const fairnessImpact = ((trust * participation * 1) / baseDenominator) - (baseNumerator / baseDenominator);
    contributions.fairness = {
      value: fairness,
      impact: fairnessImpact,
      weight: Math.abs(fairnessImpact) / (Math.abs(trustImpact) + Math.abs(participationImpact) + Math.abs(fairnessImpact)),
      status: fairness > 0.7 ? 'strong' : fairness > 0.5 ? 'moderate' : 'weak'
    };
    
    // Power concentration impact (negative)
    const powerConcentrationImpact = -(baseNumerator / (1 + extractionPressure)) + (baseNumerator / baseDenominator);
    contributions.powerConcentration = {
      value: powerConcentration,
      impact: powerConcentrationImpact,
      weight: Math.abs(powerConcentrationImpact) / (Math.abs(powerConcentrationImpact) + Math.abs(extractionPressure * baseNumerator / (baseDenominator * baseDenominator))),
      status: powerConcentration < 0.3 ? 'good' : powerConcentration < 0.5 ? 'moderate' : 'concerning'
    };
    
    // Extraction pressure impact (negative)
    const extractionImpact = -(baseNumerator / (powerConcentration + 1)) + (baseNumerator / baseDenominator);
    contributions.extractionPressure = {
      value: extractionPressure,
      impact: extractionImpact,
      weight: Math.abs(extractionImpact) / (Math.abs(powerConcentrationImpact) + Math.abs(extractionImpact)),
      status: extractionPressure < 0.2 ? 'low' : extractionPressure < 0.4 ? 'moderate' : 'high'
    };
    
    // Identify most critical component
    const criticalComponent = Object.entries(contributions).reduce((critical, [component, data]) => {
      const criticality = Math.abs(data.impact) * (data.status === 'weak' || data.status === 'concerning' || data.status === 'high' ? 2 : 1);
      return criticality > critical.criticality ? { component, criticality, ...data } : critical;
    }, { component: null, criticality: 0 });
    
    return {
      contributions,
      criticalComponent: criticalComponent.component,
      overallBalance: this.calculateOverallBalance(contributions)
    };
  }

  // Calculate overall balance of components
  calculateOverallBalance(contributions) {
    const positiveComponents = ['trust', 'participation', 'fairness'];
    const negativeComponents = ['powerConcentration', 'extractionPressure'];
    
    const positiveScore = positiveComponents.reduce((sum, comp) => sum + contributions[comp].value, 0) / positiveComponents.length;
    const negativeScore = negativeComponents.reduce((sum, comp) => sum + contributions[comp].value, 0) / negativeComponents.length;
    
    return {
      positiveScore,
      negativeScore,
      balance: positiveScore - negativeScore,
      isBalanced: Math.abs(positiveScore - negativeScore) < 0.2
    };
  }

  // Calculate stability trend
  async calculateStabilityTrend(currentScore) {
    try {
      const cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
      if (!cse || cse.stabilityHistory.length < 2) {
        return {
          direction: 'stable',
          rate: 0,
          confidence: 0
        };
      }
      
      const recentHistory = cse.stabilityHistory.slice(-10); // Last 10 data points
      if (recentHistory.length < 2) {
        return {
          direction: 'stable',
          rate: 0,
          confidence: 0
        };
      }
      
      // Calculate trend using linear regression
      const n = recentHistory.length;
      const sumX = recentHistory.reduce((sum, point, index) => sum + index, 0);
      const sumY = recentHistory.reduce((sum, point) => sum + point.score, 0);
      const sumXY = recentHistory.reduce((sum, point, index) => sum + index * point.score, 0);
      const sumX2 = recentHistory.reduce((sum, index) => sum + index * index, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Calculate R-squared for confidence
      const yMean = sumY / n;
      const ssTotal = recentHistory.reduce((sum, point) => sum + Math.pow(point.score - yMean, 2), 0);
      const ssResidual = recentHistory.reduce((sum, point, index) => {
        const predicted = slope * index + intercept;
        return sum + Math.pow(point.score - predicted, 2);
      }, 0);
      
      const rSquared = 1 - (ssResidual / ssTotal);
      const confidence = Math.max(0, rSquared);
      
      const direction = slope > 0.01 ? 'improving' : slope < -0.01 ? 'declining' : 'stable';
      
      return {
        direction,
        rate: slope,
        confidence,
        intercept,
        dataPoints: recentHistory.length
      };
    } catch (error) {
      logger.error('Error calculating stability trend:', error);
      return {
        direction: 'stable',
        rate: 0,
        confidence: 0
      };
    }
  }

  // Generate recommendations based on stability analysis
  generateRecommendations(stabilityScore, status, componentAnalysis, metrics) {
    const recommendations = [];
    
    if (status === 'CRITICAL' || status === 'AT_RISK') {
      // Critical recommendations
      if (componentAnalysis.criticalComponent === 'trust') {
        recommendations.push({
          priority: 'critical',
          action: 'ACTIVATE_TRUST_VERIFICATION',
          description: 'Trust levels are critically low - activate trust verification systems',
          expectedImpact: 0.3,
          timeframe: 'immediate'
        });
      }
      
      if (componentAnalysis.criticalComponent === 'participation') {
        recommendations.push({
          priority: 'critical',
          action: 'BOOST_PARTICIPATION',
          description: 'Participation is dangerously low - implement participation incentives',
          expectedImpact: 0.25,
          timeframe: 'immediate'
        });
      }
      
      if (componentAnalysis.criticalComponent === 'powerConcentration') {
        recommendations.push({
          priority: 'critical',
          action: 'ACTIVATE_POWER_DIFFUSION',
          description: 'Power concentration is too high - activate power diffusion mechanisms',
          expectedImpact: 0.35,
          timeframe: 'immediate'
        });
      }
      
      if (componentAnalysis.criticalComponent === 'extractionPressure') {
        recommendations.push({
          priority: 'critical',
          action: 'ACTIVATE_EXPLOITATION_DETECTION',
          description: 'Extraction pressure is critical - activate exploitation detection',
          expectedImpact: 0.4,
          timeframe: 'immediate'
        });
      }
    }
    
    if (status === 'AT_RISK' || status === 'STABLE') {
      // Preventive recommendations
      if (metrics.trustIndex < 0.6) {
        recommendations.push({
          priority: 'high',
          action: 'ENHANCE_TRUST_BUILDING',
          description: 'Trust is below optimal levels - enhance trust building initiatives',
          expectedImpact: 0.15,
          timeframe: '1_week'
        });
      }
      
      if (metrics.participationRate < 0.5) {
        recommendations.push({
          priority: 'high',
          action: 'IMPROVE_GOVERNANCE_ACCESS',
          description: 'Participation could be improved - make governance more accessible',
          expectedImpact: 0.12,
          timeframe: '2_weeks'
        });
      }
      
      if (metrics.wealthInequalityGini > 0.4) {
        recommendations.push({
          priority: 'medium',
          action: 'ADJUST_ECONOMIC_BALANCE',
          description: 'Wealth inequality is rising - adjust economic balance mechanisms',
          expectedImpact: 0.1,
          timeframe: '1_month'
        });
      }
    }
    
    if (status === 'OPTIMAL') {
      // Maintenance recommendations
      recommendations.push({
        priority: 'low',
        action: 'MAINTAIN_STABILITY',
        description: 'System is stable - continue monitoring and maintenance',
        expectedImpact: 0.05,
        timeframe: 'ongoing'
      });
      
      if (metrics.purposeAlignment < 0.7) {
        recommendations.push({
          priority: 'medium',
          action: 'ENHANCE_MEANING_PURPOSE',
          description: 'Enhance meaning and purpose systems for long-term stability',
          expectedImpact: 0.08,
          timeframe: '2_months'
        });
      }
    }
    
    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact - a.expectedImpact;
    });
  }

  // Generate alerts based on stability analysis
  generateAlerts(stabilityScore, status, componentAnalysis) {
    const alerts = [];
    
    if (status === 'CRITICAL') {
      alerts.push({
        type: 'EMERGENCY',
        message: 'Civilization stability is in critical condition',
        severity: 'critical',
        component: 'overall',
        value: stabilityScore,
        threshold: this.alertThresholds.critical,
        actions: ['IMMEDIATE_INTERVENTION', 'EMERGENCY_PROTOCOLS', 'COMMUNITY_NOTIFICATION']
      });
    } else if (status === 'AT_RISK') {
      alerts.push({
        type: 'WARNING',
        message: 'Civilization stability is at risk',
        severity: 'high',
        component: 'overall',
        value: stabilityScore,
        threshold: this.alertThresholds.warning,
        actions: ['PREVENTIVE_MEASURES', 'INCREASED_MONITORING', 'STABILIZER_ACTIVATION']
      });
    }
    
    // Component-specific alerts
    Object.entries(componentAnalysis.contributions).forEach(([component, data]) => {
      if (data.status === 'weak' || data.status === 'concerning' || data.status === 'high') {
        alerts.push({
          type: 'COMPONENT_ALERT',
          message: `${component} is ${data.status}`,
          severity: data.status === 'weak' || data.status === 'concerning' ? 'medium' : 'high',
          component,
          value: data.value,
          impact: data.impact,
          actions: this.getComponentActions(component, data.status)
        });
      }
    });
    
    return alerts;
  }

  // Get actions for specific component issues
  getComponentActions(component, status) {
    const actionMap = {
      trust: {
        weak: ['TRUST_VERIFICATION', 'REPUTATION_SYSTEMS', 'COMMUNITY_HEALING'],
        concerning: ['FRAUD_DETECTION', 'TRANSPARENCY_MEASURES', 'ACCOUNTABILITY_SYSTEMS']
      },
      participation: {
        weak: ['PARTICIPATION_INCENTIVES', 'GOVERNANCE_SIMPLIFICATION', 'EDUCATION_PROGRAMS'],
        moderate: ['MICRO_GOVERNANCE', 'FEEDBACK_LOOPS', 'DECENTRALIZED_DECISIONS']
      },
      fairness: {
        weak: ['REDISTRIBUTION_MECHANISMS', 'PROGRESSIVE_SYSTEMS', 'EQUALITY_MEASURES'],
        moderate: ['ECONOMIC_BALANCE', 'OPPORTUNITY_CREATION', 'FAIRNESS_AUDITS']
      },
      powerConcentration: {
        moderate: ['POWER_DIFFUSION', 'AUTHORITY_ROTATION', 'TERM_LIMITS'],
        concerning: ['COUNCIL_ROTATION', 'CITIZEN_JURIES', 'DECENTRALIZATION_MANDATES']
      },
      extractionPressure: {
        moderate: ['EXPLOITATION_DETECTION', 'BOT_PREVENTION', 'SYBIL_PROTECTION'],
        high: ['IMMUNE_SYSTEM', 'AGGRESSIVE_DETECTION', 'RAPID_RESPONSE']
      }
    };
    
    return actionMap[component]?.[status] || ['MONITORING', 'ANALYSIS', 'PLANNING'];
  }

  // Store stability equation result
  async storeStabilityEquationResult(result) {
    try {
      let cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
      if (!cse) {
        cse = new CivilizationStabilityEngine();
      }
      
      // Update current metrics
      cse.trustIndex = result.components.trust;
      cse.participationRate = result.components.participation;
      cse.wealthInequalityGini = 1 - result.components.fairness;
      cse.powerConcentrationIndex = result.components.powerConcentration;
      cse.extractionPressure = result.components.extractionPressure;
      cse.stabilityScore = result.equation.stabilityScore;
      
      // Add to history
      cse.stabilityHistory.push({
        timestamp: result.timestamp,
        score: result.equation.stabilityScore,
        triggers: result.alerts.map(a => a.type),
        actions: result.recommendations.map(r => r.action)
      });
      
      // Keep only recent history
      if (cse.stabilityHistory.length > this.historicalDataPoints) {
        cse.stabilityHistory = cse.stabilityHistory.slice(-this.historicalDataPoints);
      }
      
      // Add alerts if critical
      result.alerts.forEach(alert => {
        if (alert.severity === 'critical' || alert.severity === 'high') {
          const existingAlert = cse.alerts.find(a => 
            a.metric === alert.component && 
            !a.resolved &&
            (Date.now() - a.timestamp) < 24 * 60 * 60 * 1000
          );
          
          if (!existingAlert) {
            cse.alerts.push({
              type: alert.severity === 'critical' ? 'EMERGENCY' : 'WARNING',
              message: alert.message,
              metric: alert.component,
              value: alert.value,
              threshold: alert.threshold || 0.5,
              timestamp: result.timestamp,
              actions: alert.actions
            });
          }
        }
      });
      
      await cse.save();
    } catch (error) {
      logger.error('Error storing stability equation result:', error);
    }
  }

  // Start continuous monitoring
  startMonitoring() {
    logger.info('Starting Stability Equation monitoring...');
    
    const monitor = async () => {
      try {
        await this.calculateStabilityEquation();
      } catch (error) {
        logger.error('Error in stability monitoring:', error);
      }
    };
    
    // Run immediately
    monitor();
    
    // Set up interval
    this.monitoringTimer = setInterval(monitor, this.monitoringInterval);
    
    logger.info(`Stability Equation monitoring started (interval: ${this.monitoringInterval}ms)`);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      logger.info('Stability Equation monitoring stopped');
    }
  }

  // Get comprehensive stability report
  async getStabilityReport() {
    try {
      const equationResult = await this.calculateStabilityEquation();
      
      return {
        timestamp: equationResult.timestamp,
        executiveSummary: {
          stabilityScore: equationResult.equation.stabilityScore,
          status: equationResult.equation.status,
          trend: equationResult.trend.direction,
          criticalIssues: equationResult.alerts.filter(a => a.severity === 'critical').length
        },
        equation: equationResult.equation,
        components: equationResult.components,
        analysis: equationResult.componentAnalysis,
        alerts: equationResult.alerts,
        recommendations: equationResult.recommendations,
        forecast: await this.generateStabilityForecast(equationResult)
      };
    } catch (error) {
      logger.error('Error generating stability report:', error);
      throw error;
    }
  }

  // Generate stability forecast
  async generateStabilityForecast(currentResult) {
    try {
      const trend = currentResult.trend;
      const currentScore = currentResult.equation.stabilityScore;
      
      // Simple linear forecast based on trend
      const forecastPeriods = [7, 14, 30]; // 7 days, 14 days, 30 days
      const forecast = {};
      
      forecastPeriods.forEach(days => {
        const projectedScore = currentScore + (trend.rate * days);
        const projectedStatus = this.determineStabilityStatus(projectedScore);
        
        forecast[`${days}days`] = {
          projectedScore,
          status: projectedStatus,
          confidence: trend.confidence * Math.max(0, 1 - (days / 30)), // Confidence decreases over time
          riskFactors: this.identifyRiskFactors(currentResult, days)
        };
      });
      
      return forecast;
    } catch (error) {
      logger.error('Error generating stability forecast:', error);
      return {};
    }
  }

  // Identify risk factors for forecast
  identifyRiskFactors(currentResult, days) {
    const riskFactors = [];
    
    if (currentResult.components.extractionPressure > 0.3) {
      riskFactors.push({
        factor: 'extraction_pressure',
        probability: 0.7,
        impact: 'high',
        description: 'High extraction pressure may increase over time'
      });
    }
    
    if (currentResult.components.powerConcentration > 0.4) {
      riskFactors.push({
        factor: 'power_concentration',
        probability: 0.6,
        impact: 'medium',
        description: 'Power concentration may lead to further centralization'
      });
    }
    
    if (currentResult.trend.direction === 'declining') {
      riskFactors.push({
        factor: 'negative_trend',
        probability: 0.8,
        impact: 'high',
        description: 'Current negative trend may continue if not addressed'
      });
    }
    
    return riskFactors;
  }
}

module.exports = StabilityEquationMonitor;
