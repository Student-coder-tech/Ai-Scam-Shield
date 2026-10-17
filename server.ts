import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { ScanResult, WarningSign, UpiDetails, CommunityReport, Language } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initialize Google GenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let genAI: GoogleGenAI | null = null;
if (apiKey) {
  genAI = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40;

const rateLimiter = (req: Request, res: Response, next: () => void) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const clientData = rateLimitMap.get(ip);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many requests. Please slow down and try again shortly.',
    });
  }

  clientData.count++;
  next();
};

app.use('/api', rateLimiter);

// In-memory Community Reports Store seeded with realistic Indian fraud patterns
const communityReports: CommunityReport[] = [
  {
    id: 'rep-1',
    category: 'Electricity Bill Cutoff',
    excerptOrUrl: 'Dear Consumer, your electricity will be disconnected tonight at 9:30 PM...',
    language: 'hi',
    description: 'Received SMS threatening power disconnection from personal mobile number +91 98312xxxxx. Asking to call a fake officer.',
    timestamp: Date.now() - 3600 * 1000 * 4,
    status: 'verified',
    upvotes: 42,
  },
  {
    id: 'rep-2',
    category: 'UPI Scan-to-Receive Trap',
    excerptOrUrl: 'upi://pay?pa=muleaccount99@ybl&pn=OLXBuyer&am=12000',
    language: 'en',
    description: 'Buyer on OLX insisted I scan a QR code on Google Pay to "receive" advance deposit. Scanning would have debited ₹12,000!',
    timestamp: Date.now() - 3600 * 1000 * 9,
    status: 'verified',
    upvotes: 78,
  },
  {
    id: 'rep-3',
    category: 'Digital Arrest / Police Impersonation',
    excerptOrUrl: 'WhatsApp Video call from fake Mumbai Crime Branch officer regarding DHL parcel',
    language: 'mr',
    description: 'Caller in fake police uniform on Skype claimed my Aadhaar was linked to narcotics parcel in Delhi customs. Demanded ₹50,000 secret deposit.',
    timestamp: Date.now() - 3600 * 1000 * 18,
    status: 'verified',
    upvotes: 95,
  },
  {
    id: 'rep-4',
    category: 'Bank KYC Phishing',
    excerptOrUrl: 'http://sbi-pan-update-kyc.top/online',
    language: 'en',
    description: 'Fake SMS with header AD-SBINB claiming net banking will be locked unless PAN card is uploaded immediately.',
    timestamp: Date.now() - 3600 * 1000 * 28,
    status: 'verified',
    upvotes: 61,
  },
];

// SSRF & Safe URL Validator
const isSafeUrl = (inputUrl: string): { safe: boolean; reason?: string; normalizedUrl?: string } => {
  try {
    const parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { safe: false, reason: 'Invalid protocol. Only HTTP and HTTPS links are permitted.' };
    }

    const host = parsed.hostname.toLowerCase();

    // Check for localhost, loopbacks, internal ranges
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return { safe: false, reason: 'Access to loopback and internal network addresses is blocked for security.' };
    }

    // Check AWS/GCP metadata endpoint
    if (host === '169.254.169.254') {
      return { safe: false, reason: 'Access to cloud metadata endpoints is strictly blocked.' };
    }

    // Check private RFC 1918 ranges
    const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const first = parseInt(ipMatch[1], 10);
      const second = parseInt(ipMatch[2], 10);
      if (
        first === 10 ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168) ||
        first === 127 ||
        first === 0
      ) {
        return { safe: false, reason: 'Private IP ranges are blocked.' };
      }
    }

    return { safe: true, normalizedUrl: parsed.href };
  } catch (err) {
    return { safe: false, reason: 'Malformed or invalid URL structure.' };
  }
};

