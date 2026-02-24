/**
 * Risk Profile Questionnaire - Scoring Service
 * 
 * Deterministic scoring engine for regulatory compliance.
 * Calculates:
 * - Total risk score (0-200)
 * - Risk capacity vs willingness
 * - Behavioral Investor Type (BIT)
 * - Recommended allocation tier
 */

import type {
  Answer,
  QuestionHistory,
  AssessmentResult,
  BehavioralInvestorType,
  RiskTier,
} from '../types/risk';

/**
 * Calculate complete assessment result from question history
 */
export function calculateAssessment(
  questionHistory: QuestionHistory[]
): AssessmentResult {
  const answers = questionHistory.map(h => h.answer);
  
  // Calculate scores
  const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
  const maxPossibleScore = answers.length * 15; // Each question max 15 points
  
  // Separate capacity vs willingness
  const capacityQuestions = questionHistory.filter(h =>
    ['wealth', 'capacity', 'experience'].includes(h.question.section)
  );
  const willingnessQuestions = questionHistory.filter(h =>
    ['behavioral', 'scenario'].includes(h.question.section)
  );
  
  const riskCapacity = calculateSubScore(capacityQuestions);
  const riskWillingness = calculateSubScore(willingnessQuestions);
  
  // Calculate BIT
  const behavioralType = calculateBIT(willingnessQuestions);
  
  // Determine recommended tier
  const recommendedTier = determineRiskTier(totalScore, maxPossibleScore);
  
  // Extract context
  const wealthTier = questionHistory[0]?.question.wealthTier; // Q1 always wealth
  const investmentExperience = determineExperience(capacityQuestions);
  const timeHorizon = estimateTimeHorizon(questionHistory);
  
  return {
    totalScore,
    riskCapacity,
    riskWillingness,
    behavioralType,
    recommendedTier,
    timestamp: Date.now(),
    questionHistory,
    complianceLog: {
      assessmentId: `RPQ-${Date.now()}`,
      version: '1.0.0',
      methodology: 'Dual-dimension risk model: Capacity (financial ability) + Willingness (behavioral comfort)',
      disclosures: [
        'This assessment is for educational purposes and does not constitute investment advice.',
        'Risk tolerance can change over time based on life circumstances.',
        'Recommended allocations are guidelines, not mandates.',
        'Past performance does not guarantee future results.',
      ],
    },
    wealthTier,
    investmentExperience,
    timeHorizon,
  };
}

/**
 * Calculate sub-score as percentage (0-100)
 */
function calculateSubScore(questions: QuestionHistory[]): number {
  if (questions.length === 0) return 50; // Default to moderate
  
  const total = questions.reduce((sum, q) => sum + q.answer.score, 0);
  const max = questions.length * 15;
  return Math.round((total / max) * 100);
}

/**
 * Calculate Behavioral Investor Type (BIT)
 */
function calculateBIT(behavioralQuestions: QuestionHistory[]): BehavioralInvestorType {
  if (behavioralQuestions.length === 0) {
    return {
      category: 'emotional-blend',
      score: 7.5,
      description: 'Balanced emotional and cognitive processing',
      traits: ['Data required for accurate classification'],
      recommendations: ['Complete behavioral questions for detailed analysis'],
    };
  }
  
  // Average score on 0-15 scale
  const avgScore = behavioralQuestions.reduce((sum, q) => sum + q.answer.score, 0) / behavioralQuestions.length;
  
  if (avgScore <= 3) {
    return {
      category: 'highly-emotional',
      score: avgScore,
      description: 'Decisions driven primarily by emotion and recent experiences',
      traits: [
        'Strong emotional reactions to market volatility',
        'Recency bias in decision-making',
        'Difficulty separating feelings from facts',
        'May panic sell during downturns',
      ],
      recommendations: [
        'Conservative allocation (20-40% stocks)',
        'Automated rebalancing to avoid emotional decisions',
        'Regular advisor check-ins during volatility',
        'Focus on income-generating assets',
      ],
    };
  } else if (avgScore <= 6) {
    return {
      category: 'emotional',
      score: avgScore,
      description: 'Emotion influences decisions but can be managed with guidance',
      traits: [
        'Moderate emotional reactions',
        'Benefits from structured decision processes',
        'Can override emotions with effort',
        'Needs reassurance during volatility',
      ],
      recommendations: [
        'Moderate allocation (40-60% stocks)',
        'Written investment policy statement',
        'Quarterly reviews to stay on track',
        'Diversification for peace of mind',
      ],
    };
  } else if (avgScore <= 9) {
    return {
      category: 'emotional-blend',
      score: avgScore,
      description: 'Balanced mix of emotional and cognitive processing',
      traits: [
        'Uses both gut feeling and data',
        'Emotionally aware but not reactive',
        'Comfortable with moderate risk',
        'Self-correcting during stress',
      ],
      recommendations: [
        'Balanced allocation (50-70% stocks)',
        'Flexibility to adjust as needed',
        'Semi-annual reviews',
        'Mix of growth and income assets',
      ],
    };
  } else if (avgScore <= 12) {
    return {
      category: 'cognitive',
      score: avgScore,
      description: 'Decisions primarily data-driven with emotional awareness',
      traits: [
        'Analyzes data before reacting',
        'Comfortable with volatility',
        'Long-term perspective',
        'Can delay gratification',
      ],
      recommendations: [
        'Growth-oriented allocation (60-80% stocks)',
        'Tax-loss harvesting strategies',
        'Annual reviews',
        'Focus on total return',
      ],
    };
  } else {
    return {
      category: 'hyper-cognitive',
      score: avgScore,
      description: 'Purely analytical, emotion rarely factors into decisions',
      traits: [
        'Views volatility as opportunity',
        'Backtests strategies rigorously',
        'Comfortable with complexity',
        'May over-optimize',
      ],
      recommendations: [
        'Aggressive allocation (70-100% stocks)',
        'Alternative investments (PE, hedge funds)',
        'Factor-based strategies',
        'Watch for overconfidence bias',
      ],
    };
  }
}

