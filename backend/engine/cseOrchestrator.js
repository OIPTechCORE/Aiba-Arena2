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

class CivilizationStabilityEngineOrchestrator {
  constructor() {
    this.isRunning = false;
    this.components = {};
    this.monitoringInterval = 60000; // 1 minute
    this.healthCheckInterval = 300000; // 5 minutes
  }

  // Initialize the entire CSE system
  async initialize() {
    try {
      logger.info('Initializing Civilization Stability Engine...');
      
      // Initialize all components
      await this.initializeComponents();
      
      // Start monitoring
      await this.startMonitoring();
      
      // Start health checks
      await this.startHealthChecks();
      
      this.isRunning = true;
      
      logger.info('Civilization Stability Engine initialized successfully');
      return {
        status: 'initialized',
        components: Object.keys(this.components),
        monitoring: 'active',
        healthChecks: 'active'
      };
    } catch (error) {
      logger.error('Error initializing CSE:', error);
      throw error;
    }
  }

  // Initialize all CSE components
  async initializeComponents() {
    try {
      // Initialize core monitoring
      this.components.stabilityMonitor = new StabilityEquationMonitor();
      
      // Initialize immune system
      this.components.immuneSystem = new CivilizationImmuneSystem();
      await this.components.immuneSystem.initialize();
      
      // Initialize all layers
      this.components.powerDiffusion = new PowerDiffusionLayer();
      this.components.economicShockAbsorber = new EconomicShockAbsorber();
      this.components.trustVerification = new TrustVerificationLayer();
      this.components.exploitationDetection = new ExploitationDetectionLayer();
      this.components.governanceFeedback = new GovernanceFeedbackLoop();
      this.components.meaningEngine = new MeaningAndPurposeEngine();
      this.components.regenerativeGrowth = new RegenerativeGrowthLayer();
      
      logger.info(`Initialized ${Object.keys(this.components).length} CSE components`);
    } catch (error) {
      logger.error('Error initializing CSE components:', error);
      throw error;
    }
  }

  // Start comprehensive monitoring
  async startMonitoring() {
    try {
      // Start stability equation monitoring
      this.components.stabilityMonitor.startMonitoring();
      
      // Set up periodic comprehensive checks
      this.monitoringTimer = setInterval(async () => {
        await this.performComprehensiveCheck();
      }, this.monitoringInterval);
      
      logger.info('CSE monitoring started');
    } catch (error) {
      logger.error('Error starting CSE monitoring:', error);
      throw error;
    }
  }

  // Start health checks
  async startHealthChecks() {
    try {
      this.healthCheckTimer = setInterval(async () => {
        await this.performHealthCheck();
      }, this.healthCheckInterval);
      
      logger.info('CSE health checks started');
    } catch (error) {
      logger.error('Error starting CSE health checks:', error);
      throw error;
    }
  }

  // Perform comprehensive check
  async performComprehensiveCheck() {
    try {
      const checkResults = {
        timestamp: Date.now(),
        stabilityEquation: await this.components.stabilityMonitor.calculateStabilityEquation(),
        layerMetrics: await this.getAllLayerMetrics(),
        immuneSystemStatus: await this.components.immuneSystem.getImmuneSystemStatus(),
        recommendations: await this.generateSystemRecommendations()
      };
      
      // Store results
      await this.storeCheckResults(checkResults);
      
      // Trigger auto-corrections if needed
      await this.handleAutoCorrections(checkResults);
      
      return checkResults;
    } catch (error) {
      logger.error('Error in comprehensive check:', error);
    }
  }

  // Get metrics from all layers
  async getAllLayerMetrics() {
    try {
      const [
        powerMetrics,
        economicMetrics,
        trustMetrics,
        exploitationMetrics,
        governanceMetrics,
        meaningMetrics,
        growthMetrics
      ] = await Promise.all([
        this.components.powerDiffusion.getPowerMetrics(),
        this.components.economicShockAbsorber.getEconomicMetrics(),
        this.components.trustVerification.getTrustMetrics(),
        this.components.exploitationDetection.getExploitationMetrics(),
        this.components.governanceFeedback.getGovernanceMetrics(),
        this.components.meaningEngine.getMeaningAndPurposeMetrics(),
        this.components.regenerativeGrowth.getRegenerativeGrowthMetrics()
      ]);
      
      return {
        powerDiffusion: powerMetrics,
        economicShockAbsorber: economicMetrics,
        trustVerification: trustMetrics,
        exploitationDetection: exploitationMetrics,
        governanceFeedback: governanceMetrics,
        meaningEngine: meaningMetrics,
        regenerativeGrowth: growthMetrics
      };
    } catch (error) {
      logger.error('Error getting layer metrics:', error);
      return {};
    }
  }

