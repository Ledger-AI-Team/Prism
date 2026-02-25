/**
 * Presenter API Routes
 */

import express from 'express';
import { PresenterService } from '../services/presenter-service.js';
import { AIPresentationGenerator } from '../services/ai-presentation-generator.js';

const router = express.Router();
const presenterService = new PresenterService();
const aiGenerator = new AIPresentationGenerator();

router.post('/', async (req, res) => {
  try {
    const presentation = await presenterService.createPresentation(req.body);
    res.json({ success: true, presentation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const presentation = await presenterService.getPresentation(req.params.id);
    res.json({ success: true, presentation });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
  }
});

router.get('/household/:householdId', async (req, res) => {
  try {
    const presentations = await presenterService.listPresentations(req.params.householdId);
    res.json({ success: true, presentations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/templates/list', async (req, res) => {
  try {
    const templates = await presenterService.listTemplates(req.query.type);
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI-generated presentation
router.post('/generate-ai', async (req, res) => {
  try {
    const { rawText, title, clientName, includeCharts, brandingStyle } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    console.log('[Presenter API] Generating AI presentation...');

    const presentation = await aiGenerator.generateFromText(rawText, {
      title,
      clientName,
      includeCharts,
      brandingStyle: brandingStyle || 'farther',
    });

    res.json({
      success: true,
      presentation,
    });

  } catch (error) {
    console.error('[Presenter API] AI generation error:', error);
    res.status(500).json({ 
      error: 'AI generation failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

export default router;