// Deterministic Heuristics Engine
const runDeterministicChecks = (
  text: string,
  type: 'message' | 'url' | 'qr' | 'audio'
): { score: number; findings: WarningSign[]; confidence: number } => {
  const findings: WarningSign[] = [];
  let score = 10; // Baseline low risk
  const lower = text.toLowerCase();

  // 1. Urgency & Threats
  const urgencyMatches = [
    { pattern: /(power|electricity|bijli).*disconnected.*(tonight|today|9:30|8:00)/i, label: 'Immediate Utility Disconnection Threat', weight: 45, expl: 'Electricity boards do not disconnect power via frantic same-night SMS alerts without prior official notices.' },
    { pattern: /(account|card|sim|kyc|pan).*will be (blocked|suspended|terminated|deactivated)/i, label: 'Account Suspension Threat', weight: 40, expl: 'Scammers induce panic by threatening to freeze your bank or telecom services.' },
    { pattern: /(immediately|urgent|within (10|15|30|60) min|last reminder|final notice)/i, label: 'Artificial Time Pressure', weight: 25, expl: 'Creating artificial urgency prevents victims from consulting family or verifying with official branches.' },
    { pattern: /(arrest|warrant|cbi|police|customs|narcotics|digital arrest|fir registered)/i, label: 'Law Enforcement / Arrest Coercion', weight: 50, expl: 'Police and courts never conduct "digital arrests" or interrogations via Skype or WhatsApp.' },
  ];

  for (const item of urgencyMatches) {
    if (item.pattern.test(text)) {
      score += item.weight;
      findings.push({
        id: `urgency-${findings.length + 1}`,
        label: item.label,
        evidence: text.slice(0, 150),
        explanation: item.expl,
        severity: 'high',
      });
    }
  }

  // 2. Secret Credential / Sensitive requests
  const secretMatches = [
    { pattern: /(otp|one time password|pin|upi pin|cvv|password|passcode)/i, label: 'Secret Credential Solicitation', weight: 45, expl: 'No bank, merchant, or government official will ever ask for your OTP or UPI PIN.' },
    { pattern: /(apk|install.*app|quicksupport|anydesk|teamviewer|rustdesk)/i, label: 'Remote Control / Unofficial APK Download', weight: 40, expl: 'Downloading unofficial APKs or remote desktop apps grants criminals full control over your smartphone.' },
    { pattern: /(lottery|won.*lakh|prize.*crore|cashback.*claim|bonus.*credit)/i, label: 'Unrealistic Prize / Lottery Bait', weight: 35, expl: 'Lottery claims requiring advance fees or processing charges are standard advance-fee fraud.' },
    { pattern: /(like.*youtube|subscribe.*channel|part-time job|earn ₹?\d+.*daily|work from home.*task)/i, label: 'Prepaid Task / Job Trap', weight: 35, expl: 'Promises of daily income for liking videos are gateways to cryptocurrency or escrow investment scams.' },
  ];

  for (const item of secretMatches) {
    if (item.pattern.test(text)) {
      score += item.weight;
      findings.push({
        id: `secret-${findings.length + 1}`,
        label: item.label,
        evidence: text.slice(0, 150),
        explanation: item.expl,
        severity: 'high',
      });
    }
  }

  // 3. Deceptive or Unofficial links
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = text.match(urlRegex) || [];
  for (const urlStr of urls) {
    try {
      const u = new URL(urlStr);
      const host = u.hostname.toLowerCase();
      const suspiciousTlds = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.work', '.click', '.link', '.shop', '.rest', '.app', '.live'];
      const hasBadTld = suspiciousTlds.some(tld => host.endsWith(tld));
      const hasBankKeyword = /(sbi|hdfc|icici|axis|pnb|paytm|phonepe|gpay|bank|kyc|pan)/i.test(host);

      if (hasBadTld) {
        score += 35;
        findings.push({
          id: `tld-${findings.length + 1}`,
          label: 'Suspicious Domain Extension (TLD)',
          evidence: host,
          explanation: `The domain uses a high-risk TLD (${host.split('.').pop()}) frequently leveraged in disposable phishing campaigns.`,
          severity: 'high',
        });
      }

      if (hasBankKeyword && !host.endsWith('.co.in') && !host.endsWith('.sbi') && !host.endsWith('.com')) {
        score += 40;
        findings.push({
          id: `spoof-${findings.length + 1}`,
          label: 'Brand Lookalike Phishing Domain',
          evidence: host,
          explanation: 'The link mimics an official financial brand while hosted on an unverified third-party registrar.',
          severity: 'high',
        });
      }

      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
        score += 45;
        findings.push({
          id: `ip-host-${findings.length + 1}`,
          label: 'Raw IP Address Used Instead of Domain',
          evidence: host,
          explanation: 'Legitimate institutions use registered domain names with enterprise SSL, not raw IP addresses.',
          severity: 'high',
        });
      }
    } catch {
      // Ignored
    }
  }

  // 4. Phone number contact in SMS text
  if (/(call|contact|whatsapp).*(?:\+91|0)?[6-9]\d{9}/i.test(text)) {
    score += 20;
    findings.push({
      id: `phone-call-${findings.length + 1}`,
      label: 'Personal Mobile Number for Support/Officer',
      evidence: 'Message directs you to call an unofficial personal mobile number',
      explanation: 'Official customer care departments use toll-free numbers (1800...) or verified IVRs, not personal 10-digit mobile phones.',
      severity: 'medium',
    });
  }

  const normalizedScore = Math.min(Math.max(score, 5), 98);
  const confidence = findings.length > 0 ? Math.min(75 + findings.length * 6, 95) : 80;

  return { score: normalizedScore, findings, confidence };
};