/**
 * Determine risk tier from score
 */
function determineRiskTier(score: number, maxScore: number): RiskTier {
  const percentage = (score / maxScore) * 100;
  
  const tiers: RiskTier[] = [
    {
      level: 1,
      name: 'Ultra Conservative',
      description: 'Capital preservation is paramount. Minimal volatility tolerance.',
      allocation: { stocks: 10, bonds: 60, alternatives: 5, cash: 25 },
    },
    {
      level: 2,
      name: 'Very Conservative',
      description: 'Primarily fixed income. Low equity exposure for modest growth.',
      allocation: { stocks: 20, bonds: 60, alternatives: 10, cash: 10 },
    },
    {
      level: 3,
      name: 'Conservative',
      description: 'Income-focused with limited growth exposure.',
      allocation: { stocks: 30, bonds: 55, alternatives: 10, cash: 5 },
    },
    {
      level: 4,
      name: 'Moderately Conservative',
      description: 'Balanced toward fixed income but with meaningful equity participation.',
      allocation: { stocks: 40, bonds: 45, alternatives: 10, cash: 5 },
    },
    {
      level: 5,
      name: 'Moderate',
      description: 'Balanced approach. Equal weight to growth and stability.',
      allocation: { stocks: 50, bonds: 35, alternatives: 10, cash: 5 },
    },
    {
      level: 6,
      name: 'Moderately Aggressive',
      description: 'Growth-oriented with meaningful fixed income ballast.',
      allocation: { stocks: 60, bonds: 25, alternatives: 10, cash: 5 },
    },
    {
      level: 7,
      name: 'Aggressive',
      description: 'Equity-focused for long-term growth. Can weather volatility.',
      allocation: { stocks: 70, bonds: 15, alternatives: 10, cash: 5 },
    },
    {
      level: 8,
      name: 'Very Aggressive',
      description: 'Predominantly equities. High tolerance for short-term drawdowns.',
      allocation: { stocks: 80, bonds: 5, alternatives: 10, cash: 5 },
    },
    {
      level: 9,
      name: 'Ultra Aggressive',
      description: 'Maximum growth. Minimal fixed income. Comfortable with large swings.',
      allocation: { stocks: 90, bonds: 0, alternatives: 10, cash: 0 },
    },
    {
      level: 10,
      name: 'All-In Growth',
      description: 'Pure equity. Institutional-grade risk tolerance.',
      allocation: { stocks: 85, bonds: 0, alternatives: 15, cash: 0 },
    },
  ];
  
  // Map percentage to tier (0-10% → tier 1, 90-100% → tier 10)
  const tierIndex = Math.min(Math.floor(percentage / 10), 9);
  return tiers[tierIndex];
}

/**
 * Determine investment experience from capacity questions
 */
function determineExperience(capacityQuestions: QuestionHistory[]): AssessmentResult['investmentExperience'] {
  const experienceQ = capacityQuestions.find(q =>
    q.question.text.toLowerCase().includes('experience') ||
    q.question.text.toLowerCase().includes('familiar')
  );
  
  if (!experienceQ) return 'intermediate';
  
  const score = experienceQ.answer.score;
  if (score <= 3) return 'novice';
  if (score <= 7) return 'intermediate';
  if (score <= 11) return 'advanced';
  return 'expert';
}

/**
 * Estimate time horizon from question history
 */
function estimateTimeHorizon(questionHistory: QuestionHistory[]): number {
  const horizonQ = questionHistory.find(q =>
    q.question.text.toLowerCase().includes('horizon') ||
    q.question.text.toLowerCase().includes('timeline') ||
    q.question.text.toLowerCase().includes('years')
  );
  
  if (!horizonQ) return 15; // Default to moderate-term
  
  // Extract years from option text
  const optionText = horizonQ.question.options
    .find(o => o.id === horizonQ.answer.optionId)?.text || '';
  
  const match = optionText.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 15;
}
