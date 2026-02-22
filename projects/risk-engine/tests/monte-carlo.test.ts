import { describe, expect, test } from "bun:test";
import {
  simulatePath,
  runMonteCarloSingleThreaded,
  calculateSuccessProbability,
  type MonteCarloParams,
} from "../src/monte-carlo";

describe("Monte Carlo Engine", () => {
  const basicParams: MonteCarloParams = {
    initialValue: 1_000_000,
    expectedReturn: 0.08,
    volatility: 0.15,
    years: 30,
    annualContribution: 0,
    annualWithdrawal: 50_000,
    numSimulations: 1000, // Use smaller number for tests (speed)
  };

  test("simulatePath generates correct length", () => {
    const path = simulatePath(basicParams);
    // Should have initialValue + 30 years = 31 values
    expect(path.values.length).toBe(31);
  });

  test("simulatePath starts at initial value", () => {
    const path = simulatePath(basicParams);
    expect(path.values[0]).toBe(basicParams.initialValue);
  });

  test("portfolio cannot go negative", () => {
    // Extreme scenario: withdraw more than portfolio value
    const extremeParams: MonteCarloParams = {
      ...basicParams,
      initialValue: 100_000,
      annualWithdrawal: 200_000, // Withdraw 2x portfolio value
      years: 5,
    };
    
    const path = simulatePath(extremeParams);
    
    // All values should be >= 0
    for (const value of path.values) {
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  test("runMonteCarloSingleThreaded returns all required fields", () => {
    const results = runMonteCarloSingleThreaded(basicParams);
    
    expect(results.paths.length).toBe(basicParams.numSimulations);
    expect(results.successRate).toBeGreaterThanOrEqual(0);
    expect(results.successRate).toBeLessThanOrEqual(100);
    expect(results.medianFinalValue).toBeGreaterThan(0);
    expect(results.percentile5).toBeGreaterThan(0);
    expect(results.percentile95).toBeGreaterThan(0);
    expect(results.executionTimeMs).toBeGreaterThan(0);
  });

  test("percentiles are ordered correctly", () => {
    const results = runMonteCarloSingleThreaded(basicParams);
    
    // 5th percentile < median < 95th percentile
    expect(results.percentile5).toBeLessThan(results.medianFinalValue);
    expect(results.medianFinalValue).toBeLessThan(results.percentile95);
  });

  test("zero volatility produces deterministic results", () => {
    const deterministicParams: MonteCarloParams = {
      initialValue: 1_000_000,
      expectedReturn: 0.08,
      volatility: 0, // No randomness
      years: 10,
      annualContribution: 0,
      annualWithdrawal: 0,
      numSimulations: 100,
    };
    
    const results = runMonteCarloSingleThreaded(deterministicParams);
    
    // With zero volatility, all paths should be identical
    // So 5th, median, and 95th percentile should be very close
    const spread = results.percentile95 - results.percentile5;
    const medianValue = results.medianFinalValue;
    
    // Spread should be < 1% of median (allowing for floating point errors)
    expect(spread / medianValue).toBeLessThan(0.01);
  });

  test("higher volatility increases spread", () => {
    const lowVolParams: MonteCarloParams = {
      ...basicParams,
      volatility: 0.05,
      numSimulations: 1000,
    };
    
    const highVolParams: MonteCarloParams = {
      ...basicParams,
      volatility: 0.25,
      numSimulations: 1000,
    };
    
    const lowVolResults = runMonteCarloSingleThreaded(lowVolParams);
    const highVolResults = runMonteCarloSingleThreaded(highVolParams);
    
    const lowVolSpread = lowVolResults.percentile95 - lowVolResults.percentile5;
    const highVolSpread = highVolResults.percentile95 - highVolResults.percentile5;
    
    // High volatility should produce wider spread
    expect(highVolSpread).toBeGreaterThan(lowVolSpread);
  });

  test("annual contributions increase final value", () => {
    const noContributionParams: MonteCarloParams = {
      ...basicParams,
      annualContribution: 0,
      annualWithdrawal: 0,
      numSimulations: 1000,
    };
    
    const withContributionParams: MonteCarloParams = {
      ...basicParams,
      annualContribution: 25_000,
      annualWithdrawal: 0,
      numSimulations: 1000,
    };
    
    const noContResults = runMonteCarloSingleThreaded(noContributionParams);
    const withContResults = runMonteCarloSingleThreaded(withContributionParams);
    
    // Median with contributions should be higher
    expect(withContResults.medianFinalValue).toBeGreaterThan(noContResults.medianFinalValue);
  });

  test("calculateSuccessProbability returns valid percentage", () => {
    const probability = calculateSuccessProbability(
      basicParams,
      2_000_000, // Target: double initial value
      1000
    );
    
    expect(probability).toBeGreaterThanOrEqual(0);
    expect(probability).toBeLessThanOrEqual(100);
  });

  test("easy goal has high success probability", () => {
    const easyTarget = basicParams.initialValue * 0.5; // Half initial value
    const probability = calculateSuccessProbability(basicParams, easyTarget, 1000);
    
    // With reasonable returns, should almost always beat 50% of starting value
    expect(probability).toBeGreaterThan(90);
  });

  test("impossible goal has low success probability", () => {
    const impossibleParams: MonteCarloParams = {
      initialValue: 100_000,
      expectedReturn: 0.03, // Low return
      volatility: 0.10,
      years: 10,
      annualContribution: 0,
      annualWithdrawal: 20_000, // Draining portfolio
      numSimulations: 1000,
    };
    
    const impossibleTarget = 500_000; // 5x starting value while withdrawing
    const probability = calculateSuccessProbability(impossibleParams, impossibleTarget, 1000);
    
    // Should have very low probability
    expect(probability).toBeLessThan(10);
  });
});