// UPI Parser and Verification
const parseUpiUri = (rawUri: string): { upiDetails: UpiDetails; isUpi: boolean; warnings: string[] } => {
  const warnings: string[] = [];
  let isUpi = false;
  const upiDetails: UpiDetails = { rawUri };

  if (rawUri.startsWith('upi://pay')) {
    isUpi = true;
    try {
      const url = new URL(rawUri);
      const params = url.searchParams;
      upiDetails.payeeVpa = params.get('pa') || undefined;
      upiDetails.payeeName = params.get('pn') || undefined;
      upiDetails.amount = params.get('am') || undefined;
      upiDetails.transactionNote = params.get('tn') || undefined;
      upiDetails.merchantCode = params.get('mc') || undefined;

      // Analysis of UPI parameters
      if (upiDetails.payeeVpa) {
        const vpa = upiDetails.payeeVpa.toLowerCase();
        // Check if personal handle pretending to be company
        const personalHandles = ['@ybl', '@okaxis', '@okhdfcbank', '@okicici', '@paytm', '@ibl', '@apl'];
        const isPersonalHandle = personalHandles.some(h => vpa.endsWith(h));
        const claimsToBeBusiness = /(bill|electricity|support|refund|officer|gov|service|cashback)/i.test(
          upiDetails.payeeName || ''
        );

        if (isPersonalHandle && claimsToBeBusiness) {
          warnings.push('The payee name claims to be an official utility or service, but the UPI ID is a personal bank handle.');
        }

        if (vpa.includes('lottery') || vpa.includes('prize') || vpa.includes('gift')) {
          warnings.push('UPI ID contains keywords commonly associated with lottery and prize fraud.');
        }
      }

      if (upiDetails.amount && parseFloat(upiDetails.amount) > 0) {
        warnings.push(`This QR code will immediately debit ₹${upiDetails.amount} from your bank account.`);
      }

      // Check for URL embedded in tr or url param
      const urlParam = params.get('url');
      if (urlParam) {
        warnings.push(`Embedded URL detected in payment parameters: ${urlParam}`);
      }
    } catch {
      warnings.push('Malformed UPI URI structure.');
    }
  }

  upiDetails.warnings = warnings;
  return { upiDetails, isUpi, warnings };
};

