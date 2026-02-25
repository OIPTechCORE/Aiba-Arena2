const mongoose = require('mongoose');

const civilizationStabilityEngineSchema = new mongoose.Schema({
  // Core stability metrics
  stabilityScore: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1,
    description: "Overall civilization stability index"
  },
  
  // Power Diffusion Layer metrics
  powerConcentrationIndex: {
    type: Number,
    default: 0.1,
    min: 0,
    max: 1,
    description: "How concentrated power is (0 = distributed, 1 = concentrated)"
  },
  
  governanceDiversity: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1,
    description: "Variety of governance participants"
  },
  
  authorityDecayRate: {
    type: Number,
    default: 0.05,
    min: 0,
    max: 1,
    description: "Rate at which authority naturally decays"
  },
  
  // Economic Shock Absorber metrics
  economicVolatility: {
    type: Number,
    default: 0.2,
    min: 0,
    max: 1,
    description: "Economic system volatility"
  },
  
  wealthInequalityGini: {
    type: Number,
    default: 0.3,
    min: 0,
    max: 1,
    description: "Gini coefficient for wealth distribution"
  },
  
  treasuryStabilityRatio: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 1,
    description: "Treasury health vs obligations"
  },
  
  // Trust Verification Layer metrics
  trustIndex: {
    type: Number,
    default: 0.8,
    min: 0,
    max: 1,
    description: "Overall trust in the system"
  },
  
  reputationScore: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 1,
    description: "Average reputation score"
  },
  
  fraudDetectionScore: {
    type: Number,
    default: 0.9,
    min: 0,
    max: 1,
    description: "System integrity (1 = no fraud detected)"
  },
  
  // Exploitation Detection Layer metrics
  extractionPressure: {
    type: Number,
    default: 0.1,
    min: 0,
    max: 1,
    description: "Pressure from extractive behaviors"
  },
  
  whaleDominanceRatio: {
    type: Number,
    default: 0.2,
    min: 0,
    max: 1,
    description: "Control by top 1% of users"
  },
  
  botActivityIndex: {
    type: Number,
    default: 0.05,
    min: 0,
    max: 1,
    description: "Estimated bot/inorganic activity"
  },
  
  // Governance Feedback Loop metrics
  participationRate: {
    type: Number,
    default: 0.6,
    min: 0,
    max: 1,
    description: "User participation in governance"
  },
  
  sentimentScore: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 1,
    description: "Community sentiment analysis"
  },
  
  // Meaning & Purpose Engine metrics
  purposeAlignment: {
    type: Number,
    default: 0.6,
    min: 0,
    max: 1,
    description: "Alignment with shared purpose"
  },
  
  culturalVitality: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1,
    description: "Cultural activity and rituals"
  },
  
  // Regenerative Growth Layer metrics
  decentralizationTrend: {
    type: Number,
    default: 0.1,
    min: -1,
    max: 1,
    description: "Trend in decentralization (-1 = centralizing, 1 = decentralizing)"
  },
  
  resilienceIndex: {
    type: Number,
    default: 0.7,
    min: 0,
    max: 1,
    description: "System resilience to shocks"
  },
  
  // Historical tracking
  stabilityHistory: [{
    timestamp: { type: Date, default: Date.now },
    score: Number,
    triggers: [String],
    actions: [String]
  }],
  
  // Active stabilizers
  activeStabilizers: [{
    type: String,
    enum: ['POWER_DIFFUSION', 'ECONOMIC_SHOCK_ABSORBER', 'TRUST_VERIFICATION', 
           'EXPLOITATION_DETECTION', 'GOVERNANCE_FEEDBACK', 'MEANING_ENGINE', 
           'REGENERATIVE_GROWTH', 'IMMUNE_SYSTEM'],
    activated: Date,
    effectiveness: Number,
    parameters: mongoose.Schema.Types.Mixed
  }],
  
  // Alert system
  alerts: [{
    type: {
      type: String,
      enum: ['WARNING', 'CRITICAL', 'EMERGENCY'],
      default: 'WARNING'
    },
    message: String,
    metric: String,
    value: Number,
    threshold: Number,
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    actions: [String]
  }],
  
  // Auto-correction parameters
  autoCorrectionEnabled: {
    type: Boolean,
    default: true
  },
  
  correctionThreshold: {
    type: Number,
    default: 0.3,
    min: 0,
    max: 1
  },
  
  lastCorrection: {
    timestamp: Date,
    action: String,
    effectiveness: Number
  }
}, {
  timestamps: true
});

// Indexes for performance
civilizationStabilityEngineSchema.index({ stabilityScore: 1 });
civilizationStabilityEngineSchema.index({ 'alerts.timestamp': 1 });
civilizationStabilityEngineSchema.index({ 'stabilityHistory.timestamp': 1 });

