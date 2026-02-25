const User = require('../models/User');
const logger = require('../utils/logger');

class TrustVerificationLayer {
  constructor() {
    this.behaviorWeight = 0.4;
    this.contributionWeight = 0.3;
    this.peerValidationWeight = 0.3;
    this.fraudDetectionThreshold = 0.7;
    this.reputationDecayRate = 0.02; // 2% per day
  }

  // Update reputation scores based on behavior
  async updateReputationScores() {
    try {
      const users = await User.find({});
      
      for (const user of users) {
        const behaviorScore = await this.calculateBehaviorScore(user);
        const contributionScore = await this.calculateContributionScore(user);
        const peerValidationScore = await this.calculatePeerValidationScore(user);
        
        // Calculate weighted reputation score
        const newReputationScore = 
          (behaviorScore * this.behaviorWeight) +
          (contributionScore * this.contributionWeight) +
          (peerValidationScore * this.peerValidationWeight);
        
        // Apply reputation decay
        const decayedScore = Math.max(0, newReputationScore - (user.reputation.score * this.reputationDecayRate));
        
        user.reputation.score = Math.min(1, decayedScore);
        user.reputation.lastUpdated = Date.now();
        
        await user.save();
      }
      
      logger.info(`Reputation scores updated for ${users.length} users`);
    } catch (error) {
      logger.error('Error updating reputation scores:', error);
    }
  }

  // Calculate behavior score based on user actions
  async calculateBehaviorScore(user) {
    try {
      let score = 0.5; // Base score
      
      // Positive behaviors
      if (user.governance.participationScore > 0.7) score += 0.2;
      if (user.lastActive && (Date.now() - user.lastActive) < 7 * 24 * 60 * 60 * 1000) score += 0.1; // Active in last 7 days
      if (user.battles && user.battles.wins > user.battles.losses) score += 0.1;
      if (user.referrals && user.referrals.length > 0) score += 0.05;
      
      // Negative behaviors
      if (user.suspiciousActivity && user.suspiciousActivity.length > 0) score -= 0.3;
      if (user.reports && user.reports.received > user.reports.given) score -= 0.1;
      if (user.balance && user.balance > 100000 && !user.governance.councilMember) score -= 0.1; // Large holder without governance participation
      
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      logger.error('Error calculating behavior score:', error);
      return 0.5;
    }
  }

  // Calculate contribution score based on user contributions
  async calculateContributionScore(user) {
    try {
      let score = 0.5; // Base score
      
      // University contributions
      if (user.university && user.university.modulesCompleted > 0) {
        score += Math.min(0.2, user.university.modulesCompleted * 0.02);
      }
      
      // Battle participation
      if (user.battles && user.battles.total > 0) {
        score += Math.min(0.15, user.battles.total * 0.01);
      }
      
      // Marketplace activity
      if (user.marketplace && user.marketplace.transactions > 0) {
        score += Math.min(0.1, user.marketplace.transactions * 0.02);
      }
      
      // Community contributions
      if (user.community && user.community.contributions > 0) {
        score += Math.min(0.15, user.community.contributions * 0.03);
      }
      
      // Mentorship
      if (user.mentorship && user.mentorship.mentees > 0) {
        score += Math.min(0.1, user.mentorship.mentees * 0.02);
      }
      
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      logger.error('Error calculating contribution score:', error);
      return 0.5;
    }
  }

  // Calculate peer validation score
  async calculatePeerValidationScore(user) {
    try {
      let score = 0.5; // Base score
      
      // Get peer validations (would need a PeerValidation model)
      const validations = await this.getPeerValidations(user._id);
      const totalValidations = validations.length;
      
      if (totalValidations > 0) {
        const positiveValidations = validations.filter(v => v.type === 'positive').length;
        const negativeValidations = validations.filter(v => v.type === 'negative').length;
        
        score = (positiveValidations - negativeValidations) / totalValidations;
        score = (score + 1) / 2; // Normalize to 0-1
      }
      
      // Weight by validator reputation
      if (totalValidations > 0) {
        const weightedScore = validations.reduce((sum, validation) => {
          const validatorWeight = validation.validatorReputation || 0.5;
          const validationValue = validation.type === 'positive' ? 1 : 0;
          return sum + (validationValue * validatorWeight);
        }, 0) / validations.reduce((sum, validation) => sum + (validation.validatorReputation || 0.5), 0);
        
        score = weightedScore;
      }
      
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      logger.error('Error calculating peer validation score:', error);
      return 0.5;
    }
  }

