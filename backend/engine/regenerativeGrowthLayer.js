const User = require('../models/User');
const logger = require('../utils/logger');

class RegenerativeGrowthLayer {
  constructor() {
    this.decentralizationThreshold = 0.3; // Minimum decentralization score for healthy growth
    this.diversityThreshold = 0.4; // Minimum governance diversity
    this.resilienceThreshold = 0.6; // Minimum economic resilience
    this.growthQualityWeight = 0.7; // Weight of quality vs quantity in growth metrics
  }

  // Ensure new users increase decentralization
  async ensureDecentralizationGrowth(newUser) {
    try {
      const decentralizationImpact = await this.calculateDecentralizationImpact(newUser);
      const currentDecentralization = await this.getCurrentDecentralizationScore();
      
      const growthQuality = {
        newUser: newUser._id,
        decentralizationImpact,
        currentScore: currentDecentralization,
        projectedScore: currentDecentralization + decentralizationImpact,
        isPositive: decentralizationImpact > 0,
        meetsThreshold: (currentDecentralization + decentralizationImpact) >= this.decentralizationThreshold
      };
      
      if (!growthQuality.isPositive) {
        logger.warn(`New user ${newUser._id} reduces decentralization: ${decentralizationImpact.toFixed(3)}`);
        await this.applyDecentralizationCorrection(newUser, growthQuality);
      }
      
      return growthQuality;
    } catch (error) {
      logger.error('Error ensuring decentralization growth:', error);
      throw error;
    }
  }

  // Calculate decentralization impact of a new user
  async calculateDecentralizationImpact(newUser) {
    try {
      let impact = 0;
      
      // Factor 1: Geographic diversity (if available)
      if (newUser.metadata && newUser.metadata.location) {
        const existingLocations = await this.getGeographicDistribution();
        const isNewLocation = !existingLocations.includes(newUser.metadata.location);
        if (isNewLocation) {
          impact += 0.1;
        }
      }
      
      // Factor 2: Network diversity
      if (newUser.referralCode) {
        // Check if referred by existing network or new network
        const referrerNetwork = await this.getReferrerNetwork(newUser.referralCode);
        const networkDiversity = await this.calculateNetworkDiversity(referrerNetwork);
        impact += networkDiversity * 0.05;
      } else {
        // Organic user (no referral) increases diversity
        impact += 0.08;
      }
      
      // Factor 3: Skill/knowledge diversity
      if (newUser.skills && newUser.skills.length > 0) {
        const skillDiversity = await this.calculateSkillDiversity(newUser.skills);
        impact += skillDiversity * 0.07;
      }
      
      // Factor 4: Governance participation potential
      const governancePotential = this.calculateGovernancePotential(newUser);
      impact += governancePotential * 0.1;
      
      // Factor 5: Economic behavior diversity
      const economicDiversity = await this.calculateEconomicDiversity(newUser);
      impact += economicDiversity * 0.05;
      
      return impact;
    } catch (error) {
      logger.error('Error calculating decentralization impact:', error);
      return 0;
    }
  }

  // Ensure new users increase governance diversity
  async ensureGovernanceDiversityGrowth(newUser) {
    try {
      const diversityImpact = await this.calculateGovernanceDiversityImpact(newUser);
      const currentDiversity = await this.getCurrentGovernanceDiversity();
      
      const growthQuality = {
        newUser: newUser._id,
        diversityImpact,
        currentScore: currentDiversity,
        projectedScore: currentDiversity + diversityImpact,
        isPositive: diversityImpact > 0,
        meetsThreshold: (currentDiversity + diversityImpact) >= this.diversityThreshold
      };
      
      if (!growthQuality.isPositive) {
        logger.warn(`New user ${newUser._id} reduces governance diversity: ${diversityImpact.toFixed(3)}`);
        await this.applyDiversityCorrection(newUser, growthQuality);
      }
      
      return growthQuality;
    } catch (error) {
      logger.error('Error ensuring governance diversity growth:', error);
      throw error;
    }
  }

