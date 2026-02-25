const CivilizationStabilityEngine = require('../models/CivilizationStabilityEngine');
const StabilityEquationMonitor = require('./stabilityEquationMonitor');
const logger = require('../utils/logger');

class CivilizationImmuneSystem {
  constructor() {
    this.agents = [];
    this.agentTypes = [
      'ANTIBODY_AGENT',      // Detects and neutralizes specific threats
      'MACROPHAGE_AGENT',    // Cleans up systemic issues
      'T_CELL_AGENT',        // Adaptive response to new threats
      'MEMORY_AGENT',        // Remembers past threats for faster response
      'INTERFERON_AGENT',    // Warns other parts of the system
      'COMPLEMENT_AGENT',    // Enhances other immune responses
      'NK_CELL_AGENT',       // Natural killer - detects abnormal cells
      'DENDRITE_AGENT'      // Presents threats to other agents
    ];
    this.monitoringInterval = 30000; // 30 seconds
    this.responseThreshold = 0.7; // 70% confidence required for action
    this.learningRate = 0.1; // How quickly agents learn
  }

  // Initialize the immune system
  async initialize() {
    try {
      logger.info('Initializing Civilization Immune System...');
      
      // Create initial agents
      await this.createAgents();
      
      // Start continuous monitoring
      this.startImmuneMonitoring();
      
      logger.info(`Civilization Immune System initialized with ${this.agents.length} agents`);
    } catch (error) {
      logger.error('Error initializing Civilization Immune System:', error);
      throw error;
    }
  }

  // Create autonomous agents
  async createAgents() {
    for (const agentType of this.agentTypes) {
      const agent = await this.createAgent(agentType);
      this.agents.push(agent);
    }
  }

  // Create individual agent
  async createAgent(agentType) {
    const agent = {
      id: this.generateAgentId(agentType),
      type: agentType,
      state: 'active',
      lastActivation: null,
      activationCount: 0,
      effectiveness: 0.5, // Starts at 50% effectiveness
      memory: new Map(),
      skills: this.getAgentSkills(agentType),
      specialization: this.getAgentSpecialization(agentType),
      responseTime: this.getAgentResponseTime(agentType),
      energy: 1.0, // 100% energy
      learning: {
        rate: this.learningRate,
        experiences: [],
        adaptations: []
      }
    };

    // Load agent memory if exists
    await this.loadAgentMemory(agent);

    return agent;
  }

  // Get agent skills based on type
  getAgentSkills(agentType) {
    const skills = {
      ANTIBODY_AGENT: [
        'threat_recognition',
        'targeted_neutralization',
        'precision_response',
        'minimal_collateral'
      ],
      MACROPHAGE_AGENT: [
        'system_cleanup',
        'debris_removal',
        'large_scale_neutralization',
        'tissue_repair'
      ],
      T_CELL_AGENT: [
        'adaptive_learning',
        'threat_adaptation',
        'immune_coordination',
        'memory_formation'
      ],
      MEMORY_AGENT: [
        'pattern_recognition',
        'historical_analysis',
        'rapid_response',
        'threat_prediction'
      ],
      INTERFERON_AGENT: [
        'system_warning',
        'preventive_signaling',
        'immune_activation',
        'viral_spread_prevention'
      ],
      COMPLEMENT_AGENT: [
        'response_amplification',
        'opsonization',
        'inflammation_control',
        'pathogen_marking'
      ],
      NK_CELL_AGENT: [
        'abnormality_detection',
        'stress_response',
        'rapid_elimination',
        'missing_self_detection'
      ],
      DENDRITE_AGENT: [
        'threat_presentation',
        'immune_education',
        'response_coordination',
        'antigen_processing'
      ]
    };

    return skills[agentType] || [];
  }

