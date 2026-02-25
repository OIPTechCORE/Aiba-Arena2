const CivilizationStabilityEngine = require('../models/CivilizationStabilityEngine');
const User = require('../models/User');
const logger = require('../utils/logger');

class PowerDiffusionLayer {
  constructor() {
    this.authorityDecayRate = 0.05; // 5% per day
    this.councilRotationPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.citizenJuryProbability = 0.1; // 10% chance
    this.reputationWeight = 0.3; // 30% weight for reputation in voting
  }

  // Time-decaying authority
  async decayAuthority() {
    try {
      const users = await User.find({ 'governance.authority': { $gt: 0 } });
      
      for (const user of users) {
        const decayAmount = user.governance.authority * this.authorityDecayRate;
        user.governance.authority = Math.max(0, user.governance.authority - decayAmount);
        await user.save();
      }
      
      logger.info(`Authority decayed for ${users.length} users`);
    } catch (error) {
      logger.error('Error in authority decay:', error);
    }
  }

  // Rotating governance councils
  async rotateCouncils() {
    try {
      // Get current council members
      const currentCouncil = await User.find({ 'governance.councilMember': true });
      
      // Remove some members based on performance and tenure
      const toRemove = currentCouncil
        .filter(member => {
          const tenure = Date.now() - member.governance.councilSince;
          const performance = member.governance.performanceScore || 0.5;
          return tenure > this.councilRotationPeriod && performance < 0.7;
        })
        .slice(0, Math.floor(currentCouncil.length / 3));
      
      // Remove old members
      for (const member of toRemove) {
        member.governance.councilMember = false;
        member.governance.councilSince = null;
        await member.save();
      }
      
      // Select new members based on reputation and participation
      const candidates = await User.find({ 
        'governance.councilMember': false,
        'governance.participationScore': { $gt: 0.6 }
      }).sort({ 'reputation.score': -1, 'governance.participationScore': -1 })
        .limit(toRemove.length);
      
      // Add new members
      for (const candidate of candidates) {
        candidate.governance.councilMember = true;
        candidate.governance.councilSince = Date.now();
        await candidate.save();
      }
      
      logger.info(`Council rotated: ${toRemove.length} removed, ${candidates.length} added`);
    } catch (error) {
      logger.error('Error in council rotation:', error);
    }
  }

  // Random citizen juries
  async summonCitizenJury(proposalId) {
    try {
      const jurySize = 7;
      const activeUsers = await User.find({ 
        lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
      });
      
      if (activeUsers.length < jurySize) {
        throw new Error('Not enough active users for citizen jury');
      }
      
      // Random selection weighted by reputation
      const jury = this.weightedRandomSelection(activeUsers, jurySize, 'reputation.score');
      
      // Create jury record
      const juryRecord = {
        proposalId,
        members: jury.map(j => j._id),
        summonedAt: Date.now(),
        deadline: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days to deliberate
        status: 'active'
      };
      
      // Store jury in database (would need a Jury model)
      logger.info(`Citizen jury summoned for proposal ${proposalId} with ${jury.length} members`);
      
      return juryRecord;
    } catch (error) {
      logger.error('Error summoning citizen jury:', error);
      throw error;
    }
  }

  // Reputation-weighted voting
  calculateVoteWeight(user) {
    const baseWeight = 1;
    const reputationBonus = user.reputation.score * this.reputationWeight;
    const participationBonus = (user.governance.participationScore || 0) * 0.2;
    const authorityPenalty = user.governance.authority > 0.8 ? -0.3 : 0; // Penalize excessive authority
    
    return Math.max(0.1, baseWeight + reputationBonus + participationBonus + authorityPenalty);
  }

  // Helper: Weighted random selection
  weightedRandomSelection(population, count, weightField) {
    const weights = population.map(item => item[weightField] || 0);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    const selected = [];
    const remaining = [...population];
    const remainingWeights = [...weights];
    
    for (let i = 0; i < count && remaining.length > 0; i++) {
      const random = Math.random() * remainingWeights.reduce((sum, w) => sum + w, 0);
      let accumulator = 0;
      
      for (let j = 0; j < remaining.length; j++) {
        accumulator += remainingWeights[j];
        if (accumulator >= random) {
          selected.push(remaining[j]);
          remaining.splice(j, 1);
          remainingWeights.splice(j, 1);
          break;
        }
      }
    }
    
    return selected;
  }

  // Get power concentration metrics
  async getPowerMetrics() {
    try {
      const users = await User.find({});
      
      const totalAuthority = users.reduce((sum, user) => sum + (user.governance.authority || 0), 0);
      const councilMembers = users.filter(u => u.governance.councilMember).length;
      const topHolders = users
        .sort((a, b) => (b.governance.authority || 0) - (a.governance.authority || 0))
        .slice(0, Math.floor(users.length * 0.01)); // Top 1%
        .reduce((sum, user) => sum + (user.governance.authority || 0), 0);
      
      const powerConcentrationIndex = totalAuthority > 0 ? topHolders / totalAuthority : 0;
      const governanceDiversity = 1 - (councilMembers / users.length);
      
      return {
        powerConcentrationIndex,
        governanceDiversity,
        authorityDecayRate: this.authorityDecayRate,
        councilMembers,
        totalUsers: users.length
      };
    } catch (error) {
      logger.error('Error getting power metrics:', error);
      throw error;
    }
  }
}