// Instance methods
civilizationStabilityEngineSchema.methods.calculateStabilityEquation = function() {
  const trust = this.trustIndex;
  const participation = this.participationRate;
  const fairness = 1 - this.wealthInequalityGini; // Fairness is inverse of inequality
  const powerConcentration = this.powerConcentrationIndex;
  const extraction = this.extractionPressure;
  
  const numerator = trust * participation * fairness;
  const denominator = powerConcentration + extraction;
  
  return denominator > 0 ? numerator / denominator : 0;
};

civilizationStabilityEngineSchema.methods.detectCollapseRisk = function() {
  const risks = [];
  
  if (this.powerConcentrationIndex > 0.7) {
    risks.push('HIGH_POWER_CONCENTRATION');
  }
  
  if (this.wealthInequalityGini > 0.6) {
    risks.push('EXTREME_WEALTH_INEQUALITY');
  }
  
  if (this.trustIndex < 0.3) {
    risks.push('TRUST_COLLAPSE');
  }
  
  if (this.participationRate < 0.2) {
    risks.push('GOVERNANCE_APATHY');
  }
  
  if (this.extractionPressure > 0.5) {
    risks.push('HIGH_EXTRACTION_PRESSURE');
  }
  
  if (this.botActivityIndex > 0.3) {
    risks.push('BOT_INFILTRATION');
  }
  
  return risks;
};

civilizationStabilityEngineSchema.methods.triggerAutoCorrection = function() {
  if (!this.autoCorrectionEnabled) return null;
  
  const risks = this.detectCollapseRisk();
  if (risks.length === 0) return null;
  
  const corrections = [];
  
  risks.forEach(risk => {
    switch (risk) {
      case 'HIGH_POWER_CONCENTRATION':
        corrections.push({
          action: 'ACTIVATE_POWER_DIFFUSION',
          parameters: {
            authorityDecayMultiplier: 2.0,
            councilRotation: true,
            citizenJuryProbability: 0.3
          }
        });
        break;
        
      case 'EXTREME_WEALTH_INEQUALITY':
        corrections.push({
          action: 'ACTIVATE_ECONOMIC_SHOCK_ABSORBER',
          parameters: {
            antiHoardingTax: 0.15,
            redistributionRate: 0.1,
            treasuryInjection: true
          }
        });
        break;
        
      case 'TRUST_COLLAPSE':
        corrections.push({
          action: 'ACTIVATE_TRUST_VERIFICATION',
          parameters: {
            reputationWeight: 2.0,
            fraudDetectionSensitivity: 0.8,
            peerValidationRequired: true
          }
        });
        break;
        
      case 'GOVERNANCE_APATHY':
        corrections.push({
          action: 'ACTIVATE_GOVERNANCE_FEEDBACK',
          parameters: {
            microGovernanceFrequency: 'weekly',
            sentimentMapping: true,
            participatoryRewards: 0.2
          }
        });
        break;
        
      case 'HIGH_EXTRACTION_PRESSURE':
        corrections.push({
          action: 'ACTIVATE_EXPLOITATION_DETECTION',
          parameters: {
            whaleMonitoring: true,
            botDetectionThreshold: 0.1,
            extractionLimits: 0.3
          }
        });
        break;
        
      case 'BOT_INFILTRATION':
        corrections.push({
          action: 'ACTIVATE_IMMUNE_SYSTEM',
          parameters: {
            autonomousAgents: true,
            preEmptiveDetection: true,
            neutralizationProtocol: 'automatic'
          }
        });
        break;
    }
  });
  
  return corrections;
};

// Static methods
civilizationStabilityEngineSchema.statics.getStabilityReport = async function() {
  const latest = await this.findOne().sort({ createdAt: -1 });
  if (!latest) return null;
  
  const stabilityScore = latest.calculateStabilityEquation();
  const risks = latest.detectCollapseRisk();
  const corrections = latest.triggerAutoCorrection();
  
  return {
    timestamp: new Date(),
    stabilityScore,
    status: stabilityScore > 0.5 ? 'STABLE' : stabilityScore > 0.3 ? 'AT_RISK' : 'CRITICAL',
    risks,
    recommendedActions: corrections,
    keyMetrics: {
      trust: latest.trustIndex,
      participation: latest.participationRate,
      fairness: 1 - latest.wealthInequalityGini,
      powerConcentration: latest.powerConcentrationIndex,
      extraction: latest.extractionPressure
    }
  };
};

module.exports = mongoose.model('CivilizationStabilityEngine', civilizationStabilityEngineSchema);
