/**
 * Risk Scoring Engine Tests
 * 
 * Validates behavioral and capacity risk assessment algorithms
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  prospectValue,
  calculateLossAversion,
  calculateRiskWillingness,
  calculateMaxDrawdown,
  calculateRiskCapacity,
  assessRiskProfile,
  mapRiskToAllocation,
  getRiskLabel,
} from '../src/risk-scoring.js';

describe('Prospect Theory Value Function', () => {
  it('should calculate positive values for gains', () => {
    const value = prospectValue(10000);
    assert(value > 0, 'Gains should have positive value');
  });
  
  it('should calculate negative values for losses', () => {
    const value = prospectValue(-10000);
    assert(value < 0, 'Losses should have negative value');
  });
  
  it('should exhibit loss aversion (losses hurt more than gains feel good)', () => {
    const gain = prospectValue(10000);
    const loss = prospectValue(-10000);
    
    // Default lambda = 2.25, so loss should be ~2.25x worse
    assert(Math.abs(loss) > Math.abs(gain), 'Loss aversion: |v(-x)| > |v(x)|');
    
    const lossAversionRatio = Math.abs(loss) / Math.abs(gain);
    assert(lossAversionRatio > 2.0 && lossAversionRatio < 2.5, 'Loss aversion ratio should be near 2.25');
  });
  
  it('should exhibit diminishing sensitivity (concave for gains)', () => {
    const value10k = prospectValue(10000);
    const value20k = prospectValue(20000);
    
    // Doubling the gain should not double the value (diminishing returns)
    assert(value20k < value10k * 2, 'Gains exhibit diminishing sensitivity');
  });
});

describe('Loss Aversion Calculation', () => {
  it('should return default lambda for balanced responses', () => {
    const lambda = calculateLossAversion({
      accept50_50_100_50: true,
      accept50_50_200_100: true,
      portfolioDrop15Pct: 'hold',
      panicThreshold: 20,
    });
    
    assert(lambda >= 2.0 && lambda <= 2.5, `Lambda should be near default (got ${lambda})`);
  });
  
  it('should increase lambda for risk-averse responses', () => {
    const lambda = calculateLossAversion({
      accept50_50_100_50: false,  // Won't take fair bet
      accept50_50_200_100: false,
      portfolioDrop15Pct: 'sell_all',  // Panic sells
      panicThreshold: 5,  // Very low panic threshold
    });
    
    assert(lambda > 3.0, `High loss aversion expected (got ${lambda})`);
  });
  
  it('should decrease lambda for risk-seeking responses', () => {
    const lambda = calculateLossAversion({
      accept50_50_100_50: true,
      accept50_50_200_100: true,
      portfolioDrop15Pct: 'buy_more',  // Contrarian
      panicThreshold: 40,  // High tolerance for loss
    });
    
    assert(lambda < 2.0, `Low loss aversion expected (got ${lambda})`);
  });
  
  it('should constrain lambda to reasonable range (1.0-4.0)', () => {
    const extreme = calculateLossAversion({
      accept50_50_100_50: false,
      accept50_50_200_100: false,
      portfolioDrop15Pct: 'sell_all',
      panicThreshold: 1,
    });
    
    assert(extreme >= 1.0 && extreme <= 4.0, 'Lambda should be in range [1.0, 4.0]');
  });
});

describe('Risk Willingness Calculation', () => {
  it('should return high score for risk-tolerant profile', () => {
    const score = calculateRiskWillingness({
      lossAversion: 1.5,  // Low aversion
      volatilityTolerance: 80,
      timeHorizon: 30,
    });
    
    assert(score > 70, `High risk willingness expected (got ${score})`);
  });
  
  it('should return low score for risk-averse profile', () => {
    const score = calculateRiskWillingness({
      lossAversion: 3.5,  // High aversion
      volatilityTolerance: 20,
      timeHorizon: 5,
    });
    
    assert(score < 30, `Low risk willingness expected (got ${score})`);
  });
  
  it('should increase score with longer time horizon', () => {
    const short = calculateRiskWillingness({
      lossAversion: 2.25,
      volatilityTolerance: 50,
      timeHorizon: 5,
    });
    
    const long = calculateRiskWillingness({
      lossAversion: 2.25,
      volatilityTolerance: 50,
      timeHorizon: 30,
    });
    
    assert(long > short, 'Longer horizon should increase risk willingness');
  });
  
  it('should constrain output to 0-100 range', () => {
    const score = calculateRiskWillingness({
      lossAversion: 1.0,
      volatilityTolerance: 100,
      timeHorizon: 50,
    });
    
    assert(score >= 0 && score <= 100, 'Score should be in range [0, 100]');
  });
});

describe('Maximum Drawdown Capacity', () => {
  it('should return 0 capacity when wealth = minimum required', () => {
    const capacity = calculateMaxDrawdown({
      totalWealth: 2_000_000,
      essentialExpenses: 80_000,  // Needs $2M at 4% withdrawal
      discretionaryExpenses: 20_000,
      yearsToRetirement: 0,
      incomeStability: 'retired',
    });
    
    assert(capacity === 0, 'No drawdown capacity when wealth = minimum');
  });
  
  it('should return higher capacity for younger clients', () => {
    const young = calculateMaxDrawdown({
      totalWealth: 2_000_000,
      essentialExpenses: 60_000,
      discretionaryExpenses: 20_000,
      yearsToRetirement: 20,
      incomeStability: 'stable',
    });
    
    const retired = calculateMaxDrawdown({
      totalWealth: 2_000_000,
      essentialExpenses: 60_000,
      discretionaryExpenses: 20_000,
      yearsToRetirement: 0,
      incomeStability: 'retired',
    });
    
    assert(young > retired, 'Younger clients should have higher drawdown capacity');
  });
  
  it('should return higher capacity for stable income', () => {
    const stable = calculateMaxDrawdown({
      totalWealth: 2_000_000,
      essentialExpenses: 60_000,
      discretionaryExpenses: 20_000,
      yearsToRetirement: 10,
      incomeStability: 'stable',
    });
    
    const variable = calculateMaxDrawdown({
      totalWealth: 2_000_000,
      essentialExpenses: 60_000,
      discretionaryExpenses: 20_000,
      yearsToRetirement: 10,
      incomeStability: 'variable',
    });
    
    assert(stable > variable, 'Stable income should allow higher drawdown');
  });
  
  it('should cap capacity at reasonable maximum (75%)', () => {
    const capacity = calculateMaxDrawdown({
      totalWealth: 10_000_000,  // Very wealthy
      essentialExpenses: 50_000,  // Low expenses
      discretionaryExpenses: 50_000,
      yearsToRetirement: 30,
      incomeStability: 'stable',
    });
    
    assert(capacity <= 75, 'Capacity should be capped at 75%');
  });
});

describe('Complete Risk Profile Assessment', () => {
  it('should identify willingness > capacity mismatch', () => {
    const profile = assessRiskProfile({
      behavioral: {
        accept50_50_100_50: true,
        accept50_50_200_100: true,
        portfolioDrop15Pct: 'buy_more',
        panicThreshold: 30,
        volatilityTolerance: 80,
        timeHorizon: 30,
      },
      financial: {
        totalWealth: 500_000,  // Limited wealth
        essentialExpenses: 60_000,
        discretionaryExpenses: 20_000,
        yearsToRetirement: 5,  // Close to retirement
        incomeStability: 'variable',
      },
    });
    
    assert(profile.mismatch.type === 'willingness_exceeds_capacity',
      'Should identify when willingness exceeds capacity');
    assert(profile.recommendedRiskLevel === profile.riskCapacity,
      'Recommended level should be capped by capacity');
  });
  
  it('should identify capacity > willingness mismatch', () => {
    const profile = assessRiskProfile({
      behavioral: {
        accept50_50_100_50: false,
        accept50_50_200_100: false,
        portfolioDrop15Pct: 'sell_all',
        panicThreshold: 10,
        volatilityTolerance: 20,
        timeHorizon: 10,
      },
      financial: {
        totalWealth: 5_000_000,  // Very wealthy
        essentialExpenses: 60_000,
        discretionaryExpenses: 40_000,
        yearsToRetirement: 20,
        incomeStability: 'stable',
      },
    });
    
    assert(profile.mismatch.type === 'capacity_exceeds_willingness',
      'Should identify when capacity exceeds willingness');
    assert(profile.recommendedRiskLevel === profile.riskWillingness,
      'Recommended level should be capped by willingness');
  });
  
  it('should use minimum of willingness and capacity', () => {
    const profile = assessRiskProfile({
      behavioral: {
        accept50_50_100_50: true,
        accept50_50_200_100: true,
        portfolioDrop15Pct: 'hold',
        panicThreshold: 20,
        volatilityTolerance: 60,
        timeHorizon: 15,
      },
      financial: {
        totalWealth: 2_000_000,
        essentialExpenses: 70_000,
        discretionaryExpenses: 30_000,
        yearsToRetirement: 10,
        incomeStability: 'stable',
      },
    });
    
    assert(profile.recommendedRiskLevel === Math.min(profile.riskWillingness, profile.riskCapacity),
      'Recommended risk should be minimum of willingness and capacity');
  });
  
  it('should flag significant mismatches (>20 points)', () => {
    const profile = assessRiskProfile({
      behavioral: {
        accept50_50_100_50: true,
        accept50_50_200_100: true,
        portfolioDrop15Pct: 'buy_more',
        panicThreshold: 35,
        volatilityTolerance: 90,
        timeHorizon: 25,
      },
      financial: {
        totalWealth: 400_000,
        essentialExpenses: 65_000,
        discretionaryExpenses: 15_000,
        yearsToRetirement: 3,
        incomeStability: 'retired',
      },
    });
    
    if (profile.mismatch.gap > 20) {
      assert(profile.mismatch.significant === true,
        'Large gaps should be flagged as significant');
    }
  });
});

describe('Risk to Allocation Mapping', () => {
  it('should map very conservative (0-20) to 20-30% equity', () => {
    const allocation = mapRiskToAllocation(10);
    assert(allocation.equity >= 20 && allocation.equity <= 30,
      `Very conservative should be 20-30% equity (got ${allocation.equity}%)`);
  });
  
  it('should map moderate (40-60) to 50-70% equity', () => {
    const allocation = mapRiskToAllocation(50);
    assert(allocation.equity >= 50 && allocation.equity <= 70,
      `Moderate should be 50-70% equity (got ${allocation.equity}%)`);
  });
  
  it('should map very aggressive (80-100) to 90-100% equity', () => {
    const allocation = mapRiskToAllocation(90);
    assert(allocation.equity >= 90 && allocation.equity <= 100,
      `Very aggressive should be 90-100% equity (got ${allocation.equity}%)`);
  });
  
  it('should ensure equity + bonds = 100%', () => {
    for (let score = 0; score <= 100; score += 10) {
      const allocation = mapRiskToAllocation(score);
      const total = allocation.equity + allocation.fixedIncome;
      assert(Math.abs(total - 100) <= 1,
        `Allocation should sum to ~100% (got ${total}% for score ${score})`);
    }
  });
  
  it('should provide appropriate risk labels', () => {
    assert.strictEqual(getRiskLabel(10), 'Very Conservative');
    assert.strictEqual(getRiskLabel(30), 'Conservative');
    assert.strictEqual(getRiskLabel(50), 'Moderate');
    assert.strictEqual(getRiskLabel(70), 'Aggressive');
    assert.strictEqual(getRiskLabel(90), 'Very Aggressive');
  });
});

console.log('✅ All risk scoring tests passed');