class EconomicShockAbsorber {
  constructor() {
    this.dynamicEmissionRate = 0.1;
    this.antiHoardingTaxRate = 0.05;
    this.activityIncomeMultiplier = 1.5;
    this.stabilizationPoolRatio = 0.2;
  }

  // Dynamic reward emissions based on economic conditions
  async adjustEmissions(economicVolatility) {
    try {
      // Increase emissions during high volatility, decrease during stability
      const volatilityMultiplier = Math.max(0.5, Math.min(2.0, 1 + economicVolatility));
      const newEmissionRate = this.dynamicEmissionRate * volatilityMultiplier;
      
      // Update emission rates in the economy config
      // This would interface with the existing economy system
      logger.info(`Emission rate adjusted to ${newEmissionRate} (volatility: ${economicVolatility})`);
      
      return newEmissionRate;
    } catch (error) {
      logger.error('Error adjusting emissions:', error);
      throw error;
    }
  }

  // Anti-hoarding tax on inactive large holders
  async applyAntiHoardingTax() {
    try {
      const users = await User.find({});
      const taxedUsers = [];
      
      for (const user of users) {
        const balance = user.balance || 0;
        const lastActive = user.lastActive || new Date(0);
        const daysInactive = (Date.now() - lastActive) / (24 * 60 * 60 * 1000);
        
        // Tax users with high balances who have been inactive for >30 days
        if (balance > 1000 && daysInactive > 30) {
          const taxAmount = balance * this.antiHoardingTaxRate;
          user.balance -= taxAmount;
          
          // Add tax to treasury/stabilization pool
          // This would interface with the treasury system
          
          await user.save();
          taxedUsers.push({
            userId: user._id,
            taxAmount,
            balance: user.balance
          });
        }
      }
      
      logger.info(`Anti-hoarding tax applied to ${taxedUsers.length} users`);
      return taxedUsers;
    } catch (error) {
      logger.error('Error applying anti-hoarding tax:', error);
      throw error;
    }
  }

  // Activity-based income distribution
  async distributeActivityIncome() {
    try {
      const activeUsers = await User.find({
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Active in last 24 hours
      });
      
      const baseIncome = 10; // Base activity income
      const totalDistribution = activeUsers.length * baseIncome * this.activityIncomeMultiplier;
      
      for (const user of activeUsers) {
        const activityScore = user.governance.participationScore || 0.5;
        const income = baseIncome * this.activityIncomeMultiplier * activityScore;
        
        user.balance += income;
        await user.save();
      }
      
      logger.info(`Activity income distributed to ${activeUsers.length} users, total: ${totalDistribution}`);
      return {
        recipients: activeUsers.length,
        totalDistribution,
        averageIncome: totalDistribution / activeUsers.length
      };
    } catch (error) {
      logger.error('Error distributing activity income:', error);
      throw error;
    }
  }

  // Treasury stabilization pool management
  async manageStabilizationPool() {
    try {
      // Get current treasury status
      // This would interface with the existing treasury system
      
      const poolTarget = 100000; // Target pool size
      const currentPool = 50000; // Current pool size (placeholder)
      
      if (currentPool < poolTarget * 0.8) {
        // Inject funds into pool
        const injectionAmount = poolTarget * 0.2;
        logger.info(`Stabilization pool injection: ${injectionAmount}`);
        
        // This would transfer funds from main treasury to stabilization pool
      } else if (currentPool > poolTarget * 1.2) {
        // Excess funds, return to main treasury
        const excessAmount = currentPool - poolTarget;
        logger.info(`Stabilization pool excess returned: ${excessAmount}`);
        
        // This would transfer excess back to main treasury
      }
      
      return {
        currentPool,
        targetPool: poolTarget,
        ratio: currentPool / poolTarget
      };
    } catch (error) {
      logger.error('Error managing stabilization pool:', error);
      throw error;
    }
  }

  // Get economic metrics
  async getEconomicMetrics() {
    try {
      const users = await User.find({});
      
      const balances = users.map(u => u.balance || 0);
      const totalBalance = balances.reduce((sum, balance) => sum + balance, 0);
      const averageBalance = totalBalance / users.length;
      
      // Calculate Gini coefficient for wealth inequality
      const sortedBalances = balances.sort((a, b) => a - b);
      let gini = 0;
      for (let i = 0; i < sortedBalances.length; i++) {
        gini += (2 * (i + 1) - sortedBalances.length - 1) * sortedBalances[i];
      }
      gini = gini / (sortedBalances.length * totalBalance);
      
      // Calculate economic volatility (simplified)
      const variance = balances.reduce((sum, balance) => {
        return sum + Math.pow(balance - averageBalance, 2);
      }, 0) / users.length;
      const volatility = Math.sqrt(variance) / averageBalance;
      
      return {
        economicVolatility: Math.min(1, volatility),
        wealthInequalityGini: Math.abs(gini),
        treasuryStabilityRatio: 0.7, // Placeholder
        totalBalance,
        averageBalance,
        userCount: users.length
      };
    } catch (error) {
      logger.error('Error getting economic metrics:', error);
      throw error;
    }
  }
}

module.exports = {
  PowerDiffusionLayer,
  EconomicShockAbsorber
};