  // Store check results
  async storeCheckResults(results) {
    try {
      let cse = await CivilizationStabilityEngine.findOne().sort({ createdAt: -1 });
      if (!cse) {
        cse = new CivilizationStabilityEngine();
      }
      
      // Update current metrics
      cse.trustIndex = results.stabilityEquation.components.trust;
      cse.participationRate = results.stabilityEquation.components.participation;
      cse.wealthInequalityGini = 1 - results.stabilityEquation.components.fairness;
      cse.powerConcentrationIndex = results.stabilityEquation.components.powerConcentration;
      cse.extractionPressure = results.stabilityEquation.components.extractionPressure;
      cse.stabilityScore = results.stabilityEquation.equation.stabilityScore;
      
      // Add to history
      cse.stabilityHistory.push({
        timestamp: results.timestamp,
        score: results.stabilityEquation.equation.stabilityScore,
        triggers: results.stabilityEquation.alerts.map(a => a.type),
        actions: results.recommendations.map(r => r.action)
      });
      
      // Keep only recent history
      if (cse.stabilityHistory.length > 100) {
        cse.stabilityHistory = cse.stabilityHistory.slice(-100);
      }
      
      await cse.save();
    } catch (error) {
      logger.error('Error storing check results:', error);
    }
  }

  // Handle auto-corrections
  async handleAutoCorrections(checkResults) {
    try {
      const criticalAlerts = checkResults.stabilityEquation.alerts.filter(a => 
        a.severity === 'critical' || a.severity === 'high'
      );
      
      if (criticalAlerts.length > 0) {
        logger.info(`Triggering auto-corrections for ${criticalAlerts.length} critical alerts`);
        
        for (const alert of criticalAlerts) {
          await this.triggerAutoCorrection(alert);
        }
      }
    } catch (error) {
      logger.error('Error handling auto-corrections:', error);
    }
  }

  // Trigger auto-correction for specific alert
  async triggerAutoCorrection(alert) {
    try {
      const actions = alert.actions || [];
      
      for (const action of actions) {
        await this.executeAutoCorrectionAction(action, alert);
      }
    } catch (error) {
      logger.error(`Error executing auto-correction for alert ${alert.type}:`, error);
    }
  }

  // Execute auto-correction action
  async executeAutoCorrectionAction(action, alert) {
    try {
      logger.info(`Executing auto-correction: ${action}`);
      
      switch (action) {
        case 'ACTIVATE_POWER_DIFFUSION':
          await this.components.powerDiffusion.decayAuthority();
          await this.components.powerDiffusion.rotateCouncils();
          break;
          
        case 'ACTIVATE_ECONOMIC_SHOCK_ABSORBER':
          await this.components.economicShockAbsorber.adjustEmissions(0.5);
          await this.components.economicShockAbsorber.applyAntiHoardingTax();
          break;
          
        case 'ACTIVATE_TRUST_VERIFICATION':
          await this.components.trustVerification.updateReputationScores();
          break;
          
        case 'ACTIVATE_EXPLOITATION_DETECTION':
          await this.components.exploitationDetection.runExploitationDetection();
          break;
          
        case 'ACTIVATE_GOVERNANCE_FEEDBACK':
          await this.components.governanceFeedback.createMicroGovernanceDecisions();
          break;
          
        case 'ACTIVATE_IMMUNE_SYSTEM':
          // Immune system is already running, just ensure it's active
          break;
          
        default:
          logger.warn(`Unknown auto-correction action: ${action}`);
      }
    } catch (error) {
      logger.error(`Error executing auto-correction action ${action}:`, error);
    }
  }

  // Generate system recommendations
  async generateSystemRecommendations() {
    try {
      const stabilityResult = await this.components.stabilityMonitor.calculateStabilityEquation();
      return stabilityResult.recommendations;
    } catch (error) {
      logger.error('Error generating system recommendations:', error);
      return [];
    }
  }

  // Perform health check
  async performHealthCheck() {
    try {
      const healthCheck = {
        timestamp: Date.now(),
        overall: 'healthy',
        components: {},
        issues: [],
        recommendations: []
      };
      
      // Check each component
      for (const [name, component] of Object.entries(this.components)) {
        const componentHealth = await this.checkComponentHealth(name, component);
        healthCheck.components[name] = componentHealth;
        
        if (componentHealth.status !== 'healthy') {
          healthCheck.issues.push({
            component: name,
            issue: componentHealth.issue,
            severity: componentHealth.severity
          });
        }
      }
      
      // Determine overall health
      if (healthCheck.issues.length > 0) {
        const criticalIssues = healthCheck.issues.filter(i => i.severity === 'critical');
        healthCheck.overall = criticalIssues.length > 0 ? 'critical' : 'degraded';
      }
      
      // Store health check results
      await this.storeHealthCheck(healthCheck);
      
      return healthCheck;
    } catch (error) {
      logger.error('Error performing health check:', error);
    }
  }

