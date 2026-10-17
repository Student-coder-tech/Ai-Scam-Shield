export type Language = 'en' | 'hi' | 'mr';

export type Theme = 'light' | 'dark' | 'classic';

export type ScannerMode = 'message' | 'url' | 'qr' | 'audio';

export type RiskLevel = 'Low' | 'Medium' | 'High';
export type RiskVerdict = 'Safe' | 'Suspicious' | 'Scam';

export interface WarningSign {
  id: string;
  label: string;
  evidence: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

export interface UpiDetails {
  rawUri?: string;
  payeeVpa?: string;
  payeeName?: string;
  amount?: string;
  transactionNote?: string;
  merchantCode?: string;
  isMerchant?: boolean;
  warnings?: string[];
}

export interface ScanResult {
  id: string;
  timestamp: number;
  input_type: ScannerMode;
  input_preview: string;
  risk_score: number; // 0 - 100
  verdict: RiskVerdict;
  risk_level: RiskLevel;
  confidence: number; // 0 - 100%
  findings: WarningSign[];
  summary: string;
  recommended_actions: string[];
  language: Language;
  analysis_status: 'completed' | 'partial' | 'failed';
  detection_engines_used: string[];
  technical_details?: {
    domain?: string;
    isHttps?: boolean;
    ipDetected?: boolean;
    upiDetails?: UpiDetails;
    transcript?: string;
    tacticsDetected?: string[];
    aiModelUsed?: string;
    ssrfProtected?: boolean;
    isSimulated?: boolean;
  };
}

export interface CommunityReport {
  id: string;
  category: string;
  excerptOrUrl: string;
  language: Language;
  description: string;
  timestamp: number;
  status: 'verified' | 'under_review';
  upvotes: number;
}

export interface QuizQuestion {
  id: number;
  scenario: string;
  type: string;
  sender: string;
  content: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export interface EducationalArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  exampleScenario: string;
  warningSigns: string[];
  protectionSteps: string[];
  actionIfVictim: string[];
}