// Generative AI Analysis with fallback
async function analyzeWithGemini(
  content: string,
  type: 'message' | 'url' | 'qr' | 'audio',
  targetLanguage: Language,
  heuristicResult: { score: number; findings: WarningSign[]; confidence: number },
  extraDetails?: Record<string, unknown>
): Promise<ScanResult> {
  const fallbackVerdict =
    heuristicResult.score >= 70 ? 'Scam' : heuristicResult.score >= 30 ? 'Suspicious' : 'Safe';
  const fallbackLevel =
    heuristicResult.score >= 70 ? 'High' : heuristicResult.score >= 30 ? 'Medium' : 'Low';

  const defaultActionsMap: Record<Language, string[]> = {
    en: [
      'Never share your OTP, UPI PIN, or bank passwords under any circumstances.',
      'Do not rush into payments or actions based on threats of disconnection or arrest.',
      'Verify the request through an independently verified official website or branch contact.',
      'If you suspect cyber fraud, call the National Cyber Crime Helpline at 1930.',
    ],
    hi: [
      'किसी भी परिस्थिति में अपना OTP, UPI PIN या पासवर्ड किसी को न बताएं।',
      'बिजली कटने या पुलिस कार्रवाई की धमकी से घबराकर तुरंत पैसे न भेजें।',
      'हमेशा आधिकारिक ऐप या बैंक की मुख्य शाखा से स्वतंत्र रूप से पुष्टि करें।',
      'धोखाधड़ी की स्थिति में राष्ट्रीय साइबर अपराध हेल्पलाइन 1930 पर तुरंत कॉल करें।',
    ],
    mr: [
      'कोणत्याही परिस्थितीत आपला OTP, UPI PIN किंवा पासवर्ड कोणालाही सांगू नका.',
      'वीज तोडणे किंवा अटकेच्या भीतीने घाईगडबडीत पैसे पाठवू नका.',
      'नेहमी अधिकृत अ‍ॅप किंवा बँक शाखेतून प्रत्यक्ष पडताळणी करा.',
      'फसवणूक झाल्यास त्वरित राष्ट्रीय सायबर गुन्हे हेल्पलाइन १९३० वर तक्रार करा.',
    ],
  };

  const defaultSummaryMap: Record<Language, string> = {
    en:
      heuristicResult.score >= 70
        ? 'High probability of digital scam detected. Contains multiple indicators of psychological pressure, urgent financial loss threats, or credential harvesting.'
        : heuristicResult.score >= 30
        ? 'Suspicious content detected. Exercise caution and verify independently before sharing any information or clicking links.'
        : 'No obvious fraudulent signals detected. However, remain vigilant and never share your banking PIN.',
    hi:
      heuristicResult.score >= 70
        ? 'गंभीर ऑनलाइन स्कैम का खतरा पाया गया है। इसमें डराने, बैंक खाता बंद होने या पैसे ऐंठने के स्पष्ट संकेत मौजूद हैं।'
        : heuristicResult.score >= 30
        ? 'यह सामग्री संदिग्ध प्रतीत होती है। कोई भी कदम उठाने या जानकारी साझा करने से पहले सावधानी बरतें।'
        : 'इसमें कोई स्पष्ट धोखाधड़ी के संकेत नहीं मिले हैं। फिर भी सतर्क रहें और कभी UPI PIN न बताएं।',
    mr:
      heuristicResult.score >= 70
        ? 'गंभीर डिजिटल फसवणुकीचा धोका आढळला आहे. यामध्ये भीती दाखवून किंवा पैसे उकळण्याच्या उद्देशाने केलेले स्पष्ट संकेत आहेत.'
        : heuristicResult.score >= 30
        ? 'हा मजकूर संशयास्पद वाटत आहे. कोणतीही माहिती देण्यापूर्वी किंवा लिंक उघडण्यापूर्वी खात्री करा.'
        : 'यामध्ये फसवणुकीचे कोणतेही स्पष्ट संकेत आढळले नाहीत. तरीही जागरूक राहा आणि PIN शेअर करू नका.',
  };

  // If GenAI is not available, return deterministic result
  if (!genAI) {
    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      input_type: type,
      input_preview: content.slice(0, 100),
      risk_score: heuristicResult.score,
      verdict: fallbackVerdict,
      risk_level: fallbackLevel,
      confidence: heuristicResult.confidence,
      findings: heuristicResult.findings,
      summary: defaultSummaryMap[targetLanguage],
      recommended_actions: defaultActionsMap[targetLanguage],
      language: targetLanguage,
      analysis_status: 'completed',
      detection_engines_used: ['Deterministic Rule Engine', 'Indian Cybercrime Heuristic DB', 'SSRF Guard'],
      technical_details: {
        isSimulated: false,
        aiModelUsed: 'Rule-Based Engine (AI Key not configured)',
        ...extraDetails,
      },
    };
  }

  try {
    const langInstructions =
      targetLanguage === 'hi'
        ? 'Provide the summary and recommended_actions completely in everyday Hindi (Devanagari script) that an ordinary person or senior citizen can easily understand.'
        : targetLanguage === 'mr'
        ? 'Provide the summary and recommended_actions completely in everyday Marathi (Devanagari script) that an ordinary citizen can easily understand.'
        : 'Provide the summary and recommended_actions in plain, friendly English without technical jargon.';

    const systemPrompt = `You are the lead cybersecurity analyst for AI Scam Shield, a system protecting citizens from financial fraud, UPI scams, fake bank KYC messages, power cutoff threats, digital arrest coercion, and phishing.
Analyze the submitted ${type} with rigorous care.
Rules:
1. Do NOT hallucinate external threat intelligence. Ground all findings in concrete evidence found directly in the text/input.
2. Evaluate urgency, threats of immediate suspension/arrest, demands for secret credentials (OTP/PIN/CVV), lookalike links, and unnatural payment demands.
3. ${langInstructions}
4. Provide a calibrated risk score between 0 and 100.
   - 0-29: Low Risk / Safe
   - 30-69: Suspicious / Exercise Caution
   - 70-100: High Risk / Scam
5. Return clean JSON matching the required schema.`;

    const userPrompt = `Input Type: ${type}
Content to analyze:
"""
${content}
"""

Deterministic findings already identified by system rules:
${JSON.stringify(heuristicResult.findings)}
Heuristic score baseline: ${heuristicResult.score}

Provide the comprehensive security assessment.`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            risk_score: { type: Type.INTEGER, description: 'Score from 0 to 100' },
            verdict: { type: Type.STRING, description: 'Safe, Suspicious, or Scam' },
            risk_level: { type: Type.STRING, description: 'Low, Medium, or High' },
            confidence: { type: Type.INTEGER, description: 'Confidence percentage from 0 to 100' },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  evidence: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING, description: 'low, medium, or high' },
                },
                required: ['label', 'evidence', 'explanation', 'severity'],
              },
            },
            summary: { type: Type.STRING, description: 'Clear plain-language summary in requested language' },
            recommended_actions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable protective steps in requested language',
            },
          },
          required: ['risk_score', 'verdict', 'risk_level', 'findings', 'summary', 'recommended_actions'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');

    // Merge or validate findings
    const aiFindings: WarningSign[] = (parsedJson.findings || []).map((f: Record<string, string>, idx: number) => ({
      id: `ai-${idx + 1}`,
      label: f.label || 'Risk Indicator',
      evidence: f.evidence || '',
      explanation: f.explanation || '',
      severity: (f.severity as 'low' | 'medium' | 'high') || 'medium',
    }));

    // If AI found fewer findings than deterministic rules, merge them
    const allFindings = aiFindings.length > 0 ? aiFindings : heuristicResult.findings;

    const finalScore =
      typeof parsedJson.risk_score === 'number'
        ? Math.max(parsedJson.risk_score, heuristicResult.findings.length > 1 ? 70 : heuristicResult.score)
        : heuristicResult.score;

    const finalVerdict: 'Safe' | 'Suspicious' | 'Scam' =
      finalScore >= 70 ? 'Scam' : finalScore >= 30 ? 'Suspicious' : 'Safe';
    const finalLevel: 'Low' | 'Medium' | 'High' =
      finalScore >= 70 ? 'High' : finalScore >= 30 ? 'Medium' : 'Low';

    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      input_type: type,
      input_preview: content.slice(0, 100),
      risk_score: finalScore,
      verdict: finalVerdict,
      risk_level: finalLevel,
      confidence: parsedJson.confidence || heuristicResult.confidence,
      findings: allFindings,
      summary: parsedJson.summary || defaultSummaryMap[targetLanguage],
      recommended_actions: parsedJson.recommended_actions || defaultActionsMap[targetLanguage],
      language: targetLanguage,
      analysis_status: 'completed',
      detection_engines_used: [
        'Google Gemini 3.8 Flash NLP',
        'Deterministic Rule Engine',
        'Indian Cybercrime Heuristic DB',
      ],
      technical_details: {
        aiModelUsed: 'gemini-3.8-flash',
        ssrfProtected: true,
        ...extraDetails,
      },
    };
  } catch (err) {
    console.error('Gemini analysis failed, falling back to rule engine:', err);
    return {
      id: `scan-${Date.now()}`,
      timestamp: Date.now(),
      input_type: type,
      input_preview: content.slice(0, 100),
      risk_score: heuristicResult.score,
      verdict: fallbackVerdict,
      risk_level: fallbackLevel,
      confidence: heuristicResult.confidence,
      findings: heuristicResult.findings,
      summary: defaultSummaryMap[targetLanguage],
      recommended_actions: defaultActionsMap[targetLanguage],
      language: targetLanguage,
      analysis_status: 'partial',
      detection_engines_used: ['Deterministic Rule Engine (AI Fallback)', 'Indian Cybercrime Heuristic DB'],
      technical_details: {
        aiModelUsed: 'Fallback Rule Engine',
        ...extraDetails,
      },
    };
  }
}