  // Get peer validations for a user
  async getPeerValidations(userId) {
    // This would query a PeerValidation model
    // For now, return empty array as placeholder
    return [];
  }

  // Fraud detection AI
  async detectFraud(user) {
    try {
      const fraudSignals = [];
      let fraudScore = 0;
      
      // Signal 1: Unusual activity patterns
      if (await this.detectUnusualActivityPattern(user)) {
        fraudSignals.push('UNUSUAL_ACTIVITY_PATTERN');
        fraudScore += 0.3;
      }
      
      // Signal 2: Rapid wealth accumulation
      if (await this.detectRapidWealthAccumulation(user)) {
        fraudSignals.push('RAPID_WEALTH_ACCUMULATION');
        fraudScore += 0.4;
      }
      
      // Signal 3: Bot-like behavior
      if (await this.detectBotLikeBehavior(user)) {
        fraudSignals.push('BOT_LIKE_BEHAVIOR');
        fraudScore += 0.5;
      }
      
      // Signal 4: Sybil attack patterns
      if (await this.detectSybilPatterns(user)) {
        fraudSignals.push('SYBIL_PATTERNS');
        fraudScore += 0.6;
      }
      
      // Signal 5: Exploitative behavior
      if (await this.detectExploitativeBehavior(user)) {
        fraudSignals.push('EXPLOITATIVE_BEHAVIOR');
        fraudScore += 0.4;
      }
      
      return {
        fraudScore: Math.min(1, fraudScore),
        fraudSignals,
        isFraudulent: fraudScore > this.fraudDetectionThreshold
      };
    } catch (error) {
      logger.error('Error detecting fraud:', error);
      return { fraudScore: 0, fraudSignals: [], isFraudulent: false };
    }
  }

  // Detect unusual activity patterns
  async detectUnusualActivityPattern(user) {
    try {
      // Check for 24/7 activity (impossible for humans)
      const activityPattern = user.activityPattern || [];
      if (activityPattern.length === 0) return false;
      
      const hourlyActivity = new Array(24).fill(0);
      activityPattern.forEach(timestamp => {
        const hour = new Date(timestamp).getHours();
        hourlyActivity[hour]++;
      });
      
      // If activity is evenly distributed across all 24 hours, likely bot
      const variance = this.calculateVariance(hourlyActivity);
      const mean = hourlyActivity.reduce((sum, val) => sum + val, 0) / 24;
      const coefficientOfVariation = Math.sqrt(variance) / mean;
      
      return coefficientOfVariation < 0.3; // Low variation = suspicious
    } catch (error) {
      logger.error('Error detecting unusual activity pattern:', error);
      return false;
    }
  }

  // Detect rapid wealth accumulation
  async detectRapidWealthAccumulation(user) {
    try {
      const balanceHistory = user.balanceHistory || [];
      if (balanceHistory.length < 7) return false; // Need at least 7 days of data
      
      // Calculate growth rate over last 7 days
      const recentBalances = balanceHistory.slice(-7);
      const initialBalance = recentBalances[0].balance;
      const finalBalance = recentBalances[recentBalances.length - 1].balance;
      
      if (initialBalance === 0) return false;
      
      const growthRate = (finalBalance - initialBalance) / initialBalance;
      const dailyGrowthRate = Math.pow(1 + growthRate, 1/7) - 1;
      
      // If daily growth rate > 50%, suspicious
      return dailyGrowthRate > 0.5;
    } catch (error) {
      logger.error('Error detecting rapid wealth accumulation:', error);
      return false;
    }
  }

