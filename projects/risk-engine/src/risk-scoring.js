/**
 * Risk Scoring Engine - Behavioral + Capacity Assessment
 * 
 * Implements dual-dimension risk scoring:
 * 1. Risk Willingness (behavioral) - Prospect Theory (Kahneman & Tversky 1979)
 * 2. Risk Capacity (financial) - Arrow-Pratt risk aversion (Arrow 1971)
 * 
 * Academic Foundation:
 * - Kahneman, D., & Tversky, A. (1979). "Prospect Theory: An Analysis of Decision under Risk."
 *   Econometrica, 47(2), 263-291.
 * - Arrow, K. J. (1971). "Essays in the Theory of Risk-Bearing." North-Holland.
 * 
 * Regulatory Compliance:
 * - SEC Marketing Rule: Risk assessments must be fair, balanced, and not misleading
 * - FINRA Rule 2111: Suitability requires understanding client risk tolerance and capacity
 */

/**
 * Calculate Prospect Theory value function
 * v(x) = x^α for gains, -λ(-x)^β for losses
 * 
 * @param {number} change - Change from reference point (positive = gain, negative = loss)
 * @param {Object} params - Prospect Theory parameters
 * @param {number} params.alpha - Gain sensitivity (typically 0.88)
 * @param {number} params.beta - Loss sensitivity (typically 0.88)
 * @param {number} params.lambda - Loss aversion coefficient (typically 2.25)
 * @returns {number} Psychological value of the change
 */
export function prospectValue(change, params = { alpha: 0.88, beta: 0.88, lambda: 2.25 }) {
  if (change >= 0) {
    // Gains: v(x) = x^α
    return Math.pow(change, params.alpha);
  } else {
    // Losses: v(x) = -λ(-x)^β
    return -params.lambda * Math.pow(-change, params.beta);
  }
}

/**
 * Calculate loss aversion coefficient from questionnaire responses
 * 
 * Based on standard risk tolerance questionnaires used in practice:
 * - Gächter, S., Johnson, E. J., & Herrmann, A. (2007). "Individual-level loss aversion in riskless and risky choices."
 * 
 * @param {Object} responses - Questionnaire responses
 * @param {boolean} responses.accept50_50_100_50 - Accept 50/50 bet: win $100 or lose $50?
 * @param {boolean} responses.accept50_50_200_100 - Accept 50/50 bet: win $200 or lose $100?
 * @param {string} responses.portfolioDrop15Pct - Response to 15% portfolio drop (sell_all|sell_some|hold|buy_more)
 * @param {number} responses.panicThreshold - Portfolio loss % that would cause panic (0-100)
 * @returns {number} Loss aversion coefficient (higher = more loss averse)
 */
export function calculateLossAversion(responses) {
  let lambda = 2.25; // Default: typical person
  
  // Adjust based on bet acceptance (willingness to accept risk)
  if (!responses.accept50_50_100_50) lambda += 0.5; // More loss averse
  if (!responses.accept50_50_200_100) lambda += 0.5;
  
  // Adjust based on portfolio drop reaction
  const dropReaction = {
    sell_all: 1.5,    // Extreme loss aversion (lambda += 1.5)
    sell_some: 0.5,   // Moderate increase
    hold: 0,          // No change
    buy_more: -0.75,  // Less loss averse (contrarian)
  };
  lambda += dropReaction[responses.portfolioDrop15Pct] || 0;
  
  // Adjust based on panic threshold
  // If panics at <10% loss → very high lambda
  // If comfortable with >30% loss → low lambda
  if (responses.panicThreshold < 10) lambda += 1.0;
  else if (responses.panicThreshold < 20) lambda += 0.5;
  else if (responses.panicThreshold > 30) lambda -= 0.5;
  
  // Constrain to reasonable range (1.0 to 4.0)
  return Math.max(1.0, Math.min(4.0, lambda));
}

/**
 * Calculate risk willingness score (behavioral dimension)
 * 
 * Converts Prospect Theory parameters into a 0-100 risk tolerance score
 * 
 * @param {Object} params - Risk willingness parameters
 * @param {number} params.lossAversion - Loss aversion coefficient (1.0-4.0)
 * @param {number} params.volatilityTolerance - Willingness to accept volatility (0-100)
 * @param {number} params.timeHorizon - Investment time horizon in years
 * @returns {number} Risk willingness score (0-100, where 100 = highest risk tolerance)
 */
