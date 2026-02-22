/**
 * Monte Carlo Simulation Engine for Portfolio Projections
 * JavaScript version for Node.js compatibility
 * 
 * Implements Geometric Brownian Motion (GBM) for asset price simulation
 */

/**
 * Box-Muller transform for generating normally distributed random numbers
 */
function generateNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Single Monte Carlo simulation path
 */
export function simulatePath(params) {
  const path = [params.initialValue];
  let value = params.initialValue;

  for (let year = 1; year <= params.years; year++) {
    const Z = generateNormal();
    
    const drift = params.expectedReturn - (params.volatility ** 2) / 2;
    const shock = params.volatility * Z;
    const annualReturn = Math.exp(drift + shock) - 1;

    value = value * (1 + annualReturn) + params.annualContribution - params.annualWithdrawal;
    value = Math.max(0, value);

    path.push(value);
  }

  return { values: path };
}

/**
 * Run Monte Carlo simulation
 */
export function runMonteCarlo(params) {
  const startTime = performance.now();
  
  const paths = [];
  const finalValues = [];
  let successCount = 0;

  for (let i = 0; i < params.numSimulations; i++) {
    const path = simulatePath(params);
    paths.push(path);
    
    const finalValue = path.values[path.values.length - 1];
    finalValues.push(finalValue);

    if (finalValue > params.initialValue) {
      successCount++;
    }
  }

  finalValues.sort((a, b) => a - b);

  const executionTimeMs = performance.now() - startTime;

  return {
    paths,
    successRate: (successCount / params.numSimulations) * 100,
    medianFinalValue: finalValues[Math.floor(params.numSimulations / 2)],
    percentile5: finalValues[Math.floor(params.numSimulations * 0.05)],
    percentile95: finalValues[Math.floor(params.numSimulations * 0.95)],
    executionTimeMs,
  };
}

/**
 * Calculate probability of success for a specific goal
 */
export function calculateSuccessProbability(params, targetValue, numSimulations = 10000) {
  let successCount = 0;

  for (let i = 0; i < numSimulations; i++) {
    const path = simulatePath(params);
    const finalValue = path.values[path.values.length - 1];
    if (finalValue >= targetValue) {
      successCount++;
    }
  }

  return (successCount / numSimulations) * 100;
}
