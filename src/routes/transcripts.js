/**
 * Transcript Discovery Routes
 * 
 * POST   /api/v1/transcripts/extract    - Extract data from transcript
 * POST   /api/v1/transcripts/apply      - Apply extracted data to household
 */

import express from 'express';
import multer from 'multer';
import { TranscriptExtractionService } from '../services/transcript-extraction-service.js';

const router = express.Router();
const extractionService = new TranscriptExtractionService();

// Configure multer for text file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

/**
 * Extract structured data from meeting transcript.
 */
router.post('/extract', upload.single('transcript'), async (req, res) => {
  try {
    let transcriptText;
    
    // Handle file upload or raw text
    if (req.file) {
      transcriptText = req.file.buffer.toString('utf-8');
    } else if (req.body.transcript) {
      transcriptText = req.body.transcript;
    } else {
      return res.status(400).json({ error: 'No transcript provided' });
    }
    
    if (transcriptText.length < 100) {
      return res.status(400).json({ error: 'Transcript too short (minimum 100 characters)' });
    }
    
    console.log(`[API] Transcript extraction: ${transcriptText.length} characters`);
    
    // Extract data using Claude
    const result = await extractionService.extractFromTranscript(transcriptText);
    
    res.json({
      success: true,
      extracted: result.extracted,
      coverage: result.coverage,
      confidence: result.confidence,
      summary: {
        overallConfidence: result.confidence.overall,
        requiredFieldsComplete: result.coverage.requiredFields.percentage,
        totalFieldsFilled: result.coverage.totalFields.filled,
        lowConfidenceCount: result.confidence.lowConfidenceFields.length,
      },
      report: {
        requiredFields: {
          filled: result.coverage.requiredFields.filled,
          missing: result.coverage.requiredFields.missing,
          percentage: result.coverage.requiredFields.percentage,
        },
        optionalFields: {
          filled: result.coverage.optionalFields.filled,
          percentage: result.coverage.optionalFields.percentage,
        },
        completeness: result.coverage.completeness,
      },
      usage: result.usage,
    });
    
  } catch (error) {
    console.error('[Transcript Extraction Error]', error.message);
    res.status(500).json({
      error: 'Transcript extraction failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * Apply extracted data to a household.
 */
router.post('/apply', async (req, res) => {
  try {
    const { householdId, extracted, autoApprove = false } = req.body;
    
    if (!householdId) {
      return res.status(400).json({ error: 'householdId is required' });
    }
    
    if (!extracted) {
      return res.status(400).json({ error: 'extracted data is required' });
    }
    
    const result = await extractionService.applyToHousehold(householdId, extracted, { autoApprove });
    
    res.json({
      success: true,
      applied: result.applied,
      status: result.status,
    });
    
  } catch (error) {
    console.error('[Transcript Apply Error]', error.message);
    res.status(500).json({ error: 'Failed to apply extracted data', message: error.message });
  }
});

export default router;