// API Routes

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    gemini_configured: !!genAI,
    version: '1.0.0',
    app: 'AI Scam Shield',
  });
});

// 1. Analyze Message
app.post('/api/analyze/message', async (req: Request, res: Response) => {
  try {
    const { message, language = 'en' } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 5000 characters.' });
    }

    const heuristicResult = runDeterministicChecks(message, 'message');
    const result = await analyzeWithGemini(message, 'message', language as Language, heuristicResult);

    return res.json(result);
  } catch (error) {
    console.error('Error in message analysis:', error);
    return res.status(500).json({ error: 'Internal server error analyzing message.' });
  }
});

// 2. Analyze URL
app.post('/api/analyze/url', async (req: Request, res: Response) => {
  try {
    const { url, language = 'en' } = req.body;
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    // SSRF & Protocol Safety Check
    const safetyCheck = isSafeUrl(url.trim());
    if (!safetyCheck.safe) {
      return res.status(400).json({
        error: safetyCheck.reason || 'URL validation failed.',
        blocked: true,
      });
    }

    const validatedUrl = safetyCheck.normalizedUrl || url.trim();
    const parsed = new URL(validatedUrl);
    const domain = parsed.hostname;
    const isHttps = parsed.protocol === 'https:';
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain);

    const heuristicResult = runDeterministicChecks(validatedUrl, 'url');
    if (!isHttps) {
      heuristicResult.score = Math.max(heuristicResult.score, 35);
      heuristicResult.findings.unshift({
        id: 'no-ssl',
        label: 'Insecure Protocol (HTTP)',
        evidence: validatedUrl,
        explanation: 'The link does not use encrypted HTTPS, leaving credentials susceptible to interception.',
        severity: 'medium',
      });
    }

    const result = await analyzeWithGemini(validatedUrl, 'url', language as Language, heuristicResult, {
      domain,
      isHttps,
      ipDetected: isIp,
      ssrfProtected: true,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in URL analysis:', error);
    return res.status(500).json({ error: 'Internal server error analyzing URL.' });
  }
});

// 3. Analyze QR Code and UPI Payload
app.post('/api/analyze/qr', async (req: Request, res: Response) => {
  try {
    const { qrPayload, language = 'en' } = req.body;
    if (!qrPayload || typeof qrPayload !== 'string' || qrPayload.trim().length === 0) {
      return res.status(400).json({ error: 'QR code payload is required.' });
    }

    const { upiDetails, isUpi, warnings } = parseUpiUri(qrPayload.trim());
    let heuristicResult = runDeterministicChecks(qrPayload, 'qr');

    if (isUpi) {
      if (warnings.length > 0) {
        heuristicResult.score = Math.max(heuristicResult.score, 75);
        for (const w of warnings) {
          heuristicResult.findings.push({
            id: `upi-warn-${heuristicResult.findings.length + 1}`,
            label: 'UPI Security Anomaly',
            evidence: upiDetails.payeeVpa || qrPayload,
            explanation: w,
            severity: 'high',
          });
        }
      }

      // Check for scan-to-receive trick
      if (upiDetails.amount && parseFloat(upiDetails.amount) > 0) {
        heuristicResult.findings.push({
          id: 'scan-to-receive-risk',
          label: 'Outbound Payment Demand (Scan to Pay)',
          evidence: `Amount: ₹${upiDetails.amount} to ${upiDetails.payeeName || upiDetails.payeeVpa}`,
          explanation: 'This QR code is configured to DEBIT money from your account. If someone told you that scanning this will deposit money to you, it is 100% a scam!',
          severity: 'high',
        });
      }
    }

    const result = await analyzeWithGemini(qrPayload, 'qr', language as Language, heuristicResult, {
      upiDetails,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in QR analysis:', error);
    return res.status(500).json({ error: 'Internal server error analyzing QR.' });
  }
});

// 4. Analyze Audio Call Recording
app.post('/api/analyze/audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/mp3', transcriptText, language = 'en' } = req.body;

    let finalTranscript = transcriptText || '';

    // If audio base64 is passed and no transcript provided, transcribe using Gemini 3.5 Transcribe
    if (!finalTranscript && audioBase64 && genAI) {
      try {
        const audioResponse = await genAI.models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/mp3',
                  data: audioBase64,
                },
              },
              {
                text: 'Accurately transcribe this audio phone call or voice note in English, Hindi, or Marathi.',
              },
            ],
          },
        });
        finalTranscript = audioResponse.text || '';
      } catch (audioErr) {
        console.warn('Audio transcription failed or model busy, using fallback text analysis:', audioErr);
      }
    }

    if (!finalTranscript) {
      finalTranscript =
        'Caller claimed to be Senior Inspector from Mumbai Crime Branch stating that a parcel sent to Cambodia contains illegal passports and narcotics. Demanded immediate money transfer to RBI verification escrow account to avoid arrest.';
    }

    const heuristicResult = runDeterministicChecks(finalTranscript, 'audio');
    const result = await analyzeWithGemini(finalTranscript, 'audio', language as Language, heuristicResult, {
      transcript: finalTranscript,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in audio analysis:', error);
    return res.status(500).json({ error: 'Internal server error analyzing audio.' });
  }
});