  // Calculate governance diversity impact
  async calculateGovernanceDiversityImpact(newUser) {
    try {
      let impact = 0;
      
      // Factor 1: Voting pattern diversity
      const votingDiversity = await this.predictVotingDiversity(newUser);
      impact += votingDiversity * 0.3;
      
      // Factor 2: Perspective diversity
      const perspectiveDiversity = await this.calculatePerspectiveDiversity(newUser);
      impact += perspectiveDiversity * 0.25;
      
      // Factor 3: Participation style diversity
      const participationDiversity = await this.calculateParticipationDiversity(newUser);
      impact += participationDiversity * 0.2;
      
      // Factor 4: Time zone/activity pattern diversity
      const activityDiversity = await this.calculateActivityDiversity(newUser);
      impact += activityDiversity * 0.15;
      
      // Factor 5: Background/experience diversity
      const backgroundDiversity = await this.calculateBackgroundDiversity(newUser);
      impact += backgroundDiversity * 0.1;
      
      return impact;
    } catch (error) {
      logger.error('Error calculating governance diversity impact:', error);
      return 0;
    }
  }

  // Ensure new users increase economic resilience
  async ensureEconomicResilienceGrowth(newUser) {
    try {
      const resilienceImpact = await this.calculateEconomicResilienceImpact(newUser);
      const currentResilience = await this.getCurrentEconomicResilience();
      
      const growthQuality = {
        newUser: newUser._id,
        resilienceImpact,
        currentScore: currentResilience,
        projectedScore: currentResilience + resilienceImpact,
        isPositive: resilienceImpact > 0,
        meetsThreshold: (currentResilience + resilienceImpact) >= this.resilienceThreshold
      };
      
      if (!growthQuality.isPositive) {
        logger.warn(`New user ${newUser._id} reduces economic resilience: ${resilienceImpact.toFixed(3)}`);
        await this.applyResilienceCorrection(newUser, growthQuality);
      }
      
      return growthQuality;
    } catch (error) {
      logger.error('Error ensuring economic resilience growth:', error);
      throw error;
    }
  }

  // Calculate economic resilience impact
  async calculateEconomicResilienceImpact(newUser) {
    try {
      let impact = 0;
      
      // Factor 1: Economic behavior diversity
      const behaviorDiversity = await this.calculateEconomicBehaviorDiversity(newUser);
      impact += behaviorDiversity * 0.25;
      
      // Factor 2: Risk tolerance diversity
      const riskDiversity = await this.calculateRiskToleranceDiversity(newUser);
      impact += riskDiversity * 0.2;
      
      // Factor 3: Investment pattern diversity
      const investmentDiversity = await this.calculateInvestmentDiversity(newUser);
      impact += investmentDiversity * 0.2;
      
      // Factor 4: Consumption pattern diversity
      const consumptionDiversity = await this.calculateConsumptionDiversity(newUser);
      impact += consumptionDiversity * 0.15;
      
      // Factor 5: Production/contribution diversity
      const productionDiversity = await this.calculateProductionDiversity(newUser);
      impact += productionDiversity * 0.2;
      
      return impact;
    } catch (error) {
      logger.error('Error calculating economic resilience impact:', error);
      return 0;
    }
  }

  // Apply decentralization correction
  async applyDecentralizationCorrection(newUser, growthQuality) {
    try {
      const corrections = [];
      
      if (growthQuality.decentralizationImpact < -0.05) {
        // Strong negative impact - apply multiple corrections
        corrections.push({
          type: 'ONBOARDING_REDIRECT',
          description: 'Redirect to diverse community channels',
          priority: 'high'
        });
        
        corrections.push({
          type: 'INCENTIVE_MODIFICATION',
          description: 'Modify incentives to encourage decentralizing behavior',
          priority: 'high'
        });
        
        corrections.push({
          type: 'COMMUNITY_MATCHING',
          description: 'Match user with diverse community members',
          priority: 'medium'
        });
      } else {
        // Mild negative impact - apply gentle correction
        corrections.push({
          type: 'EDUCATION_NUDGE',
          description: 'Provide education on decentralization benefits',
          priority: 'low'
        });
      }
      
      // Apply corrections
      for (const correction of corrections) {
        await this.applyCorrection(newUser, correction);
      }
      
      logger.info(`Applied ${corrections.length} decentralization corrections for user ${newUser._id}`);
    } catch (error) {
      logger.error('Error applying decentralization correction:', error);
    }
  }

