/**
 * Monte Carlo Simulation Engine for Portfolio Projections
 * 
 * Implements Geometric Brownian Motion (GBM) for asset price simulation:
 * dS = μS dt + σS dW
 * 
 * Where:
 * - S = asset price
 * - μ = expected return (drift)
 * - σ = volatility
 * - dW = Wiener process (random shock)
 */

export interface MonteCarloParams {
  initialValue: number;        // Starting portfolio value
  expectedReturn: number;       // Annual expected return (e.g., 0.08 for 8%)
  volatility: number;           // Annual volatility (e.g., 0.15 for 15%)
  years: number;                // Projection horizon
  annualContribution: number;   // Additional savings per year
  annualWithdrawal: number;     // Retirement spending per year
  numSimulations: number;       // Number of Monte Carlo paths (typically 10,000)
}

export interface SimulationPath {
  values: number[];             // Portfolio value at each year
}

export interface MonteCarloResults {
  paths: SimulationPath[];
  successRate: number;          // % of simulations ending above target
  medianFinalValue: number;
  percentile5: number;          // Bad luck scenario
  percentile95: number;         // Good luck scenario
  executionTimeMs: number;
}

/**
 * Box-Muller transform for generating normally distributed random numbers
 * More accurate than simple randomNormal() implementations
 */
function generateNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Single Monte Carlo simulation path
 */
export function simulatePath(params: MonteCarloParams): SimulationPath {
  const path: number[] = [params.initialValue];
  let value = params.initialValue;

  for (let year = 1; year <= params.years; year++) {
    // Generate random return using Geometric Brownian Motion
    const Z = generateNormal();
    
    // GBM formula: S(t+1) = S(t) * exp((μ - σ²/2) + σ*Z)
    const drift = params.expectedReturn - (params.volatility ** 2) / 2;
    const shock = params.volatility * Z;
    const annualReturn = Math.exp(drift + shock) - 1;

    // Update portfolio value
    value = value * (1 + annualReturn) + params.annualContribution - params.annualWithdrawal;

    // Portfolio cannot go negative (bankruptcy)
    value = Math.max(0, value);

    path.push(value);
  }

  return { values: path };
}

/**
 * Run Monte Carlo simulation (single-threaded)
 * Use this for small simulations or as reference implementation
 */
export function runMonteCarloSingleThreaded(params: MonteCarloParams): MonteCarloResults {
  const startTime = performance.now();
  
  const paths: SimulationPath[] = [];
  const finalValues: number[] = [];
  let successCount = 0;

  for (let i = 0; i < params.numSimulations; i++) {
    const path = simulatePath(params);
    paths.push(path);
    
    const finalValue = path.values[path.values.length - 1];
    finalValues.push(finalValue);

    // Define success as ending value > initial value (didn't run out of money)
    if (finalValue > params.initialValue) {
      successCount++;
    }
  }

  // Sort final values to calculate percentiles
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
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  const index = Math.floor(sortedArray.length * p);
  return sortedArray[index];
}

/**
 * Run Monte Carlo simulation (multi-threaded using Bun workers)
 * This is the production implementation
 */
export async function runMonteCarlo(params: MonteCarloParams): Promise<MonteCarloResults> {
  const startTime = performance.now();
  
  // Determine number of worker threads (use all available cores)
  const numWorkers = navigator.hardwareConcurrency || 4;
  const simulationsPerWorker = Math.floor(params.numSimulations / numWorkers);
  
  // For now, fall back to single-threaded (worker implementation in next iteration)
  // TODO: Implement Bun worker pool
  const results = runMonteCarloSingleThreaded(params);
  
  return results;
}

/**
 * Helper: Calculate probability of success for a specific goal
 */
export function calculateSuccessProbability(
  params: MonteCarloParams,
  targetValue: number,
  numSimulations: number = 10000
): number {
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