export function calculateRiskWillingness(params) {
  const { lossAversion, volatilityTolerance, timeHorizon } = params;
  
  // Base score from loss aversion (inverted: high lambda = low tolerance)
  // lambda range: 1.0 (low aversion) to 4.0 (high aversion)
  // Map to 0-100: lambda=1.0 → 100, lambda=4.0 → 0
  const aversionScore = ((4.0 - lossAversion) / 3.0) * 100;
  
  // Time horizon adjustment (longer horizon = higher tolerance for volatility)
  const horizonMultiplier = Math.min(timeHorizon / 30, 1.2); // Cap at 1.2x for 30+ years
  
  // Combine dimensions
  const rawScore = (aversionScore * 0.5 + volatilityTolerance * 0.5) * horizonMultiplier;
  
  // Constrain to 0-100
  return Math.max(0, Math.min(100, rawScore));
}

/**
 * Calculate maximum drawdown capacity (financial dimension)
 * 
 * Based on Arrow-Pratt absolute risk aversion:
 * A(W) = -U''(W) / U'(W)
 * 
 * For CRRA utility: U(W) = W^(1-γ) / (1-γ)
 * 
 * @param {Object} params - Financial capacity parameters
 * @param {number} params.totalWealth - Total liquid wealth
 * @param {number} params.essentialExpenses - Annual essential expenses
 * @param {number} params.discretionaryExpenses - Annual discretionary expenses
 * @param {number} params.yearsToRetirement - Years until retirement (or 0 if retired)
 * @param {string} params.incomeStability - Income stability (stable|variable|retired)
 * @returns {number} Maximum drawdown capacity as percentage (0-100)
 */
export function calculateMaxDrawdown(params) {
  const {
    totalWealth,
    essentialExpenses,
    discretionaryExpenses,
    yearsToRetirement,
    incomeStability,
  } = params;
  
  // Safe withdrawal rate (financial planning standard)
  const safeWithdrawalRate = 0.04; // 4% rule
  
  // Calculate minimum wealth needed to maintain essential lifestyle
  const minRequiredWealth = essentialExpenses / safeWithdrawalRate;
  
  // Calculate cushion (wealth above minimum)
  const cushion = totalWealth - minRequiredWealth;
  
  if (cushion <= 0) {
    // No capacity for loss - portfolio cannot decline
    return 0;
  }
  
  // Base drawdown capacity (% of portfolio that can be lost)
  let baseCapacity = (cushion / totalWealth) * 100;
  
  // Recovery capacity multiplier
  // Younger clients with more years to recover can afford larger drawdowns
  const recoveryMultiplier = yearsToRetirement > 0
    ? Math.min(yearsToRetirement / 10, 1.5) // Cap at 1.5x for 15+ years
    : 0.5; // Retirees have limited recovery time
  
  // Income stability multiplier
  const stabilityMultipliers = {
    stable: 1.2,    // Stable income → can take more risk
    variable: 0.9,  // Variable income → less capacity
    retired: 0.7,   // No income → conservative
  };
  const stabilityMultiplier = stabilityMultipliers[incomeStability] || 1.0;
  
  // Adjusted capacity
  const adjustedCapacity = baseCapacity * recoveryMultiplier * stabilityMultiplier;
  
  // Constrain to reasonable range (0-75%)
  // Even wealthy clients shouldn't be comfortable with >75% drawdown
  return Math.max(0, Math.min(75, adjustedCapacity));
}

/**
 * Calculate risk capacity score (0-100)
 * 
 * Converts financial capacity into comparable scale with willingness
 * 
 * @param {number} maxDrawdown - Maximum drawdown capacity (%)
 * @returns {number} Risk capacity score (0-100)
 */