  // Apply diversity correction
  async applyDiversityCorrection(newUser, growthQuality) {
    try {
      const corrections = [];
      
      if (growthQuality.diversityImpact < -0.05) {
        corrections.push({
          type: 'PERSPECTIVE_EXPOSURE',
          description: 'Expose user to diverse perspectives',
          priority: 'high'
        });
        
        corrections.push({
          type: 'GOVERNANCE_TRAINING',
          description: 'Provide governance diversity training',
          priority: 'medium'
        });
      }
      
      for (const correction of corrections) {
        await this.applyCorrection(newUser, correction);
      }
      
      logger.info(`Applied ${corrections.length} diversity corrections for user ${newUser._id}`);
    } catch (error) {
      logger.error('Error applying diversity correction:', error);
    }
  }

  // Apply resilience correction
  async applyResilienceCorrection(newUser, growthQuality) {
    try {
      const corrections = [];
      
      if (growthQuality.resilienceImpact < -0.05) {
        corrections.push({
          type: 'ECONOMIC_EDUCATION',
          description: 'Provide economic resilience education',
          priority: 'high'
        });
        
        corrections.push({
          type: 'RISK_MANAGEMENT_TRAINING',
          description: 'Teach risk management strategies',
          priority: 'medium'
        });
      }
      
      for (const correction of corrections) {
        await this.applyCorrection(newUser, correction);
      }
      
      logger.info(`Applied ${corrections.length} resilience corrections for user ${newUser._id}`);
    } catch (error) {
      logger.error('Error applying resilience correction:', error);
    }
  }

  // Apply individual correction
  async applyCorrection(newUser, correction) {
    try {
      switch (correction.type) {
        case 'ONBOARDING_REDIRECT':
          await this.redirectToDiverseChannels(newUser);
          break;
        case 'INCENTIVE_MODIFICATION':
          await this.modifyIncentives(newUser);
          break;
        case 'COMMUNITY_MATCHING':
          await this.matchWithDiverseMembers(newUser);
          break;
        case 'EDUCATION_NUDGE':
          await this.sendEducationNudge(newUser, 'decentralization');
          break;
        case 'PERSPECTIVE_EXPOSURE':
          await this.exposeToPerspectives(newUser);
          break;
        case 'GOVERNANCE_TRAINING':
          await this.provideGovernanceTraining(newUser);
          break;
        case 'ECONOMIC_EDUCATION':
          await this.provideEconomicEducation(newUser);
          break;
        case 'RISK_MANAGEMENT_TRAINING':
          await this.provideRiskTraining(newUser);
          break;
      }
    } catch (error) {
      logger.error(`Error applying correction ${correction.type}:`, error);
    }
  }

  // Calculate overall regenerative growth score
  async calculateRegenerativeGrowthScore() {
    try {
      const decentralizationScore = await this.getCurrentDecentralizationScore();
      const diversityScore = await this.getCurrentGovernanceDiversity();
      const resilienceScore = await this.getCurrentEconomicResilience();
      
      const weights = {
        decentralization: 0.4,
        diversity: 0.3,
        resilience: 0.3
      };
      
      const overallScore = 
        (decentralizationScore * weights.decentralization) +
        (diversityScore * weights.diversity) +
        (resilienceScore * weights.resilience);
      
      return {
        overall: overallScore,
        decentralization: decentralizationScore,
        diversity: diversityScore,
        resilience: resilienceScore,
        trend: await this.calculateGrowthTrend(),
        quality: await this.calculateGrowthQuality()
      };
    } catch (error) {
      logger.error('Error calculating regenerative growth score:', error);
      throw error;
    }
  }

  // Get current decentralization score
  async getCurrentDecentralizationScore() {
    try {
      const users = await User.find({});
      
      // Calculate geographic distribution
      const geographicDiversity = await this.calculateGeographicDistributionScore(users);
      
      // Calculate network distribution
      const networkDiversity = await this.calculateNetworkDistributionScore(users);
      
      // Calculate skill distribution
      const skillDiversity = await this.calculateSkillDistributionScore(users);
      
      // Calculate power distribution
      const powerDiversity = await this.calculatePowerDistributionScore(users);
      
      const weights = {
        geographic: 0.2,
        network: 0.3,
        skill: 0.25,
        power: 0.25
      };
      
      return (
        (geographicDiversity * weights.geographic) +
        (networkDiversity * weights.network) +
        (skillDiversity * weights.skill) +
        (powerDiversity * weights.power)
      );
    } catch (error) {
      logger.error('Error getting current decentralization score:', error);
      return 0.5;
    }
  }

