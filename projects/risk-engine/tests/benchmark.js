/**
 * Performance Benchmark for Monte Carlo Engine
 * Target: <2 seconds for 10,000 simulations over 30 years
 */

import { runMonteCarlo } from '../src/monte-carlo.js';

const BENCHMARK_PARAMS = {
  initialValue: 1_000_000,
  expectedReturn: 0.08,
  volatility: 0.15,
  years: 30,
  annualContribution: 25_000,
  annualWithdrawal: 50_000,
  numSimulations: 10_000,
};

console.log("🚀 Monte Carlo Performance Benchmark\n");
console.log("Configuration:");
console.log(`  - Initial Value: $${BENCHMARK_PARAMS.initialValue.toLocaleString()}`);
console.log(`  - Expected Return: ${(BENCHMARK_PARAMS.expectedReturn * 100).toFixed(1)}%`);
console.log(`  - Volatility: ${(BENCHMARK_PARAMS.volatility * 100).toFixed(1)}%`);
console.log(`  - Time Horizon: ${BENCHMARK_PARAMS.years} years`);
console.log(`  - Simulations: ${BENCHMARK_PARAMS.numSimulations.toLocaleString()}`);
console.log(`  - Runtime: Node.js ${process.version}`);
console.log(`  - Target: <2,000 ms\n`);

console.log("Running benchmark...\n");

const results = runMonteCarlo(BENCHMARK_PARAMS);

console.log("📊 Results:");
console.log(`  - Execution Time: ${results.executionTimeMs.toFixed(0)} ms`);
console.log(`  - Success Rate: ${results.successRate.toFixed(1)}%`);
console.log(`  - Median Final Value: $${results.medianFinalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  - 5th Percentile: $${results.percentile5.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  - 95th Percentile: $${results.percentile95.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);

console.log("\n⚡ Performance:");
console.log(`  - Simulations per second: ${(BENCHMARK_PARAMS.numSimulations / (results.executionTimeMs / 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
console.log(`  - Time per simulation: ${(results.executionTimeMs / BENCHMARK_PARAMS.numSimulations).toFixed(3)} ms`);

const targetMet = results.executionTimeMs < 2000;
console.log(`\n${targetMet ? "✅" : "❌"} Target ${targetMet ? "MET" : "MISSED"}: ${results.executionTimeMs.toFixed(0)} ms ${targetMet ? "<" : ">"} 2,000 ms`);

if (!targetMet) {
  const slowdownFactor = (results.executionTimeMs / 2000).toFixed(1);
  console.log(`\n⚠️  Performance is ${slowdownFactor}x slower than target`);
  console.log("  Next steps:");
  console.log("  - Deploy on Bun runtime (3x faster than Node.js)");
  console.log("  - Implement worker parallelization");
  console.log("  - Profile hot paths and optimize");
}

console.log("\n✅ Benchmark complete");