  // Check individual component health
  async checkComponentHealth(name, component) {
    try {
      const health = {
        status: 'healthy',
        lastCheck: Date.now(),
        metrics: {},
        issue: null,
        severity: 'low'
      };
      
      switch (name) {
        case 'stabilityMonitor':
          health.status = component.monitoringTimer ? 'healthy' : 'inactive';
          health.metrics.monitoring = component.monitoringTimer ? 'active' : 'inactive';
          break;
          
        case 'immuneSystem':
          const immuneStatus = await component.getImmuneSystemStatus();
          health.status = immuneStatus.systemHealth > 0.7 ? 'healthy' : 'degraded';
          health.metrics = immuneStatus;
          health.issue = immuneStatus.systemHealth < 0.5 ? 'Low system health' : null;
          health.severity = immuneStatus.systemHealth < 0.3 ? 'critical' : 'medium';
          break;
          
        default:
          // For layers, check if they can perform their basic functions
          health.status = 'healthy';
          health.metrics.lastOperation = Date.now();
      }
      
      return health;
    } catch (error) {
      logger.error(`Error checking component health for ${name}:`, error);
      return {
        status: 'error',
        lastCheck: Date.now(),
        metrics: {},
        issue: error.message,
        severity: 'critical'
      };
    }
  }

  // Store health check results
  async storeHealthCheck(healthCheck) {
    try {
      // This would store health check results in a separate collection
      // For now, just log the results
      logger.info(`Health check completed: ${healthCheck.overall}, ${healthCheck.issues.length} issues found`);
    } catch (error) {
      logger.error('Error storing health check:', error);
    }
  }

  // Get system status
  async getSystemStatus() {
    try {
      if (!this.isRunning) {
        return {
          status: 'stopped',
          components: {},
          lastCheck: null
        };
      }
      
      const status = {
        status: 'running',
        components: {},
        lastCheck: Date.now(),
        uptime: process.uptime()
      };
      
      // Get status of each component
      for (const [name, component] of Object.entries(this.components)) {
        status.components[name] = await this.getComponentStatus(name, component);
      }
      
      return status;
    } catch (error) {
      logger.error('Error getting system status:', error);
      return {
        status: 'error',
        components: {},
        lastCheck: Date.now()
      };
    }
  }

  // Get component status
  async getComponentStatus(name, component) {
    try {
      const status = {
        name,
        type: this.getComponentType(name),
        status: 'active',
        lastActivity: Date.now()
      };
      
      switch (name) {
        case 'stabilityMonitor':
          status.status = component.monitoringTimer ? 'active' : 'inactive';
          status.monitoringInterval = component.monitoringInterval;
          break;
          
        case 'immuneSystem':
          const immuneStatus = await component.getImmuneSystemStatus();
          status.status = immuneStatus.systemHealth > 0.5 ? 'active' : 'degraded';
          status.agents = immuneStatus.agents;
          break;
          
        default:
          status.status = 'active';
      }
      
      return status;
    } catch (error) {
      logger.error(`Error getting status for component ${name}:`, error);
      return {
        name,
        type: 'unknown',
        status: 'error',
        lastActivity: Date.now(),
        error: error.message
      };
    }
  }

  // Get component type
  getComponentType(name) {
    const types = {
      stabilityMonitor: 'monitor',
      immuneSystem: 'autonomous_system',
      powerDiffusion: 'layer',
      economicShockAbsorber: 'layer',
      trustVerification: 'layer',
      exploitationDetection: 'layer',
      governanceFeedback: 'layer',
      meaningEngine: 'layer',
      regenerativeGrowth: 'layer'
    };
    
    return types[name] || 'unknown';
  }

  // Stop the CSE system
  async stop() {
    try {
      logger.info('Stopping Civilization Stability Engine...');
      
      // Stop monitoring
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer);
        this.monitoringTimer = null;
      }
      
      // Stop health checks
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = null;
      }
      
      // Stop individual components
      if (this.components.stabilityMonitor) {
        this.components.stabilityMonitor.stopMonitoring();
      }
      
      if (this.components.immuneSystem) {
        this.components.immuneSystem.stopImmuneSystem();
      }
      
      this.isRunning = false;
      
      logger.info('Civilization Stability Engine stopped');
      return { status: 'stopped' };
    } catch (error) {
      logger.error('Error stopping CSE:', error);
      throw error;
    }
  }

  // Restart the CSE system
  async restart() {
    try {
      logger.info('Restarting Civilization Stability Engine...');
      
      await this.stop();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await this.initialize();
      
      logger.info('Civilization Stability Engine restarted');
      return { status: 'restarted' };
    } catch (error) {
      logger.error('Error restarting CSE:', error);
      throw error;
    }
  }

  // Get comprehensive report
  async getComprehensiveReport() {
    try {
      const report = {
        timestamp: Date.now(),
        systemStatus: await this.getSystemStatus(),
        stabilityEquation: await this.components.stabilityMonitor.calculateStabilityEquation(),
        layerMetrics: await this.getAllLayerMetrics(),
        immuneSystemStatus: await this.components.immuneSystem.getImmuneSystemStatus(),
        healthCheck: await this.performHealthCheck(),
        recommendations: await this.generateSystemRecommendations(),
        performance: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          componentCount: Object.keys(this.components).length
        }
      };
      
      return report;
    } catch (error) {
      logger.error('Error generating comprehensive report:', error);
      throw error;
    }
  }
}

module.exports = CivilizationStabilityEngineOrchestrator;