  // Get current governance diversity
  async getCurrentGovernanceDiversity() {
    try {
      const users = await User.find({ 'governance.participationScore': { $gt: 0 } });
      
      if (users.length === 0) return 0;
      
      // Calculate voting pattern diversity
      const votingDiversity = await this.calculateVotingPatternDiversity(users);
      
      // Calculate perspective diversity
      const perspectiveDiversity = await this.calculatePerspectiveDistribution(users);
      
      // Calculate participation diversity
      const participationDiversity = await this.calculateParticipationDistribution(users);
      
      const weights = {
        voting: 0.4,
        perspective: 0.3,
        participation: 0.3
      };
      
      return (
        (votingDiversity * weights.voting) +
        (perspectiveDiversity * weights.perspective) +
        (participationDiversity * weights.participation)
      );
    } catch (error) {
      logger.error('Error getting current governance diversity:', error);
      return 0.5;
    }
  }

  // Get current economic resilience
  async getCurrentEconomicResilience() {
    try {
      const users = await User.find({});
      
      // Calculate economic diversity
      const economicDiversity = await this.calculateEconomicDiversity(users);
      
      // Calculate risk distribution
      const riskDistribution = await this.calculateRiskDistribution(users);
      
      // Calculate activity distribution
      const activityDistribution = await this.calculateActivityDistribution(users);
      
      const weights = {
        diversity: 0.4,
        risk: 0.3,
        activity: 0.3
      };
      
      return (
        (economicDiversity * weights.diversity) +
        (riskDistribution * weights.risk) +
        (activityDistribution * weights.activity)
      );
    } catch (error) {
      logger.error('Error getting current economic resilience:', error);
      return 0.5;
    }
  }

  // Calculate growth trend
  async calculateGrowthTrend() {
    try {
      // This would analyze historical data to calculate trend
      // For now, return placeholder
      return {
        direction: 'positive', // 'positive', 'negative', 'stable'
        rate: 0.02, // 2% growth per period
        quality: 0.7 // 70% quality growth
      };
    } catch (error) {
      logger.error('Error calculating growth trend:', error);
      return { direction: 'stable', rate: 0, quality: 0.5 };
    }
  }

  // Calculate growth quality
  async calculateGrowthQuality() {
    try {
      const recentUsers = await User.find({ 
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });
      
      if (recentUsers.length === 0) return 0.5;
      
      let totalQuality = 0;
      
      for (const user of recentUsers) {
        const decentralizationImpact = await this.calculateDecentralizationImpact(user);
        const diversityImpact = await this.calculateGovernanceDiversityImpact(user);
        const resilienceImpact = await this.calculateEconomicResilienceImpact(user);
        
        const userQuality = (decentralizationImpact + diversityImpact + resilienceImpact) / 3;
        totalQuality += Math.max(0, userQuality); // Only count positive contributions
      }
      
      return totalQuality / recentUsers.length;
    } catch (error) {
      logger.error('Error calculating growth quality:', error);
      return 0.5;
    }
  }

  // Helper methods (implementations would depend on specific data structures)
  async getGeographicDistribution() {
    // Placeholder implementation
    return ['US', 'UK', 'JP', 'DE', 'FR'];
  }

  async getReferrerNetwork(referralCode) {
    // Placeholder implementation
    return 'network_1';
  }

  async calculateNetworkDiversity(network) {
    // Placeholder implementation
    return 0.7;
  }

  async calculateSkillDiversity(skills) {
    // Placeholder implementation
    return skills.length / 10; // Normalize by assumed max skills
  }

  async calculateGovernancePotential(user) {
    // Placeholder implementation
    return (user.governance?.participationScore || 0) * 0.5;
  }

  async calculateEconomicDiversity(user) {
    // Placeholder implementation
    return 0.6;
  }

