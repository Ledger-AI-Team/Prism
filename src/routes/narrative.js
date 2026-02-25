/**
 * Narrative API Routes - Client Reporting
 */

import express from 'express';
import { NarrativeService } from '../services/narrative-service.js';

const router = express.Router();
const narrativeService = new NarrativeService();

// Create report
router.post('/', async (req, res) => {
  try {
    const report = await narrativeService.createReport(req.body);
    res.json({ success: true, report });
  } catch (error) {
    console.error('[Narrative API Error]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get report
router.get('/:id', async (req, res) => {
  try {
    const report = await narrativeService.getReport(req.params.id);
    res.json({ success: true, report });
  } catch (error) {
    res.status(error.message.includes('not found') ? 404 : 500).json({ error: error.message });
  }
});

// List reports for household
router.get('/household/:householdId', async (req, res) => {
  try {
    const reports = await narrativeService.listReports(req.params.householdId, req.query);
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List templates
router.get('/templates/list', async (req, res) => {
  try {
    const templates = await narrativeService.listTemplates(req.query.type);
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate HTML preview
router.get('/:id/preview', async (req, res) => {
  try {
    const report = await narrativeService.getReport(req.params.id);
    const html = narrativeService.generateHTML(report);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
