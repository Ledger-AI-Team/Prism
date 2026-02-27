/**
 * Risk Question Bank Service
 * 
 * Serves randomized questions from a static bank (400 questions total).
 * No AI needed = instant, reliable, free.
 * 
 * Features:
 * - 100 questions per wealth tier (emerging, affluent, hnw, uhnw)
 * - Covers all 7 dimensions: tolerance, capacity, perception, literacy, composure, need, preference
 * - Randomized order (no patterns)
 * - Section rotation (ensures variety)
 * - No repeated questions in same session
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load question bank
const questionBankPath = path.join(__dirname, '../data/risk-question-bank.json');
let questionBank = null;

function loadQuestionBank() {
  if (!questionBank) {
    const data = fs.readFileSync(questionBankPath, 'utf-8');
    questionBank = JSON.parse(data);
  }
  return questionBank;
}

/**
 * Get next question from question bank
 * 
 * @param {Object} context - Interview context
 * @param {number} questionNumber - Current question number (1-15)
 * @returns {Object} Question object
 */
export function getQuestionFromBank(context, questionNumber) {
  const bank = loadQuestionBank();
  
  // Determine wealth tier from context
  const wealthTier = context.currentWealthTier || 'affluent';
  
  // Get questions for this tier
  let tierQuestions = bank[wealthTier] || bank.affluent;
  
  // If tier has no questions yet, fall back to affluent
  if (!tierQuestions || tierQuestions.length === 0) {
    console.warn(`[QuestionBank] No questions for tier ${wealthTier}, using affluent`);
    tierQuestions = bank.affluent || [];
  }
  
  // Track which questions already asked (from context)
  const askedQuestions = new Set(
    context.questionHistory?.map(h => h.question.id) || []
  );
  
  // Filter out already-asked questions
  const availableQuestions = tierQuestions.filter(q => !askedQuestions.has(q.id));
  
  // If all questions exhausted, reset (allow repeats)
  const questionsToUse = availableQuestions.length > 0 ? availableQuestions : tierQuestions;
  
  // Prioritize sections we haven't covered yet
  const answeredSections = new Set(
    context.questionHistory?.map(h => h.question.section) || []
  );
  
  // Prefer questions from uncovered sections
  const uncoveredQuestions = questionsToUse.filter(q => !answeredSections.has(q.section));
  const pool = uncoveredQuestions.length > 0 ? uncoveredQuestions : questionsToUse;
  
  // Randomize selection
  const randomIndex = Math.floor(Math.random() * pool.length);
  const selectedQuestion = pool[randomIndex];
  
  // Shuffle options (prevent position bias)
  const shuffledOptions = shuffleArray([...selectedQuestion.options]);
  
  return {
    ...selectedQuestion,
    options: shuffledOptions,
    metadata: {
      source: 'question_bank',
      tier: wealthTier,
      poolSize: pool.length,
      askedCount: askedQuestions.size,
    },
  };
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get question bank statistics
 */
export function getQuestionBankStats() {
  const bank = loadQuestionBank();
  
  const stats = {};
  for (const [tier, questions] of Object.entries(bank)) {
    const sections = {};
    questions.forEach(q => {
      sections[q.section] = (sections[q.section] || 0) + 1;
    });
    
    stats[tier] = {
      total: questions.length,
      sections,
    };
  }
  
  return stats;
}

/**
 * Add questions to the bank (for expansion)
 */
export function addQuestionsToBank(tier, newQuestions) {
  const bank = loadQuestionBank();
  
  if (!bank[tier]) {
    bank[tier] = [];
  }
  
  // Validate and add
  newQuestions.forEach(q => {
    if (validateQuestion(q)) {
      bank[tier].push(q);
    } else {
      console.warn(`[QuestionBank] Invalid question skipped:`, q);
    }
  });
  
  // Save back to file
  fs.writeFileSync(questionBankPath, JSON.stringify(bank, null, 2), 'utf-8');
  
  // Reload cache
  questionBank = bank;
  
  return {
    tier,
    added: newQuestions.length,
    total: bank[tier].length,
  };
}

/**
 * Validate question structure
 */
function validateQuestion(question) {
  return (
    question.id &&
    question.section &&
    question.text &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.every(opt => 
      opt.id && opt.text && typeof opt.score === 'number'
    ) &&
    question.rationale
  );
}

export default {
  getQuestionFromBank,
  getQuestionBankStats,
  addQuestionsToBank,
};