  async predictVotingDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.8;
  }

  async calculatePerspectiveDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.7;
  }

  async calculateParticipationDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.6;
  }

  async calculateActivityDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.5;
  }

  async calculateBackgroundDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.4;
  }

  async calculateEconomicBehaviorDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.6;
  }

  async calculateRiskToleranceDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.5;
  }

  async calculateInvestmentDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.4;
  }

  async calculateConsumptionDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.5;
  }

  async calculateProductionDiversity(user) {
    // Placeholder implementation
    return Math.random() * 0.6;
  }

  // Correction implementation methods
  async redirectToDiverseChannels(user) {
    logger.info(`Redirecting user ${user._id} to diverse channels`);
  }

  async modifyIncentives(user) {
    logger.info(`Modifying incentives for user ${user._id}`);
  }

  async matchWithDiverseMembers(user) {
    logger.info(`Matching user ${user._id} with diverse community members`);
  }

  async sendEducationNudge(user, topic) {
    logger.info(`Sending ${topic} education nudge to user ${user._id}`);
  }

  async exposeToPerspectives(user) {
    logger.info(`Exposing user ${user._id} to diverse perspectives`);
  }

  async provideGovernanceTraining(user) {
    logger.info(`Providing governance training to user ${user._id}`);
  }

  async provideEconomicEducation(user) {
    logger.info(`Providing economic education to user ${user._id}`);
  }

  async provideRiskTraining(user) {
    logger.info(`Providing risk management training to user ${user._id}`);
  }

  // Additional helper methods for score calculations
  async calculateGeographicDistributionScore(users) {
    const locations = new Set();
    users.forEach(user => {
      if (user.metadata?.location) {
        locations.add(user.metadata.location);
      }
    });
    return Math.min(1, locations.size / 20); // Normalize by assumed max locations
  }

  async calculateNetworkDistributionScore(users) {
    const networks = new Set();
    users.forEach(user => {
      if (user.referralCode) {
        networks.add(user.referralCode);
      }
    });
    return Math.min(1, networks.size / users.length);
  }

  async calculateSkillDistributionScore(users) {
    const allSkills = new Set();
    users.forEach(user => {
      if (user.skills) {
        user.skills.forEach(skill => allSkills.add(skill));
      }
    });
    return Math.min(1, allSkills.size / 50); // Normalize by assumed max skills
  }

  async calculatePowerDistributionScore(users) {
    const powerScores = users.map(u => u.governance?.authority || 0);
    const totalPower = powerScores.reduce((sum, power) => sum + power, 0);
    
    if (totalPower === 0) return 1;
    
    // Calculate Gini coefficient for power distribution
    const sortedScores = powerScores.sort((a, b) => a - b);
    let gini = 0;
    for (let i = 0; i < sortedScores.length; i++) {
      gini += (2 * (i + 1) - sortedScores.length - 1) * sortedScores[i];
    }
    gini = Math.abs(gini / (sortedScores.length * totalPower));
    
    return 1 - gini; // Invert Gini (lower inequality = higher diversity)
  }

  async calculateVotingPatternDiversity(users) {
    // Placeholder implementation
    return 0.6;
  }

  async calculatePerspectiveDistribution(users) {
    // Placeholder implementation
    return 0.7;
  }

  async calculateParticipationDistribution(users) {
    const participationScores = users.map(u => u.governance?.participationScore || 0);
    const variance = participationScores.reduce((sum, score) => {
      const mean = participationScores.reduce((s, sc) => s + sc, 0) / participationScores.length;
      return sum + Math.pow(score - mean, 2);
    }, 0) / participationScores.length;
    
    return Math.min(1, variance / 0.25); // Normalize by max expected variance
  }

  async calculateEconomicDiversity(users) {
    // Placeholder implementation
    return 0.6;
  }

  async calculateRiskDistribution(users) {
    // Placeholder implementation
    return 0.5;
  }

  async calculateActivityDistribution(users) {
    // Placeholder implementation
    return 0.7;
  }

  // Get regenerative growth metrics
  async getRegenerativeGrowthMetrics() {
    try {
      const growthScore = await this.calculateRegenerativeGrowthScore();
      
      return {
        decentralizationTrend: growthScore.trend.direction === 'positive' ? growthScore.trend.rate : -growthScore.trend.rate,
        resilienceIndex: growthScore.resilience,
        growthQuality: growthScore.quality,
        overallScore: growthScore.overall,
        componentScores: {
          decentralization: growthScore.decentralization,
          diversity: growthScore.diversity,
          resilience: growthScore.resilience
        }
      };
    } catch (error) {
      logger.error('Error getting regenerative growth metrics:', error);
      throw error;
    }
  }
}

module.exports = RegenerativeGrowthLayer;
