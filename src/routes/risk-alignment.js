/**
 * Risk Alignment API Routes
 * 
 * Endpoints:
 * - GET /api/v1/risk/alignment/:householdId
 * - POST /api/v1/risk/alignment/:householdId/stress-test
 * - GET /api/v1/risk/alignment/:householdId/rebalance-preview
 */

import express from 'express';
import { riskAlignmentService } from '../services/risk-alignment-service.js';

const router = express.Router();

/**
 * GET /api/v1/risk/alignment/:householdId
 * 
 * Calculate full risk alignment for a household
 */
router.get('/alignment/:householdId', async (req, res) => {
  try {
    const { householdId } = req.params;
    
    console.log(`[API] Risk alignment request for household ${householdId}`);
    
    const result = await riskAlignmentService.calculateAlignment(householdId);
    
    res.json({
      success: true,
      data: result,
    });
    
  } catch (error) {
    console.error('[API] Risk alignment error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/v1/risk/alignment/:householdId/stress-test
 * 
 * Run custom stress test scenario
 */
router.post('/alignment/:householdId/stress-test', async (req, res) => {
  try {
    const { householdId } = req.params;
    const { scenarioName, marketDrop, startDate, endDate } = req.body;
    
    // TODO: Implement custom stress testing
    
    res.json({
      success: true,
      message: 'Custom stress testing coming soon',
      data: {
        householdId,
        scenarioName,
        marketDrop,
      },
    });
    
  } catch (error) {
    console.error('[API] Stress test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/risk/alignment/:householdId/rebalance-preview
 * 
 * Preview rebalancing recommendations
 */
router.get('/alignment/:householdId/rebalance-preview', async (req, res) => {
  try {
    const { householdId } = req.params;
    
    // Get full alignment (includes rebalancing)
    const result = await riskAlignmentService.calculateAlignment(householdId);
    
    res.json({
      success: true,
      data: {
        householdId,
        rebalancing: result.rebalancing,
        currentAllocation: result.rebalancing.currentAllocation,
        targetAllocation: result.rebalancing.targetAllocation,
        trades: result.rebalancing.trades,
        taxImpact: result.rebalancing.taxImpact,
      },
    });
    
  } catch (error) {
    console.error('[API] Rebalance preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