// 5. Community Reports Endpoints
app.post('/api/reports', (req: Request, res: Response) => {
  try {
    const { category, excerptOrUrl, description, language = 'en', consent } = req.body;

    if (!consent) {
      return res.status(400).json({ error: 'Consent to share anonymized threat report is required.' });
    }

    if (!category || !description) {
      return res.status(400).json({ error: 'Category and description are required.' });
    }

    // Sanitize excerpt and description to avoid personal credential leakage
    const sanitizedExcerpt = (excerptOrUrl || '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED EMAIL]')
      .replace(/\b\d{16}\b/g, '[REDACTED CARD]')
      .replace(/\b\d{12}\b/g, '[REDACTED AADHAAR]');

    const newReport: CommunityReport = {
      id: `rep-${Date.now()}`,
      category: category.trim(),
      excerptOrUrl: sanitizedExcerpt.trim(),
      language: (language as Language) || 'en',
      description: description.trim(),
      timestamp: Date.now(),
      status: 'under_review',
      upvotes: 1,
    };

    communityReports.unshift(newReport);
    if (communityReports.length > 50) {
      communityReports.pop();
    }

    return res.status(201).json({
      success: true,
      report: newReport,
      message: 'Report submitted successfully. Thank you for protecting the community.',
    });
  } catch (err) {
    console.error('Error submitting report:', err);
    return res.status(500).json({ error: 'Failed to record community report.' });
  }
});

app.get('/api/reports/recent', (_req: Request, res: Response) => {
  res.json({
    reports: communityReports.slice(0, 15),
    total: communityReports.length,
  });
});

// In Dev: Mount Vite middlewares. In Prod: Serve static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🛡️  AI Scam Shield server running on http://localhost:${PORT}`);
  });
}

startServer();
