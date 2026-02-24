/**
 * Transcript Extraction Service
 * 
 * Uses Claude to extract structured financial data from advisor discovery call transcripts.
 * Auto-populates household data, accounts, income, expenses, goals.
 * Returns confidence scores and coverage report.
 */

import Anthropic from '@anthropic-ai/sdk';

export class TranscriptExtractionService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Extract structured financial data from transcript.
   * @param {string} transcript - Raw meeting transcript text
   * @param {string} householdId - Optional existing household ID
   * @returns {Promise<ExtractionResult>}
   */
  async extractFromTranscript(transcript) {
    const prompt = this.buildExtractionPrompt(transcript);
    
    console.log('[TranscriptExtraction] Analyzing transcript with Claude...');
    
    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      temperature: 0, // Deterministic for data extraction
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });
    
    const responseText = message.content[0].text;
    console.log('[TranscriptExtraction] Claude response received');
    
    // Parse JSON response
    const extracted = JSON.parse(responseText);
    
    // Calculate coverage metrics
    const coverage = this.calculateCoverage(extracted);
    
    // Calculate confidence scores
    const confidence = this.calculateConfidenceScores(extracted, transcript);
    
    return {
      extracted,
      coverage,
      confidence,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }

  /**
   * Build extraction prompt for Claude.
   */
  buildExtractionPrompt(transcript) {
    return `You are a financial data extraction assistant for Farther Prism, an institutional financial planning platform.

Your task: Analyze the following discovery call transcript and extract structured financial information to pre-populate a client's financial profile.

<transcript>
${transcript}
</transcript>

Extract the following information. Only include fields where you find explicit information in the transcript. Do not infer or guess. For each field, include a confidence score (0-1) indicating your certainty.

Return a JSON object with this structure:

{
  "household": {
    "name": "string (client name or household identifier)",
    "confidence": 0-1
  },
  "people": [
    {
      "firstName": "string",
      "lastName": "string",
      "dateOfBirth": "YYYY-MM-DD or null",
      "relationship": "primary|spouse|dependent",
      "employment": "string (employer/occupation)",
      "confidence": 0-1
    }
  ],
  "accounts": [
    {
      "accountName": "string (descriptive name)",
      "accountType": "ira_traditional|ira_roth|401k|taxable_individual|taxable_joint|etc",
      "custodian": "string (Charles Schwab, Fidelity, etc.)",
      "currentValue": number,
      "confidence": 0-1
    }
  ],
  "incomeStreams": [
    {
      "type": "salary|bonus|rental|business|pension|social_security|other",
      "amount": number (annual),
      "frequency": "annual|monthly|biweekly",
      "description": "string",
      "startDate": "YYYY-MM-DD or null",
      "endDate": "YYYY-MM-DD or null (null = indefinite)",
      "confidence": 0-1
    }
  ],
  "expenseStreams": [
    {
      "category": "housing|transportation|healthcare|living|discretionary",
      "amount": number (annual or monthly, specify in frequency)",
      "frequency": "annual|monthly",
      "description": "string",
      "isDiscretionary": boolean,
      "confidence": 0-1
    }
  ],
  "goals": [
    {
      "goalType": "retirement|college|legacy|major_purchase|travel",
      "description": "string",
      "targetAmount": number or null,
      "targetDate": "YYYY-MM-DD or null",
      "priority": 1-3 (1=essential, 2=important, 3=aspirational),
      "confidence": 0-1
    }
  ],
  "realEstate": [
    {
      "propertyType": "primary_residence|rental|vacation|land",
      "address": "string or null",
      "estimatedValue": number or null,
      "mortgageBalance": number or null,
      "rentalIncome": number or null (annual)",
      "confidence": 0-1
    }
  ],
  "insurance": [
    {
      "type": "life|disability|long_term_care|property|auto",
      "carrier": "string or null",
      "coverage": number or null,
      "premium": number or null (annual)",
      "confidence": 0-1
    }
  ],
  "riskProfile": {
    "tolerance": "conservative|moderately_conservative|balanced|moderately_aggressive|aggressive|null",
    "timeHorizon": number or null (years),
    "liquidityNeeds": "string or null",
    "confidence": 0-1
  },
  "notes": "string (any additional context or concerns mentioned)"
}

Rules:
1. Only extract explicitly stated information - do not infer
2. Use null for missing data
3. Confidence scores:
   - 1.0 = directly stated with numbers ("I have $500k in my 401k")
   - 0.8 = clearly stated but approximate ("about half a million in retirement")
   - 0.6 = mentioned but vague ("a decent amount saved")
   - 0.4 = implied but not stated
   - Do not include fields with confidence < 0.4
4. For account types, choose the best match from standard types
5. Normalize all amounts to annual where possible
6. Use ISO date format YYYY-MM-DD

Return ONLY valid JSON, no explanation or markdown.`;
  }

  /**
   * Calculate coverage metrics.
   */
  calculateCoverage(extracted) {
    // Define required vs optional fields
    const requiredFields = [
      'household.name',
      'people', // At least 1 person
      'incomeStreams', // At least 1 income source
      'goals', // At least 1 goal
    ];
    
    const optionalFields = [
      'accounts',
      'expenseStreams',
      'realEstate',
      'insurance',
      'riskProfile',
    ];
    
    let requiredFilled = 0;
    let requiredTotal = requiredFields.length;
    let optionalFilled = 0;
    let optionalTotal = optionalFields.length;
    let totalFields = 0;
    let filledFields = 0;
    
    // Check required fields
    if (extracted.household?.name) requiredFilled++;
    if (extracted.people?.length > 0) requiredFilled++;
    if (extracted.incomeStreams?.length > 0) requiredFilled++;
    if (extracted.goals?.length > 0) requiredFilled++;
    
    // Check optional fields
    if (extracted.accounts?.length > 0) optionalFilled++;
    if (extracted.expenseStreams?.length > 0) optionalFilled++;
    if (extracted.realEstate?.length > 0) optionalFilled++;
    if (extracted.insurance?.length > 0) optionalFilled++;
    if (extracted.riskProfile?.tolerance) optionalFilled++;
    
    // Count total fields filled
    totalFields = Object.keys(extracted).length;
    filledFields = Object.values(extracted).filter(v => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
      return v !== null && v !== undefined && v !== '';
    }).length;
    
    // Calculate detailed field counts
    const fieldCounts = {
      people: extracted.people?.length || 0,
      accounts: extracted.accounts?.length || 0,
      incomeStreams: extracted.incomeStreams?.length || 0,
      expenseStreams: extracted.expenseStreams?.length || 0,
      goals: extracted.goals?.length || 0,
      realEstate: extracted.realEstate?.length || 0,
      insurance: extracted.insurance?.length || 0,
    };
    
    return {
      requiredFields: {
        filled: requiredFilled,
        total: requiredTotal,
        percentage: Math.round((requiredFilled / requiredTotal) * 100),
        missing: requiredTotal - requiredFilled,
      },
      optionalFields: {
        filled: optionalFilled,
        total: optionalTotal,
        percentage: Math.round((optionalFilled / optionalTotal) * 100),
      },
      totalFields: {
        filled: filledFields,
        total: totalFields,
      },
      fieldCounts,
      completeness: Math.round(((requiredFilled / requiredTotal) * 0.7 + (optionalFilled / optionalTotal) * 0.3) * 100),
    };
  }

  /**
   * Calculate confidence scores for extracted data.
   */
  calculateConfidenceScores(extracted, transcript) {
    const scores = {
      overall: 0,
      byCategory: {},
      lowConfidenceFields: [],
    };
    
    let totalConfidence = 0;
    let totalFields = 0;
    
    // Helper to collect confidence scores
    const collectConfidence = (category, items) => {
      if (!items || items.length === 0) return;
      
      const categoryConfidence = items.reduce((sum, item) => {
        const conf = item.confidence || 0.5;
        if (conf < 0.6) {
          scores.lowConfidenceFields.push({
            category,
            field: item.description || item.goalType || item.accountName || 'unknown',
            confidence: conf,
          });
        }
        return sum + conf;
      }, 0) / items.length;
      
      scores.byCategory[category] = Math.round(categoryConfidence * 100) / 100;
      totalConfidence += categoryConfidence;
      totalFields++;
    };
    
    // Collect scores by category
    if (extracted.household) {
      scores.byCategory.household = extracted.household.confidence || 0.8;
      totalConfidence += scores.byCategory.household;
      totalFields++;
    }
    
    collectConfidence('people', extracted.people);
    collectConfidence('accounts', extracted.accounts);
    collectConfidence('incomeStreams', extracted.incomeStreams);
    collectConfidence('expenseStreams', extracted.expenseStreams);
    collectConfidence('goals', extracted.goals);
    collectConfidence('realEstate', extracted.realEstate);
    collectConfidence('insurance', extracted.insurance);
    
    if (extracted.riskProfile) {
      scores.byCategory.riskProfile = extracted.riskProfile.confidence || 0.5;
      totalConfidence += scores.byCategory.riskProfile;
      totalFields++;
    }
    
    // Calculate overall confidence
    scores.overall = totalFields > 0 ? Math.round((totalConfidence / totalFields) * 100) / 100 : 0;
    
    return scores;
  }

  /**
   * Apply extracted data to household (writes to database).
   */
  async applyToHousehold(householdId, extracted, options = { autoApprove: false }) {
    // This will be implemented to insert into database tables
    // For now, return what would be applied
    
    const summary = {
      householdId,
      applied: {
        people: extracted.people?.length || 0,
        accounts: extracted.accounts?.length || 0,
        incomeStreams: extracted.incomeStreams?.length || 0,
        expenseStreams: extracted.expenseStreams?.length || 0,
        goals: extracted.goals?.length || 0,
        realEstate: extracted.realEstate?.length || 0,
        insurance: extracted.insurance?.length || 0,
      },
      status: options.autoApprove ? 'auto_applied' : 'pending_review',
    };
    
    return summary;
  }
}

export default TranscriptExtractionService;
