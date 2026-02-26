/**
 * Backtest API Routes
 * 
 * POST /api/v1/backtest/portfolio - Run portfolio backtest
 * POST /api/v1/backtest/compare - Compare multiple allocations
 */

import express from 'express';
import backtestServiceV2 from '../services/backtest-service-v2.js';

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
    let {
      allocation,
      initialCapital = 100000,
      startDate = '1999-01-01',
      endDate = null,
      options = {},
    } = req.body;

    if (!allocation) {
      return res.status(400).json({ error: 'Missing allocation' });
    }

    // Support both formats:
    // 1. Simple: { stocks: 60, bonds: 30, alternatives: 5, cash: 5 }
    // 2. Detailed: [{ assetClassId: 'US_EQUITY', weight: 0.60 }, ...]
    if (!Array.isArray(allocation)) {
      // Convert simple to detailed
      allocation = backtestServiceV2.constructor.convertSimpleAllocation(allocation);
    }

    console.log(`[Backtest API] Running backtest with ${allocation.length} asset classes`);

    const result = await backtestServiceV2.backtestPortfolio(
      allocation,
      initialCapital,
      startDate,
      endDate,
      options
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
    let {
      allocations,
      initialCapital = 100000,
      startDate = '1999-01-01',
      endDate = null,
      options = {},
    } = req.body;

    if (!allocations || !Array.isArray(allocations)) {
      return res.status(400).json({ error: 'Missing allocations array' });
    }

    // Convert simple allocations to detailed format
    allocations = allocations.map(alloc => {
      if (!Array.isArray(alloc)) {
        return backtestServiceV2.constructor.convertSimpleAllocation(alloc);
      }
      return alloc;
    });

    console.log(`[Backtest API] Comparing ${allocations.length} allocations`);

    const results = await backtestServiceV2.compareAllocations(
      allocations,
      initialCapital,
      startDate,
      endDate,
      options
    );

    res.json(results);
  } catch (error) {
    console.error('[Backtest API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