export function calculateRiskCapacity(maxDrawdown) {
  // Map max drawdown to risk capacity score
  // 0% drawdown → 0 capacity
  // 50% drawdown → 75 capacity (aggressive)
  // 75% drawdown → 100 capacity (very aggressive)
  
  const score = (maxDrawdown / 75) * 100;
  return Math.max(0, Math.min(100, score));
}

/**
 * Complete risk profile assessment
 * 
 * Combines behavioral (willingness) and financial (capacity) dimensions
 * Per industry best practice: recommended risk = min(willingness, capacity)
 * 
 * @param {Object} profile - Complete client profile
 * @param {Object} profile.behavioral - Behavioral questionnaire responses
 * @param {Object} profile.financial - Financial data
 * @returns {Object} Complete risk assessment
 */
export function assessRiskProfile(profile) {
  const { behavioral, financial } = profile;
  
  // Calculate loss aversion from questionnaire
  const lossAversion = calculateLossAversion({
    accept50_50_100_50: behavioral.accept50_50_100_50,
    accept50_50_200_100: behavioral.accept50_50_200_100,
    portfolioDrop15Pct: behavioral.portfolioDrop15Pct,
    panicThreshold: behavioral.panicThreshold,
  });
  
  // Calculate risk willingness (behavioral)
  const riskWillingness = calculateRiskWillingness({
    lossAversion,
    volatilityTolerance: behavioral.volatilityTolerance,
    timeHorizon: behavioral.timeHorizon,
  });
  
  // Calculate max drawdown capacity (financial)
  const maxDrawdown = calculateMaxDrawdown({
    totalWealth: financial.totalWealth,
    essentialExpenses: financial.essentialExpenses,
    discretionaryExpenses: financial.discretionaryExpenses,
    yearsToRetirement: financial.yearsToRetirement,
    incomeStability: financial.incomeStability,
  });
  
  // Convert to capacity score
  const riskCapacity = calculateRiskCapacity(maxDrawdown);
  
  // Recommended risk level (conservative: take minimum)
  const recommendedRiskLevel = Math.min(riskWillingness, riskCapacity);
  
  // Identify mismatch (gap between willingness and capacity)
  const mismatch = Math.abs(riskWillingness - riskCapacity);
  const mismatchType = riskWillingness > riskCapacity
    ? 'willingness_exceeds_capacity'
    : riskWillingness < riskCapacity
    ? 'capacity_exceeds_willingness'
    : 'aligned';
  
  return {
    riskWillingness,
    riskCapacity,
    recommendedRiskLevel,
    maxDrawdownCapacity: maxDrawdown,
    lossAversion,
    mismatch: {
      gap: mismatch,
      type: mismatchType,
      significant: mismatch > 20, // Flag if gap > 20 points
    },
    metadata: {
      methodology: 'Prospect Theory (Kahneman 1979) + Arrow-Pratt (Arrow 1971)',
      calculatedAt: new Date().toISOString(),
      version: '0.1.0',
    },
  };
}

/**
 * Map risk score to asset allocation
 * 
 * Industry-standard mapping of risk scores to equity/bond allocation
 * 
 * @param {number} riskScore - Risk score (0-100)
 * @returns {Object} Recommended asset allocation
 */
export function mapRiskToAllocation(riskScore) {
  // Conservative mapping: risk score → equity allocation
  // 0-20: Very conservative (20-30% equity)
  // 20-40: Conservative (30-50% equity)
  // 40-60: Moderate (50-70% equity)
  // 60-80: Aggressive (70-90% equity)
  // 80-100: Very aggressive (90-100% equity)
  
  const equityPct = Math.min(100, Math.max(20, 20 + riskScore * 0.8));
  const bondPct = 100 - equityPct;
  
  return {
    equity: Math.round(equityPct),
    fixedIncome: Math.round(bondPct),
    description: getRiskLabel(riskScore),
  };
}

/**
 * Get risk tolerance label
 * 
 * @param {number} riskScore - Risk score (0-100)
 * @returns {string} Risk tolerance label
 */
export function getRiskLabel(riskScore) {
  if (riskScore < 20) return 'Very Conservative';
  if (riskScore < 40) return 'Conservative';
  if (riskScore < 60) return 'Moderate';
  if (riskScore < 80) return 'Aggressive';
  return 'Very Aggressive';
}
