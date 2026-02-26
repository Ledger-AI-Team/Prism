/**
 * Backtest API Routes
 * 
 * POST /api/v1/backtest/portfolio - Run portfolio backtest
 * POST /api/v1/backtest/compare - Compare multiple allocations
 */

import express from 'express';
import backtestService from '../services/backtest-service.js';

const router = express.Router();

/**
 * POST /api/v1/backtest/portfolio
 * Run backtest for a single allocation
 * 
 * Body:
 * {
 *   allocation: { stocks: 60, bonds: 30, alternatives: 5, cash: 5 },
 *   initialCapital: 100000,
 *   startDate: '1999-01-01',
 *   endDate: '2026-02-25',
 *   rebalanceFrequency: 'monthly'
 * }
 */
router.post('/portfolio', async (req, res) => {
  try {
    const {
      allocation,
      initialCapital = 100000,
      startDate = '1999-01-01',
      endDate = null,
      rebalanceFrequency = 'monthly',
    } = req.body;

    if (!allocation) {
      return res.status(400).json({ error: 'Missing allocation' });
    }

    // Validate allocation sums to 100
    const total = Object.values(allocation).reduce((sum, v) => sum + v, 0);
    if (Math.abs(total - 100) > 0.01) {
      return res.status(400).json({ error: `Allocation must sum to 100 (got ${total})` });
    }

    console.log(`[Backtest API] Running backtest: ${JSON.stringify(allocation)}`);

    const result = await backtestService.backtestPortfolio(
      allocation,
      initialCapital,
      startDate,
      endDate,
      rebalanceFrequency
    );

    res.json(result);
  } catch (error) {
    console.error('[Backtest API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/backtest/compare
 * Compare multiple allocations
 * 
 * Body:
 * {
 *   allocations: [
 *     { stocks: 60, bonds: 30, alternatives: 5, cash: 5 },
 *     { stocks: 70, bonds: 20, alternatives: 5, cash: 5 },
 *     { stocks: 50, bonds: 40, alternatives: 5, cash: 5 }
 *   ],
 *   initialCapital: 100000,
 *   startDate: '1999-01-01',
 *   endDate: '2026-02-25'
 * }
 */
router.post('/compare', async (req, res) => {
  try {
    const {
      allocations,
      initialCapital = 100000,
      startDate = '1999-01-01',
      endDate = null,
    } = req.body;

    if (!allocations || !Array.isArray(allocations)) {
      return res.status(400).json({ error: 'Missing allocations array' });
    }

    console.log(`[Backtest API] Comparing ${allocations.length} allocations`);

    const results = await backtestService.compareAllocations(
      allocations,
      initialCapital,
      startDate,
      endDate
    );

    res.json(results);
  } catch (error) {
    console.error('[Backtest API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