  // Get agent specialization
  getAgentSpecialization(agentType) {
    const specializations = {
      ANTIBODY_AGENT: {
        primary: 'specific_threats',
        secondary: 'precision_neutralization',
        targets: ['bots', 'sybil_attacks', 'fraud_patterns']
      },
      MACROPHAGE_AGENT: {
        primary: 'system_cleanup',
        secondary: 'large_scale_issues',
        targets: ['wealth_concentration', 'governance_stagnation', 'trust_erosion']
      },
      T_CELL_AGENT: {
        primary: 'adaptive_response',
        secondary: 'new_threats',
        targets: ['novel_attack_vectors', 'emerging_instabilities', 'unknown_patterns']
      },
      MEMORY_AGENT: {
        primary: 'pattern_memory',
        secondary: 'threat_prediction',
        targets: ['recurring_patterns', 'historical_threats', 'trend_prediction']
      },
      INTERFERON_AGENT: {
        primary: 'early_warning',
        secondary: 'system_preparation',
        targets: ['early_detection', 'preventive_measures', 'system_readiness']
      },
      COMPLEMENT_AGENT: {
        primary: 'response_amplification',
        secondary: 'coordination',
        targets: ['multi_agent_coordination', 'response_enhancement', 'system_synergy']
      },
      NK_CELL_AGENT: {
        primary: 'abnormality_detection',
        secondary: 'rapid_response',
        targets: ['anomalous_behavior', 'system_stress', 'malfunction_detection']
      },
      DENDRITE_AGENT: {
        primary: 'threat_analysis',
        secondary: 'immune_education',
        targets: ['threat_classification', 'response_planning', 'agent_coordination']
      }
    };

    return specializations[agentType] || {};
  }

  // Get agent response time
  getAgentResponseTime(agentType) {
    const responseTimes = {
      ANTIBODY_AGENT: 5000,      // 5 seconds
      MACROPHAGE_AGENT: 10000,   // 10 seconds
      T_CELL_AGENT: 15000,       // 15 seconds
      MEMORY_AGENT: 2000,        // 2 seconds
      INTERFERON_AGENT: 1000,    // 1 second
      COMPLEMENT_AGENT: 3000,    // 3 seconds
      NK_CELL_AGENT: 4000,       // 4 seconds
      DENDRITE_AGENT: 8000       // 8 seconds
    };

    return responseTimes[agentType] || 5000;
  }

  // Start immune monitoring
  startImmuneMonitoring() {
    logger.info('Starting Civilization Immune System monitoring...');
    
    const monitor = async () => {
      try {
        await this.performImmuneCheck();
      } catch (error) {
        logger.error('Error in immune monitoring:', error);
      }
    };
    
    // Run immediately
    monitor();
    
    // Set up interval
    this.immuneTimer = setInterval(monitor, this.monitoringInterval);
    
    logger.info(`Immune monitoring started (interval: ${this.monitoringInterval}ms)`);
  }

  // Perform comprehensive immune check
  async performImmuneCheck() {
    try {
      // Get current system state
      const systemState = await this.getSystemState();
      
      // Detect threats
      const threats = await this.detectThreats(systemState);
      
      // Analyze threats
      const threatAnalysis = await this.analyzeThreats(threats);
      
      // Coordinate agent responses
      const responses = await this.coordinateAgentResponses(threatAnalysis);
      
      // Execute responses
      const results = await this.executeResponses(responses);
      
      // Learn from experience
      await this.learnFromExperience(results);
      
      // Update agent states
      await this.updateAgentStates(results);
      
      if (threats.length > 0) {
        logger.info(`Immune check completed: ${threats.length} threats detected, ${responses.length} responses executed`);
      }
    } catch (error) {
      logger.error('Error performing immune check:', error);
    }
  }

  // Get current system state
  async getSystemState() {
    try {
      const stabilityMonitor = new StabilityEquationMonitor();
      const stabilityReport = await stabilityMonitor.getStabilityReport();
      
      return {
        stability: stabilityReport,
        timestamp: Date.now(),
        systemHealth: await this.calculateSystemHealth(stabilityReport),
        stressFactors: await this.identifyStressFactors(stabilityReport),
        anomalies: await this.detectAnomalies(stabilityReport)
      };
    } catch (error) {
      logger.error('Error getting system state:', error);
      return {
        stability: null,
        timestamp: Date.now(),
        systemHealth: 0.5,
        stressFactors: [],
        anomalies: []
      };
    }
  }

