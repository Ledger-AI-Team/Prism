/**
 * Risk AI Service - Claude-powered adaptive questionnaire
 * 
 * Generates contextual questions based on:
 * - Client wealth tier
 * - Investment experience
 * - Prior answers and scores
 * - Behavioral patterns
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Aris, a Wealth Management Risk Architect with 25 years of experience.

Your role: Generate ONE adaptive question for a financial risk profile questionnaire.

RULES:
1. Adapt to wealth tiers:
   - emerging (<$1M): Focus on basics, risk education, simple scenarios
   - affluent ($1M-$10M): Intermediate complexity, tax awareness
   - hnw ($10M-$100M): Sophisticated scenarios, alternative investments
   - uhnw ($100M+): Complex structures, legacy planning, institutional-grade

2. Question types (rotate):
   - behavioral: Emotional reactions, loss tolerance
   - scenario: Market crashes, opportunity evaluation
   - wealth: Liquidity needs, income requirements
   - capacity: Time horizon, financial obligations
   - experience: Investment knowledge, past decisions

3. Scoring (0-15 per question):
   - 0-3: Risk-averse / Conservative
   - 4-7: Moderate-conservative
   - 8-11: Moderate-aggressive
   - 12-15: Aggressive / High risk tolerance

4. Adaptive logic:
   - If high scores so far: Test with riskier scenarios
   - If low scores: Validate conviction with safer alternatives
   - If inconsistent: Probe for clarity

5. Output format (STRICT JSON):
{
  "id": "Q{number}",
  "section": "behavioral|scenario|wealth|capacity|experience",
  "text": "Clear, concise question (max 150 chars)",
  "options": [
    { "id": "a", "text": "Option text", "score": 0-15 },
    { "id": "b", "text": "Option text", "score": 0-15 },
    { "id": "c", "text": "Option text", "score": 0-15 },
    { "id": "d", "text": "Option text", "score": 0-15 }
  ],
  "rationale": "Why this question matters (compliance trail)"
}

COMPLIANCE: Every question must include a rationale explaining its relevance to risk assessment (DOL PTE 2020-02).`;

/**
 * Generate next question using Claude
 */
export async function generateQuestion({
  questionNumber,
  context,
  wealthTier = 'affluent',
  experience = 'intermediate',
  totalScore = 0,
}) {
  try {
    const userPrompt = buildPrompt({
      questionNumber,
      context,
      wealthTier,
      experience,
      totalScore,
    });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      temperature: 0.7, // Slightly creative for variety
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Claude response');
    }

    const question = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!validateQuestionStructure(question)) {
      throw new Error('Invalid question structure from Claude');
    }

    return question;
    
  } catch (error) {
    console.error('[Risk AI] Error generating question:', error);
    throw error;
  }
}

/**
 * Build the user prompt for Claude
 */
function buildPrompt({ questionNumber, context, wealthTier, experience, totalScore }) {
  const maxQuestions = 15;
  const avgScore = context.length > 0 ? totalScore / context.length : 0;
  
  let prompt = `Generate Question #${questionNumber} of ${maxQuestions}.\n\n`;
  
  // Context
  prompt += `CLIENT PROFILE:\n`;
  prompt += `- Wealth Tier: ${wealthTier}\n`;
  prompt += `- Experience: ${experience}\n`;
  prompt += `- Questions Answered: ${context.length}\n`;
  prompt += `- Average Score: ${avgScore.toFixed(1)}/15\n\n`;
  
  // History (if available)
  if (context.length > 0) {
    prompt += `ANSWER HISTORY:\n`;
    context.slice(-3).forEach((item, idx) => {
      prompt += `${idx + 1}. [${item.section}] ${item.q}\n`;
      prompt += `   → ${item.a} (score: ${item.score}/15)\n`;
    });
    prompt += '\n';
  }
  
  // Guidance
  if (avgScore < 5) {
    prompt += `PATTERN: Conservative answers. Test conviction with moderate-risk scenarios.\n`;
  } else if (avgScore > 10) {
    prompt += `PATTERN: Aggressive answers. Challenge with high-volatility scenarios.\n`;
  } else {
    prompt += `PATTERN: Balanced profile. Explore edge cases to refine placement.\n`;
  }
  
  // Sections to cover
  const answeredSections = new Set(context.map(c => c.section));
  const missingSections = ['behavioral', 'scenario', 'wealth', 'capacity', 'experience']
    .filter(s => !answeredSections.has(s));
  
  if (missingSections.length > 0) {
    prompt += `\nPRIORITIZE: ${missingSections.join(', ')} (not yet covered)\n`;
  }
  
  prompt += `\nGenerate Q#${questionNumber} now. Output ONLY valid JSON (no markdown, no explanation).`;
  
  return prompt;
}

/**
 * Validate question structure
 */
function validateQuestionStructure(q) {
  return (
    q &&
    typeof q.id === 'string' &&
    typeof q.section === 'string' &&
    typeof q.text === 'string' &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.length <= 6 &&
    q.options.every(o => 
      typeof o.id === 'string' &&
      typeof o.text === 'string' &&
      typeof o.score === 'number' &&
      o.score >= 0 &&
      o.score <= 15
    ) &&
    typeof q.rationale === 'string'
  );
}