  // Detect bot-like behavior
  async detectBotLikeBehavior(user) {
    try {
      const signals = [];
      
      // Signal 1: Consistent timing between actions
      if (user.actionTiming && user.actionTiming.length > 10) {
        const intervals = [];
        for (let i = 1; i < user.actionTiming.length; i++) {
          intervals.push(user.actionTiming[i] - user.actionTiming[i - 1]);
        }
        
        const variance = this.calculateVariance(intervals);
        const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        
        if (coefficientOfVariation < 0.1) signals.push('CONSISTENT_TIMING');
      }
      
      // Signal 2: Identical action patterns
      if (user.actionPatterns && user.actionPatterns.length > 5) {
        const patternVariety = new Set(user.actionPatterns).size;
        if (patternVariety < 3) signals.push('IDENTICAL_PATTERNS');
      }
      
      // Signal 3: No natural breaks (eating, sleeping)
      if (user.activityPattern && user.activityPattern.length > 100) {
        const hasNaturalBreaks = this.hasNaturalBreaks(user.activityPattern);
        if (!hasNaturalBreaks) signals.push('NO_NATURAL_BREAKS');
      }
      
      return signals.length >= 2;
    } catch (error) {
      logger.error('Error detecting bot-like behavior:', error);
      return false;
    }
  }

  // Detect sybil attack patterns
  async detectSybilPatterns(user) {
    try {
      // Check for multiple accounts from same IP/device
      const sameIPAccounts = await User.find({ 
        'metadata.ip': user.metadata?.ip,
        _id: { $ne: user._id }
      });
      
      if (sameIPAccounts.length > 2) return true;
      
      // Check for similar creation times
      const sameTimeAccounts = await User.find({
        createdAt: {
          $gte: new Date(user.createdAt.getTime() - 60000), // Within 1 minute
          $lte: new Date(user.createdAt.getTime() + 60000)
        },
        _id: { $ne: user._id }
      });
      
      if (sameTimeAccounts.length > 1) return true;
      
      // Check for similar behavior patterns
      const similarBehaviorAccounts = await User.find({
        'behaviorPattern.signature': user.behaviorPattern?.signature,
        _id: { $ne: user._id }
      });
      
      return similarBehaviorAccounts.length > 1;
    } catch (error) {
      logger.error('Error detecting sybil patterns:', error);
      return false;
    }
  }

  // Detect exploitative behavior
  async detectExploitativeBehavior(user) {
    try {
      const signals = [];
      
      // Signal 1: Excessive farming without contribution
      if (user.balance > 10000 && user.governance.participationScore < 0.1) {
        signals.push('FARMING_WITHOUT_CONTRIBUTION');
      }
      
      // Signal 2: Manipulative voting patterns
      if (user.governance.votingPattern && user.governance.votingPattern.length > 10) {
        const voteVariety = new Set(user.governance.votingPattern.map(v => v.choice)).size;
        if (voteVariety === 1) signals.push('MANIPULATIVE_VOTING');
      }
      
      // Signal 3: Exploiting new users
      if (user.referrals && user.referrals.length > 10) {
        const activeReferrals = user.referrals.filter(r => 
          r.activated && (Date.now() - r.activated) < 7 * 24 * 60 * 60 * 1000
        );
        if (activeReferrals.length > 5) signals.push('EXPLOITING_NEW_USERS');
      }
      
      return signals.length >= 2;
    } catch (error) {
      logger.error('Error detecting exploitative behavior:', error);
      return false;
    }
  }

  // Helper: Calculate variance
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  // Helper: Check for natural breaks in activity
  hasNaturalBreaks(activityPattern) {
    // Check for 6+ hour gaps (sleep/eating)
    for (let i = 1; i < activityPattern.length; i++) {
      const gap = activityPattern[i] - activityPattern[i - 1];
      if (gap > 6 * 60 * 60 * 1000) return true; // 6+ hour gap
    }
    return false;
  }

  // Get trust metrics
  async getTrustMetrics() {
    try {
      const users = await User.find({});
      
      const reputationScores = users.map(u => u.reputation?.score || 0.5);
      const averageReputation = reputationScores.reduce((sum, score) => sum + score, 0) / users.length;
      
      // Detect fraud for all users
      let totalFraudScore = 0;
      let fraudulentUsers = 0;
      
      for (const user of users) {
        const fraudDetection = await this.detectFraud(user);
        totalFraudScore += fraudDetection.fraudScore;
        if (fraudDetection.isFraudulent) fraudulentUsers++;
      }
      
      const averageFraudScore = totalFraudScore / users.length;
      const fraudDetectionScore = 1 - averageFraudScore; // Higher is better
      
      return {
        trustIndex: averageReputation,
        reputationScore: averageReputation,
        fraudDetectionScore,
        fraudulentUsers,
        totalUsers: users.length
      };
    } catch (error) {
      logger.error('Error getting trust metrics:', error);
      throw error;
    }
  }
}

module.exports = TrustVerificationLayer;