  // Detect threats using pattern recognition
  async detectThreats(systemState) {
    const threats = [];
    
    // Use MEMORY_AGENT for pattern recognition
    const memoryAgent = this.getAgent('MEMORY_AGENT');
    if (memoryAgent) {
      const patternThreats = await this.detectPatternThreats(systemState, memoryAgent);
      threats.push(...patternThreats);
    }
    
    // Use NK_CELL_AGENT for anomaly detection
    const nkAgent = this.getAgent('NK_CELL_AGENT');
    if (nkAgent) {
      const anomalyThreats = await this.detectAnomalyThreats(systemState, nkAgent);
      threats.push(...anomalyThreats);
    }
    
    // Use INTERFERON_AGENT for early warning
    const interferonAgent = this.getAgent('INTERFERON_AGENT');
    if (interferonAgent) {
      const earlyThreats = await this.detectEarlyThreats(systemState, interferonAgent);
      threats.push(...earlyThreats);
    }
    
    return threats;
  }

  // Detect pattern-based threats
  async detectPatternThreats(systemState, memoryAgent) {
    const threats = [];
    
    // Check for historical patterns
    const historicalPatterns = memoryAgent.memory.get('historical_patterns') || [];
    
    // Current instability patterns
    const currentPatterns = this.extractCurrentPatterns(systemState);
    
    // Match current patterns against historical threats
    historicalPatterns.forEach(pattern => {
      const match = this.matchPattern(currentPatterns, pattern);
      if (match.confidence > 0.7) {
        threats.push({
          id: this.generateThreatId(),
          type: 'pattern_match',
          severity: pattern.severity,
          confidence: match.confidence,
          description: `Historical threat pattern detected: ${pattern.description}`,
          pattern: pattern,
          currentMatch: match,
          detectedBy: memoryAgent.id,
          timestamp: Date.now()
        });
      }
    });
    
    return threats;
  }

  // Detect anomaly-based threats
  async detectAnomalyThreats(systemState, nkAgent) {
    const threats = [];
    
    // Check for statistical anomalies
    const anomalies = systemState.anomalies || [];
    
    anomalies.forEach(anomaly => {
      if (anomaly.severity > 0.6) {
        threats.push({
          id: this.generateThreatId(),
          type: 'anomaly',
          severity: anomaly.severity,
          confidence: anomaly.confidence,
          description: `System anomaly detected: ${anomaly.description}`,
          anomaly: anomaly,
          detectedBy: nkAgent.id,
          timestamp: Date.now()
        });
      }
    });
    
    return threats;
  }

  // Detect early warning threats
  async detectEarlyThreats(systemState, interferonAgent) {
    const threats = [];
    
    // Check for early warning indicators
    const stressFactors = systemState.stressFactors || [];
    
    stressFactors.forEach(factor => {
      if (factor.potential > 0.5 && factor.earlyWarning) {
        threats.push({
          id: this.generateThreatId(),
          type: 'early_warning',
          severity: 'low',
          confidence: factor.potential,
          description: `Early warning indicator: ${factor.description}`,
          factor: factor,
          detectedBy: interferonAgent.id,
          timestamp: Date.now()
        });
      }
    });
    
    return threats;
  }

  // Analyze threats and determine response strategy
  async analyzeThreats(threats) {
    const analysis = {
      totalThreats: threats.length,
      severityBreakdown: this.calculateSeverityBreakdown(threats),
      threatClusters: this.clusterThreats(threats),
      responseStrategy: this.determineResponseStrategy(threats),
      priorityThreats: this.prioritizeThreats(threats)
    };
    
    return analysis;
  }

  // Coordinate agent responses
  async coordinateAgentResponses(threatAnalysis) {
    const responses = [];
    
    // Get appropriate agents for each threat
    for (const threat of threatAnalysis.priorityThreats) {
      const appropriateAgents = this.getAppropriateAgents(threat);
      
      for (const agent of appropriateAgents) {
        const response = await this.planAgentResponse(agent, threat);
        if (response) {
          responses.push(response);
        }
      }
    }
    
    // Coordinate multi-agent responses
    const coordinatedResponses = await this.coordinateMultiAgentResponses(responses);
    
    return coordinatedResponses;
  }

