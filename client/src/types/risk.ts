/**
 * Risk Profile Questionnaire - Type Definitions
 * 
 * Dynamic AI-driven questionnaire with compliance logging
 */

export interface Option {
  id: string;
  text: string;
  score?: number; // Dynamic scoring from AI
}

export interface Question {
  id: string;
  section: 'behavioral' | 'scenario' | 'wealth' | 'capacity' | 'experience';
  text: string;
  options: Option[];
  rationale?: string; // AI explanation for compliance
  wealthTier?: 'emerging' | 'affluent' | 'hnw' | 'uhnw'; // <$1M, $1M-$10M, $10M-$100M, $100M+
}

export interface Answer {
  questionId: string;
  optionId: string;
  score: number;
  timestamp: number;
}

export interface QuestionHistory {
  question: Question;
  answer: Answer;
}

export interface BehavioralInvestorType {
  category: 'highly-emotional' | 'emotional' | 'emotional-blend' | 'cognitive' | 'hyper-cognitive';
  score: number; // 0-15 scale
  description: string;
  traits: string[];
  recommendations: string[];
}

export interface RiskTier {
  level: number; // 1-10
  name: string; // Conservative → Aggressive
  description: string;
  allocation: {
    stocks: number;
    bonds: number;
    alternatives: number;
    cash: number;
  };
}

export interface AssessmentResult {
  // Scores
  totalScore: number; // 0-200
  riskCapacity: number; // 0-100 (financial ability)
  riskWillingness: number; // 0-100 (behavioral comfort)
  
  // Classifications
  behavioralType: BehavioralInvestorType;
  recommendedTier: RiskTier;
  
  // Compliance
  timestamp: number;
  questionHistory: QuestionHistory[];
  complianceLog: {
    assessmentId: string;
    version: string;
    methodology: string;
    disclosures: string[];
  };
  
  // Context
  wealthTier: Question['wealthTier'];
  investmentExperience: 'novice' | 'intermediate' | 'advanced' | 'expert';
  timeHorizon: number; // years
}

export interface InterviewContext {
  answers: Answer[];
  questionHistory: QuestionHistory[];
  currentWealthTier?: Question['wealthTier'];
  currentExperience?: AssessmentResult['investmentExperience'];
}
