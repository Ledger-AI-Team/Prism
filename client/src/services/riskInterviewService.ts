/**
 * Risk Profile Questionnaire - AI Interview Service
 * 
 * Uses Claude (Anthropic) to generate adaptive, contextual questions
 * based on client's wealth tier, experience, and prior answers.
 */

import type { Question, Answer, QuestionHistory, InterviewContext } from '../types/risk';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Generate the next question based on interview context
 */
export async function generateNextQuestion(
  context: InterviewContext,
  questionNumber: number
): Promise<Question> {
  try {
    // Use question bank service (no AI needed)
    const response = await fetch(`${API_URL}/api/risk/question-from-bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionNumber,
        wealthTier: context.currentWealthTier,
        experience: context.currentExperience,
        questionHistory: context.questionHistory.map(h => ({
          id: h.question.id,
          section: h.question.section,
          score: h.answer.score,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.question;
    
  } catch (error) {
    console.error('[Interview Service] Failed to get question from bank:', error);
    return getFallbackQuestion(questionNumber);
  }
}

/**
 * Fallback question if AI fails (ensures interview never breaks)
 */
function getFallbackQuestion(questionNumber: number): Question {
  const fallbacks: Question[] = [
    {
      id: `Q${questionNumber}`,
      section: 'behavioral',
      text: 'How would you react if your portfolio lost 20% in a single month?',
      options: [
        { id: 'a', text: 'Panic and sell everything immediately', score: 0 },
        { id: 'b', text: 'Feel anxious but hold steady', score: 5 },
        { id: 'c', text: 'Stay calm and review fundamentals', score: 10 },
        { id: 'd', text: 'See it as a buying opportunity', score: 15 },
      ],
      rationale: 'Fallback question - AI service unavailable',
    },
    {
      id: `Q${questionNumber}`,
      section: 'capacity',
      text: 'What percentage of your liquid net worth is this investment account?',
      options: [
        { id: 'a', text: 'More than 75%', score: 0 },
        { id: 'b', text: '50-75%', score: 5 },
        { id: 'c', text: '25-50%', score: 10 },
        { id: 'd', text: 'Less than 25%', score: 15 },
      ],
      rationale: 'Fallback question - AI service unavailable',
    },
  ];

  return fallbacks[questionNumber % fallbacks.length];
}

/**
 * Validate question structure from AI
 */
export function validateQuestion(question: any): question is Question {
  return (
    typeof question === 'object' &&
    typeof question.id === 'string' &&
    typeof question.text === 'string' &&
    Array.isArray(question.options) &&
    question.options.length >= 2 &&
    question.options.length <= 6 &&
    question.options.every(
      (opt: any) =>
        typeof opt.id === 'string' &&
        typeof opt.text === 'string' &&
        (opt.score === undefined || typeof opt.score === 'number')
    )
  );
}

/**
 * Get initial question (always static for consistency)
 */
export function getInitialQuestion(): Question {
  return {
    id: 'Q1',
    section: 'wealth',
    text: 'What is your current investable net worth?',
    options: [
      { id: 'f', text: 'Over $50M', score: 15 },
      { id: 'e', text: '$10M - $50M', score: 13 },
      { id: 'd', text: '$5M - $10M', score: 12 },
      { id: 'c', text: '$1M - $5M', score: 10 },
      { id: 'b', text: '$500K - $1M', score: 7 },
      { id: 'a', text: 'Under $500K', score: 5 },
    ],
    rationale: 'Establishes wealth tier for adaptive questioning',
  };
}

/**
 * Determine wealth tier from answer
 */
export function determineWealthTier(optionId: string): Question['wealthTier'] {
  const tierMap: Record<string, Question['wealthTier']> = {
    a: 'emerging',
    b: 'emerging',
    c: 'affluent',
    d: 'affluent',
    e: 'hnw',
    f: 'uhnw',
  };
  return tierMap[optionId] || 'affluent';
}