  // Get appropriate agents for threat
  getAppropriateAgents(threat) {
    const appropriateAgents = [];
    
    // Map threat types to agent specializations
    const threatAgentMapping = {
      'pattern_match': ['MEMORY_AGENT', 'ANTIBODY_AGENT', 'T_CELL_AGENT'],
      'anomaly': ['NK_CELL_AGENT', 'MACROPHAGE_AGENT', 'COMPLEMENT_AGENT'],
      'early_warning': ['INTERFERON_AGENT', 'DENDRITE_AGENT', 'MEMORY_AGENT'],
      'systemic': ['MACROPHAGE_AGENT', 'COMPLEMENT_AGENT', 'T_CELL_AGENT'],
      'targeted': ['ANTIBODY_AGENT', 'NK_CELL_AGENT', 'MEMORY_AGENT']
    };
    
    const agentTypes = threatAgentMapping[threat.type] || ['T_CELL_AGENT'];
    
    agentTypes.forEach(agentType => {
      const agent = this.getAgent(agentType);
      if (agent && agent.energy > 0.3) { // Agent must have sufficient energy
        appropriateAgents.push(agent);
      }
    });
    
    return appropriateAgents;
  }

  // Plan agent response
  async planAgentResponse(agent, threat) {
    const response = {
      id: this.generateResponseId(),
      agentId: agent.id,
      threatId: threat.id,
      type: this.determineResponseType(agent, threat),
      strategy: this.determineResponseStrategy(agent, threat),
      estimatedEffectiveness: this.calculateResponseEffectiveness(agent, threat),
      estimatedDuration: this.calculateResponseDuration(agent, threat),
      energyCost: this.calculateEnergyCost(agent, threat),
      collateralRisk: this.calculateCollateralRisk(agent, threat),
      plannedAt: Date.now()
    };
    
    return response;
  }

  // Execute responses
  async executeResponses(responses) {
    const results = [];
    
    for (const response of responses) {
      try {
        const result = await this.executeResponse(response);
        results.push(result);
        
        // Update agent energy
        const agent = this.getAgentById(response.agentId);
        if (agent) {
          agent.energy = Math.max(0, agent.energy - response.energyCost);
          agent.lastActivation = Date.now();
          agent.activationCount++;
        }
      } catch (error) {
        logger.error(`Error executing response ${response.id}:`, error);
        results.push({
          responseId: response.id,
          success: false,
          error: error.message,
          executedAt: Date.now()
        });
      }
    }
    
    return results;
  }

  // Execute individual response
  async executeResponse(response) {
    const agent = this.getAgentById(response.agentId);
    if (!agent) {
      throw new Error(`Agent ${response.agentId} not found`);
    }
    
    logger.info(`Executing response ${response.type} by agent ${agent.type}`);
    
    // Simulate response execution based on agent type
    const result = await this.simulateResponseExecution(agent, response);
    
    return {
      responseId: response.id,
      agentId: agent.id,
      success: result.success,
      effectiveness: result.effectiveness,
      duration: result.duration,
      actualEnergyCost: result.energyCost,
      collateralEffects: result.collateralEffects,
      threatNeutralized: result.threatNeutralized,
      executedAt: Date.now()
    };
  }

  // Simulate response execution
  async simulateResponseExecution(agent, response) {
    // Base effectiveness on agent's current effectiveness and response planning
    const baseEffectiveness = agent.effectiveness * response.estimatedEffectiveness;
    
    // Add some randomness for realistic simulation
    const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const actualEffectiveness = Math.min(1, baseEffectiveness * randomFactor);
    
    // Determine success based on effectiveness
    const success = actualEffectiveness > 0.5;
    
    // Calculate actual duration and energy cost
    const actualDuration = response.estimatedDuration * (0.8 + Math.random() * 0.4);
    const actualEnergyCost = response.energyCost * (0.9 + Math.random() * 0.2);
    
    // Determine collateral effects
    const collateralEffects = this.calculateCollateralEffects(agent, response, actualEffectiveness);
    
    // Determine if threat was neutralized
    const threatNeutralized = success && actualEffectiveness > 0.7;
    
    return {
      success,
      effectiveness: actualEffectiveness,
      duration: actualDuration,
      energyCost: actualEnergyCost,
      collateralEffects,
      threatNeutralized
    };
  }

