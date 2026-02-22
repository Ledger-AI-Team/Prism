/**
 * Risk Scoring Demo: Real-world client scenarios
 * 
 * Shows how behavioral + capacity assessment works for different client types
 */

import {
  assessRiskProfile,
  mapRiskToAllocation,
  prospectValue,
} from './src/risk-scoring.js';

console.log('🎯 Risk Assessment Demo\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Scenario 1: Young, aggressive investor with limited wealth
console.log('SCENARIO 1: Sarah - Young Professional');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Profile:');
console.log('  Age 32, tech employee, $250K portfolio');
console.log('  High risk tolerance (buys dips, comfortable with volatility)');
console.log('  But: Limited wealth + variable income = lower capacity\n');

const sarah = assessRiskProfile({
  behavioral: {
    accept50_50_100_50: true,
    accept50_50_200_100: true,
    portfolioDrop15Pct: 'buy_more',  // Contrarian
    panicThreshold: 35,
    volatilityTolerance: 85,
    timeHorizon: 30,
  },
  financial: {
    totalWealth: 250_000,
    essentialExpenses: 50_000,
    discretionaryExpenses: 20_000,
    yearsToRetirement: 30,
    incomeStability: 'variable',  // Tech job = variable comp
  },
});

console.log('Results:');
console.log(`  Risk Willingness (behavioral): ${sarah.riskWillingness.toFixed(1)}`);
console.log(`  Risk Capacity (financial): ${sarah.riskCapacity.toFixed(1)}`);
console.log(`  Recommended Risk Level: ${sarah.recommendedRiskLevel.toFixed(1)}`);
console.log(`  Loss Aversion Coefficient: ${sarah.lossAversion.toFixed(2)}`);
console.log(`  Max Drawdown Capacity: ${sarah.maxDrawdownCapacity.toFixed(1)}%\n`);

console.log('Mismatch Analysis:');
console.log(`  Type: ${sarah.mismatch.type}`);
console.log(`  Gap: ${sarah.mismatch.gap.toFixed(1)} points`);
console.log(`  Significant: ${sarah.mismatch.significant ? 'YES ⚠️' : 'No'}\n`);

if (sarah.mismatch.type === 'willingness_exceeds_capacity') {
  console.log('⚠️  ADVISOR ACTION REQUIRED:');
  console.log('  Sarah wants aggressive portfolio but lacks financial capacity.');
  console.log('  Conversation: "You have the mindset for risk, but your financial');
  console.log('  situation limits how much loss you can actually absorb. Let\'s');
  console.log('  focus on building wealth first, then increase equity allocation."\n');
}

const sarahAllocation = mapRiskToAllocation(sarah.recommendedRiskLevel);
console.log('Recommended Allocation:');
console.log(`  ${sarahAllocation.equity}% Equity / ${sarahAllocation.fixedIncome}% Fixed Income`);
console.log(`  Risk Label: ${sarahAllocation.description}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Scenario 2: Risk-averse retiree with high capacity
console.log('SCENARIO 2: Robert & Linda - Affluent Retirees');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Profile:');
console.log('  Ages 68/66, retired executives, $4M portfolio');
console.log('  Conservative mindset (panic-sold in 2008, traumatized)');
console.log('  But: High wealth + low expenses = high financial capacity\n');

const robert = assessRiskProfile({
  behavioral: {
    accept50_50_100_50: false,
    accept50_50_200_100: false,
    portfolioDrop15Pct: 'sell_some',
    panicThreshold: 12,  // Very low
    volatilityTolerance: 25,
    timeHorizon: 20,  // Life expectancy
  },
  financial: {
    totalWealth: 4_000_000,
    essentialExpenses: 80_000,
    discretionaryExpenses: 60_000,
    yearsToRetirement: 0,
    incomeStability: 'retired',
  },
});

console.log('Results:');
console.log(`  Risk Willingness (behavioral): ${robert.riskWillingness.toFixed(1)}`);
console.log(`  Risk Capacity (financial): ${robert.riskCapacity.toFixed(1)}`);
console.log(`  Recommended Risk Level: ${robert.recommendedRiskLevel.toFixed(1)}`);
console.log(`  Loss Aversion Coefficient: ${robert.lossAversion.toFixed(2)}`);
console.log(`  Max Drawdown Capacity: ${robert.maxDrawdownCapacity.toFixed(1)}%\n`);

console.log('Mismatch Analysis:');
console.log(`  Type: ${robert.mismatch.type}`);
console.log(`  Gap: ${robert.mismatch.gap.toFixed(1)} points`);
console.log(`  Significant: ${robert.mismatch.significant ? 'YES ⚠️' : 'No'}\n`);

if (robert.mismatch.type === 'capacity_exceeds_willingness') {
  console.log('💡 OPPORTUNITY:');
  console.log('  Robert/Linda could take more risk financially, but psychology holds them back.');
  console.log('  Advisor strategy: Behavioral coaching + gradual equity increase.');
  console.log('  Consider: "You can afford a 30% portfolio drop and still meet all goals.');
  console.log('  Let\'s start at 40% equity (your comfort zone) and revisit quarterly."\n');
}

const robertAllocation = mapRiskToAllocation(robert.recommendedRiskLevel);
console.log('Recommended Allocation:');
console.log(`  ${robertAllocation.equity}% Equity / ${robertAllocation.fixedIncome}% Fixed Income`);
console.log(`  Risk Label: ${robertAllocation.description}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Scenario 3: Aligned profile (willingness ≈ capacity)
console.log('SCENARIO 3: Jennifer - Balanced Professional');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Profile:');
console.log('  Age 45, attorney, $1.5M portfolio');
console.log('  Moderate risk tolerance, stable income, 20 years to retirement\n');

const jennifer = assessRiskProfile({
  behavioral: {
    accept50_50_100_50: true,
    accept50_50_200_100: false,
    portfolioDrop15Pct: 'hold',
    panicThreshold: 22,
    volatilityTolerance: 55,
    timeHorizon: 20,
  },
  financial: {
    totalWealth: 1_500_000,
    essentialExpenses: 70_000,
    discretionaryExpenses: 40_000,
    yearsToRetirement: 20,
    incomeStability: 'stable',
  },
});

console.log('Results:');
console.log(`  Risk Willingness (behavioral): ${jennifer.riskWillingness.toFixed(1)}`);
console.log(`  Risk Capacity (financial): ${jennifer.riskCapacity.toFixed(1)}`);
console.log(`  Recommended Risk Level: ${jennifer.recommendedRiskLevel.toFixed(1)}`);
console.log(`  Loss Aversion Coefficient: ${jennifer.lossAversion.toFixed(2)}`);
console.log(`  Max Drawdown Capacity: ${jennifer.maxDrawdownCapacity.toFixed(1)}%\n`);

console.log('Mismatch Analysis:');
console.log(`  Type: ${jennifer.mismatch.type}`);
console.log(`  Gap: ${jennifer.mismatch.gap.toFixed(1)} points`);
console.log(`  Significant: ${jennifer.mismatch.significant ? 'YES ⚠️' : 'No'}\n`);

if (jennifer.mismatch.type === 'aligned') {
  console.log('✅ WELL-ALIGNED PROFILE:');
  console.log('  Jennifer\'s psychology and finances match.');
  console.log('  Recommendation: Proceed with confidence.\n');
}

const jenniferAllocation = mapRiskToAllocation(jennifer.recommendedRiskLevel);
console.log('Recommended Allocation:');
console.log(`  ${jenniferAllocation.equity}% Equity / ${jenniferAllocation.fixedIncome}% Fixed Income`);
console.log(`  Risk Label: ${jenniferAllocation.description}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Prospect Theory visualization
console.log('PROSPECT THEORY: Loss Aversion Visualization');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('How clients psychologically value gains vs. losses:\n');

const amounts = [-50000, -25000, -10000, 0, 10000, 25000, 50000];
console.log('Portfolio Change    →  Psychological Value');
console.log('─────────────────────────────────────────────');

for (const amount of amounts) {
  const value = prospectValue(amount);
  const normalized = value / 1000; // Scale for display
  const label = amount >= 0 
    ? `+$${Math.abs(amount).toLocaleString()}`
    : `-$${Math.abs(amount).toLocaleString()}`;
  
  console.log(`${label.padStart(15)}  →  ${normalized.toFixed(0).padStart(6)}`);
}

console.log('\n💡 Key Insight: Notice how -$50K feels much worse than +$50K feels good.');
console.log('   This is loss aversion (λ=2.25): losses hurt ~2.25x more than equivalent gains.\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('✅ Demo complete\n');

console.log('Key Takeaways:');
console.log('  • Willingness ≠ Capacity: Many clients have mismatched profiles');
console.log('  • Always use minimum: Protects clients from taking inappropriate risk');
console.log('  • Behavioral coaching opportunity: When capacity > willingness');
console.log('  • SEC-compliant: Academic foundations (Kahneman 1979, Arrow 1971)');
console.log('  • Audit-ready: Every score has transparent calculation + rationale');