  // Learn from experience
  async learnFromExperience(results) {
    for (const result of results) {
      if (result.success) {
        const agent = this.getAgentById(result.agentId);
        if (agent) {
          // Update agent effectiveness based on results
          const learningFactor = agent.learning.rate;
          const performanceImprovement = (result.effectiveness - agent.effectiveness) * learningFactor;
          agent.effectiveness = Math.max(0.1, Math.min(1, agent.effectiveness + performanceImprovement));
          
          // Store experience in memory
          agent.learning.experiences.push({
            responseId: result.responseId,
            effectiveness: result.effectiveness,
            success: result.success,
            timestamp: result.executedAt,
            collateralEffects: result.collateralEffects
          });
          
          // Adapt to new patterns
          await this.adaptToNewPatterns(agent, result);
        }
      }
    }
  }

  // Adapt to new patterns
  async adaptToNewPatterns(agent, result) {
    // Store successful response patterns in memory
    if (result.effectiveness > 0.8) {
      const patternKey = `successful_pattern_${agent.type}`;
      const existingPatterns = agent.memory.get(patternKey) || [];
      
      existingPatterns.push({
        effectiveness: result.effectiveness,
        timestamp: result.executedAt,
        context: result.context || {}
      });
      
      // Keep only recent patterns
      if (existingPatterns.length > 50) {
        existingPatterns.shift();
      }
      
      agent.memory.set(patternKey, existingPatterns);
    }
  }

  // Update agent states
  async updateAgentStates(results) {
    for (const agent of this.agents) {
      // Recover energy over time
      agent.energy = Math.min(1, agent.energy + 0.01);
      
      // Update effectiveness based on recent performance
      const recentResults = results.filter(r => r.agentId === agent.id);
      if (recentResults.length > 0) {
        const avgEffectiveness = recentResults.reduce((sum, r) => sum + r.effectiveness, 0) / recentResults.length;
        agent.effectiveness = agent.effectiveness * 0.9 + avgEffectiveness * 0.1; // Weighted average
      }
    }
  }

  // Helper methods
  generateAgentId(agentType) {
    return `${agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateThreatId() {
    return `THREAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateResponseId() {
    return `RESPONSE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getAgent(agentType) {
    return this.agents.find(agent => agent.type === agentType && agent.state === 'active');
  }

  getAgentById(agentId) {
    return this.agents.find(agent => agent.id === agentId);
  }

  async loadAgentMemory(agent) {
    // Load agent memory from database (placeholder implementation)
    agent.memory.set('historical_patterns', []);
    agent.memory.set('response_patterns', []);
  }

  async calculateSystemHealth(stabilityReport) {
    if (!stabilityReport) return 0.5;
    
    const score = stabilityReport.executiveSummary.stabilityScore;
    const trend = stabilityReport.executiveSummary.trend;
    const criticalIssues = stabilityReport.executiveSummary.criticalIssues;
    
    let health = score;
    
    // Adjust for trend
    if (trend === 'improving') health += 0.1;
    if (trend === 'declining') health -= 0.1;
    
    // Adjust for critical issues
    health -= criticalIssues * 0.1;
    
    return Math.max(0, Math.min(1, health));
  }

  async identifyStressFactors(stabilityReport) {
    // Placeholder implementation
    return [
      { name: 'economic_volatility', potential: 0.3, earlyWarning: true },
      { name: 'participation_decline', potential: 0.4, earlyWarning: true },
      { name: 'trust_erosion', potential: 0.2, earlyWarning: false }
    ];
  }

  async detectAnomalies(stabilityReport) {
    // Placeholder implementation
    return [
      { name: 'unusual_activity_pattern', severity: 0.6, confidence: 0.7 },
      { name: 'statistical_outlier', severity: 0.4, confidence: 0.8 }
    ];
  }

  extractCurrentPatterns(systemState) {
    // Extract patterns from current system state
    return {
      stabilityScore: systemState.stability?.executiveSummary?.stabilityScore || 0.5,
      trend: systemState.stability?.executiveSummary?.trend || 'stable',
      alerts: systemState.stability?.alerts || []
    };
  }

  matchPattern(currentPatterns, historicalPattern) {
    // Simple pattern matching (would be more sophisticated in production)
    const score = Math.random(); // Placeholder
    return { confidence: score, match: score > 0.5 };
  }

  calculateSeverityBreakdown(threats) {
    const breakdown = { low: 0, medium: 0, high: 0, critical: 0 };
    threats.forEach(threat => {
      breakdown[threat.severity] = (breakdown[threat.severity] || 0) + 1;
    });
    return breakdown;
  }

  clusterThreats(threats) {
    // Simple clustering by type and severity
    const clusters = {};
    threats.forEach(threat => {
      const key = `${threat.type}_${threat.severity}`;
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(threat);
    });
    return clusters;
  }

  determineResponseStrategy(threats) {
    const highSeverityThreats = threats.filter(t => t.severity === 'high' || t.severity === 'critical');
    return highSeverityThreats.length > 0 ? 'aggressive' : 'balanced';
  }

  prioritizeThreats(threats) {
    return threats.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity] || b.confidence - a.confidence;
    });
  }

  coordinateMultiAgentResponses(responses) {
    // Coordinate responses to avoid conflicts and maximize synergy
    return responses; // Placeholder - would implement coordination logic
  }

  determineResponseType(agent, threat) {
    const responseTypes = {
      ANTIBODY_AGENT: 'targeted_neutralization',
      MACROPHAGE_AGENT: 'system_cleanup',
      T_CELL_AGENT: 'adaptive_response',
      MEMORY_AGENT: 'pattern_based_response',
      INTERFERON_AGENT: 'early_warning',
      COMPLEMENT_AGENT: 'response_amplification',
      NK_CELL_AGENT: 'rapid_elimination',
      DENDRITE_AGENT: 'threat_analysis'
    };
    
    return responseTypes[agent.type] || 'general_response';
  }

  determineResponseStrategy(agent, threat) {
    return threat.severity === 'critical' ? 'aggressive' : 'measured';
  }

  calculateResponseEffectiveness(agent, threat) {
    const baseEffectiveness = agent.effectiveness;
    const specializationBonus = agent.specialization.targets.includes(threat.type) ? 0.2 : 0;
    return Math.min(1, baseEffectiveness + specializationBonus);
  }

  calculateResponseDuration(agent, threat) {
    return agent.responseTime * (threat.severity === 'critical' ? 1.5 : 1);
  }

  calculateEnergyCost(agent, threat) {
    const baseCost = 0.1;
    const severityMultiplier = threat.severity === 'critical' ? 2 : threat.severity === 'high' ? 1.5 : 1;
    return baseCost * severityMultiplier;
  }

  calculateCollateralRisk(agent, threat) {
    const baseRisk = 0.05;
    const precisionBonus = agent.type === 'ANTIBODY_AGENT' ? -0.03 : 0;
    return Math.max(0, baseRisk + precisionBonus);
  }

  calculateCollateralEffects(agent, response, effectiveness) {
    return {
      systemImpact: effectiveness * 0.1,
      userImpact: response.collateralRisk,
      economicImpact: effectiveness * 0.05
    };
  }

  // Get immune system status
  async getImmuneSystemStatus() {
    return {
      activeAgents: this.agents.filter(a => a.state === 'active').length,
      totalAgents: this.agents.length,
      averageEffectiveness: this.agents.reduce((sum, a) => sum + a.effectiveness, 0) / this.agents.length,
      averageEnergy: this.agents.reduce((sum, a) => sum + a.energy, 0) / this.agents.length,
      recentActivations: this.agents.filter(a => a.lastActivation && (Date.now() - a.lastActivation) < 3600000).length, // Last hour
      systemHealth: await this.calculateSystemHealth(null)
    };
  }

  // Stop immune system
  stopImmuneSystem() {
    if (this.immuneTimer) {
      clearInterval(this.immuneTimer);
      this.immuneTimer = null;
      logger.info('Civilization Immune System stopped');
    }
  }
}

module.exports = CivilizationImmuneSystem;
