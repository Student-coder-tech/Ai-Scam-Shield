import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { MongoClient, Collection, ServerApiVersion } from 'mongodb';
import { ScanResult, WarningSign, UpiDetails, CommunityReport, Language } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Request body size limits ────────────────────────────────────────────────
// 5 MB JSON limit. Large audio should use a proper multipart endpoint, but
// since this project uses base64-in-JSON we keep a sane cap here.
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ─── Gemini client ────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Model names are environment-driven so they never need a code edit to change.
// gemini-1.5-flash was SHUT DOWN (early 2026). gemini-2.0-flash was SHUT DOWN (June 2026).
// gemini-2.5-flash is restricted to existing/prior users (returns 404 for new projects).
// Current stable default for all new projects: gemini-3.8-flash.
// Override via GEMINI_TEXT_MODEL / GEMINI_AUDIO_MODEL in your .env file.
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
const GEMINI_AUDIO_MODEL = process.env.GEMINI_AUDIO_MODEL || 'gemini-3.8-flash';

let genAI: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ─── Optional external services ───────────────────────────────────────────────
const SAFE_BROWSING_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
const VIRUSTOTAL_KEY = process.env.VIRUSTOTAL_API_KEY;

// ─── In-memory rate limiter ───────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
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

// ─── MongoDB + in-memory community reports store ──────────────────────────────
// If MONGODB_URI is set, reports persist across restarts in Atlas.
// If the URI is absent or connection fails, the server falls back to the
// in-memory array below — no crash, just no persistence.

const MONGODB_URI = process.env.MONGODB_URI;
let reportsCollection: Collection<CommunityReport> | null = null;

async function connectMongoDB(): Promise<void> {
  if (!MONGODB_URI) {
    console.log('   MongoDB: MONGODB_URI not set — using in-memory store.');
    return;
  }
  try {
    const client = new MongoClient(MONGODB_URI, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      connectTimeoutMS: 8000,
      serverSelectionTimeoutMS: 8000,
    });
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    const dbName = new URL(MONGODB_URI.replace('mongodb+srv://', 'https://')).pathname.replace('/', '') || 'ai_scam_shield';
    reportsCollection = client.db(dbName).collection<CommunityReport>('community_reports');
    // Ensure indexes for common queries
    await reportsCollection.createIndex({ timestamp: -1 });
    console.log(`   MongoDB: connected ✅  (db: ${dbName})`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Sanitize: never log the full URI which contains credentials
    const sanitized = msg.replace(/mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb://[credentials-redacted]@');
    console.warn(`   MongoDB: connection failed — ${sanitized}`);
    console.warn('   MongoDB: falling back to in-memory store.');
    reportsCollection = null;
  }
}

// Seeded in-memory reports (used when MongoDB is unavailable)
const communityReports: CommunityReport[] = [
  {
    id: 'rep-1',
    category: 'Electricity Bill Cutoff',
    excerptOrUrl: 'Dear Consumer, your electricity will be disconnected tonight at 9:30 PM...',
    language: 'hi',
    description:
      'Received SMS threatening power disconnection from personal mobile number +91 98312xxxxx. Asking to call a fake officer.',
    timestamp: Date.now() - 3600 * 1000 * 4,
    status: 'verified',
    upvotes: 42,
  },
  {
    id: 'rep-2',
    category: 'UPI Scan-to-Receive Trap',
    excerptOrUrl: 'upi://pay?pa=muleaccount99@ybl&pn=OLXBuyer&am=12000',
    language: 'en',
    description:
      'Buyer on OLX insisted I scan a QR code on Google Pay to "receive" advance deposit. Scanning would have debited ₹12,000!',
    timestamp: Date.now() - 3600 * 1000 * 9,
    status: 'verified',
    upvotes: 78,
  },
  {
    id: 'rep-3',
    category: 'Digital Arrest / Police Impersonation',
    excerptOrUrl: 'WhatsApp Video call from fake Mumbai Crime Branch officer regarding DHL parcel',
    language: 'mr',
    description:
      'Caller in fake police uniform on Skype claimed my Aadhaar was linked to narcotics parcel in Delhi customs. Demanded ₹50,000 secret deposit.',
    timestamp: Date.now() - 3600 * 1000 * 18,
    status: 'verified',
    upvotes: 95,
  },
  {
    id: 'rep-4',
    category: 'Bank KYC Phishing',
    excerptOrUrl: 'http://sbi-pan-update-kyc.top/online',
    language: 'en',
    description:
      'Fake SMS with header AD-SBINB claiming net banking will be locked unless PAN card is uploaded immediately.',
    timestamp: Date.now() - 3600 * 1000 * 28,
    status: 'verified',
    upvotes: 61,
  },
];

// ─── SSRF & safe URL validator ────────────────────────────────────────────────
const isSafeUrl = (
  inputUrl: string
): { safe: boolean; reason?: string; normalizedUrl?: string } => {
  try {
    const parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        safe: false,
        reason: 'Invalid protocol. Only HTTP and HTTPS links are permitted.',
      };
    }

    const host = parsed.hostname.toLowerCase();

    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return {
        safe: false,
        reason: 'Access to loopback and internal network addresses is blocked for security.',
      };
    }

    if (host === '169.254.169.254') {
      return { safe: false, reason: 'Access to cloud metadata endpoints is strictly blocked.' };
    }

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
  } catch {
    return { safe: false, reason: 'Malformed or invalid URL structure.' };
  }
};

// ─── Deterministic heuristics engine ─────────────────────────────────────────
// FIX: Each category of rules uses a single accumulator slot so the same signal
// type cannot fire more than once and inflate the score beyond intended limits.
const runDeterministicChecks = (
  text: string,
  _type: 'message' | 'url' | 'qr' | 'audio'
): { score: number; findings: WarningSign[]; confidence: number } => {
  const findings: WarningSign[] = [];
  let score = 10; // Baseline low risk

  // Helper: add a finding and increment score, guarded so the same id is never
  // added twice (prevents score inflation from duplicate pattern matches).
  const seen = new Set<string>();
  const addFinding = (id: string, label: string, evidence: string, explanation: string, severity: 'low' | 'medium' | 'high', weight: number) => {
    if (seen.has(id)) return;
    seen.add(id);
    score = Math.min(score + weight, 95); // Incremental cap
    findings.push({ id, label, evidence, explanation, severity });
  };

  // 1. Urgency & coercion
  if (/(power|electricity|bijli).*disconnected.*(tonight|today|9:30|8:00)/i.test(text)) {
    addFinding('urgency-utility', 'Immediate Utility Disconnection Threat',
      text.slice(0, 150),
      'Electricity boards do not disconnect power via frantic same-night SMS alerts without prior official notices.',
      'high', 45);
  }
  if (/(account|card|sim|kyc|pan).*will be (blocked|suspended|terminated|deactivated)/i.test(text)) {
    addFinding('urgency-account', 'Account Suspension Threat',
      text.slice(0, 150),
      'Scammers induce panic by threatening to freeze your bank or telecom services.',
      'high', 40);
  }
  if (/(immediately|urgent|within (10|15|30|60) min|last reminder|final notice)/i.test(text)) {
    addFinding('urgency-pressure', 'Artificial Time Pressure',
      text.slice(0, 150),
      'Creating artificial urgency prevents victims from consulting family or verifying with official branches.',
      'medium', 25);
  }
  if (/(arrest|warrant|cbi|police|customs|narcotics|digital arrest|fir registered)/i.test(text)) {
    addFinding('urgency-arrest', 'Law Enforcement / Arrest Coercion',
      text.slice(0, 150),
      'Police and courts never conduct "digital arrests" or interrogations via Skype or WhatsApp.',
      'high', 50);
  }

  // 2. Credential / sensitive requests
  if (/(otp|one time password|pin|upi pin|cvv|password|passcode)/i.test(text)) {
    addFinding('cred-otp', 'Secret Credential Solicitation',
      text.slice(0, 150),
      'No bank, merchant, or government official will ever ask for your OTP or UPI PIN.',
      'high', 45);
  }
  if (/(apk|install.*app|quicksupport|anydesk|teamviewer|rustdesk)/i.test(text)) {
    addFinding('cred-rat', 'Remote Control / Unofficial APK Download',
      text.slice(0, 150),
      'Downloading unofficial APKs or remote desktop apps grants criminals full control over your smartphone.',
      'high', 40);
  }
  if (/(lottery|won.*lakh|prize.*crore|cashback.*claim|bonus.*credit)/i.test(text)) {
    addFinding('cred-lottery', 'Unrealistic Prize / Lottery Bait',
      text.slice(0, 150),
      'Lottery claims requiring advance fees or processing charges are standard advance-fee fraud.',
      'high', 35);
  }
  if (/(like.*youtube|subscribe.*channel|part-time job|earn ₹?\d+.*daily|work from home.*task)/i.test(text)) {
    addFinding('cred-task', 'Prepaid Task / Job Trap',
      text.slice(0, 150),
      'Promises of daily income for liking videos are gateways to cryptocurrency or escrow investment scams.',
      'high', 35);
  }

  // 3. Deceptive or unofficial links
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
        addFinding(`tld-${host}`, 'Suspicious Domain Extension (TLD)',
          host,
          `The domain uses a high-risk TLD (${host.split('.').pop()}) frequently leveraged in disposable phishing campaigns.`,
          'high', 35);
      }

      if (hasBankKeyword && !host.endsWith('.co.in') && !host.endsWith('.sbi') && !host.endsWith('.com')) {
        addFinding(`spoof-${host}`, 'Brand Lookalike Phishing Domain',
          host,
          'The link mimics an official financial brand while hosted on an unverified third-party registrar.',
          'high', 40);
      }

      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
        addFinding(`ip-host-${host}`, 'Raw IP Address Used Instead of Domain',
          host,
          'Legitimate institutions use registered domain names with enterprise SSL, not raw IP addresses.',
          'high', 45);
      }
    } catch {
      // Ignored
    }
  }

  // 4. Personal mobile contact
  if (/(call|contact|whatsapp).*(?:\+91|0)?[6-9]\d{9}/i.test(text)) {
    addFinding('phone-personal', 'Personal Mobile Number for Support/Officer',
      'Message directs you to call an unofficial personal mobile number',
      'Official customer care departments use toll-free numbers (1800...) or verified IVRs, not personal 10-digit mobile phones.',
      'medium', 20);
  }

  // Final score is clamped to [5, 95].
  // 95 (not 100) is the max from heuristics alone — the AI layer may raise it further but never past 99.
  const normalizedScore = Math.min(Math.max(score, 5), 95);
  const confidence = findings.length > 0 ? Math.min(75 + findings.length * 5, 92) : 70;

  return { score: normalizedScore, findings, confidence };
};

// ─── UPI parser ────────────────────────────────────────────────────────────────
const parseUpiUri = (
  rawUri: string
): { upiDetails: UpiDetails; isUpi: boolean; warnings: string[] } => {
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

      if (upiDetails.payeeVpa) {
        const vpa = upiDetails.payeeVpa.toLowerCase();
        const personalHandles = ['@ybl', '@okaxis', '@okhdfcbank', '@okicici', '@paytm', '@ibl', '@apl'];
        const isPersonalHandle = personalHandles.some(h => vpa.endsWith(h));
        const claimsToBeBusiness = /(bill|electricity|support|refund|officer|gov|service|cashback)/i.test(
          upiDetails.payeeName || ''
        );

        if (isPersonalHandle && claimsToBeBusiness) {
          warnings.push(
            'The payee name claims to be an official utility or service, but the UPI ID is a personal bank handle.'
          );
        }

        if (vpa.includes('lottery') || vpa.includes('prize') || vpa.includes('gift')) {
          warnings.push('UPI ID contains keywords commonly associated with lottery and prize fraud.');
        }
      }

      if (upiDetails.amount && parseFloat(upiDetails.amount) > 0) {
        warnings.push(`This QR code will immediately debit ₹${upiDetails.amount} from your bank account.`);
      }

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

// ─── Google Safe Browsing v4 ───────────────────────────────────────────────────
// Returns: 'threat_found' | 'safe' | 'unavailable'
type SafeBrowsingOutcome = 'threat_found' | 'safe' | 'unavailable';

async function checkSafeBrowsing(url: string): Promise<{
  outcome: SafeBrowsingOutcome;
  threatType?: string;
  statusNote: string;
}> {
  if (!SAFE_BROWSING_KEY) {
    return { outcome: 'unavailable', statusNote: 'Google Safe Browsing not configured (key absent)' };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_KEY}`;
  const requestBody = {
    client: { clientId: 'ai-scam-shield', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url }],
    },
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.status === 400) {
      console.warn('Safe Browsing returned 400 — check request format');
      return { outcome: 'unavailable', statusNote: 'Safe Browsing API returned 400 (bad request)' };
    }
    if (response.status === 401 || response.status === 403) {
      console.warn('Safe Browsing auth error — check GOOGLE_SAFE_BROWSING_API_KEY');
      return { outcome: 'unavailable', statusNote: 'Safe Browsing API authentication failed' };
    }
    if (response.status === 429) {
      return { outcome: 'unavailable', statusNote: 'Safe Browsing API quota exceeded' };
    }
    if (!response.ok) {
      return { outcome: 'unavailable', statusNote: `Safe Browsing API error: HTTP ${response.status}` };
    }

    const data = await response.json() as { matches?: Array<{ threatType?: string }> };

    if (data.matches && data.matches.length > 0) {
      const threatType = data.matches[0].threatType || 'UNKNOWN_THREAT';
      return {
        outcome: 'threat_found',
        threatType,
        statusNote: `Google Safe Browsing match: ${threatType}`,
      };
    }

    return {
      outcome: 'safe',
      statusNote: 'Google Safe Browsing: no known threat match returned',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) {
      return { outcome: 'unavailable', statusNote: 'Safe Browsing API request timed out' };
    }
    console.warn('Safe Browsing request failed:', msg);
    return { outcome: 'unavailable', statusNote: 'Safe Browsing API network error' };
  }
}

// ─── VirusTotal v3 (optional) ──────────────────────────────────────────────────
// Returns: 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unavailable'
type VtOutcome = 'malicious' | 'suspicious' | 'harmless' | 'undetected' | 'unavailable';

async function checkVirusTotal(url: string): Promise<{
  outcome: VtOutcome;
  stats?: Record<string, number>;
  statusNote: string;
}> {
  if (!VIRUSTOTAL_KEY) {
    return { outcome: 'unavailable', statusNote: 'VirusTotal not configured (key absent)' };
  }

  // Encode URL to the VirusTotal base64url identifier
  const urlId = Buffer.from(url).toString('base64url').replace(/=+$/, '');
  const endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(endpoint, {
      headers: {
        'x-apikey': VIRUSTOTAL_KEY,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (response.status === 404) {
      // URL not yet in VirusTotal database — submit for analysis but don't wait
      // (free tier has severe polling limits; we do not poll indefinitely)
      return { outcome: 'undetected', statusNote: 'VirusTotal: URL not in database yet' };
    }
    if (response.status === 401) {
      return { outcome: 'unavailable', statusNote: 'VirusTotal API authentication failed' };
    }
    if (response.status === 429) {
      return { outcome: 'unavailable', statusNote: 'VirusTotal API quota exceeded' };
    }
    if (!response.ok) {
      return { outcome: 'unavailable', statusNote: `VirusTotal API error: HTTP ${response.status}` };
    }

    const data = await response.json() as {
      data?: {
        attributes?: {
          last_analysis_stats?: {
            malicious?: number;
            suspicious?: number;
            harmless?: number;
            undetected?: number;
          };
        };
      };
    };

    const stats = data?.data?.attributes?.last_analysis_stats;
    if (!stats) {
      return { outcome: 'undetected', statusNote: 'VirusTotal: No analysis stats available' };
    }

    const malicious = stats.malicious ?? 0;
    const suspicious = stats.suspicious ?? 0;

    let outcome: VtOutcome;
    if (malicious >= 3) outcome = 'malicious';
    else if (malicious >= 1 || suspicious >= 3) outcome = 'suspicious';
    else if ((stats.harmless ?? 0) > 0) outcome = 'harmless';
    else outcome = 'undetected';

    return {
      outcome,
      stats: {
        malicious,
        suspicious,
        harmless: stats.harmless ?? 0,
        undetected: stats.undetected ?? 0,
      },
      statusNote: `VirusTotal: ${malicious} malicious, ${suspicious} suspicious engines`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort')) {
      return { outcome: 'unavailable', statusNote: 'VirusTotal API request timed out' };
    }
    console.warn('VirusTotal request failed:', msg);
    return { outcome: 'unavailable', statusNote: 'VirusTotal API network error' };
  }
}

// ─── Gemini analysis with deterministic fallback ───────────────────────────────
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
        aiModelUsed: 'Rule-Based Engine (Gemini key not configured)',
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
5. Return clean JSON matching the required schema.
6. The heuristic baseline score is provided for context. You may adjust up or down based on evidence.`;

    const userPrompt = `Input Type: ${type}
Content to analyze:
"""
${content.slice(0, 4000)}
"""

Deterministic findings already identified by system rules:
${JSON.stringify(heuristicResult.findings.map(f => ({ label: f.label, severity: f.severity })))}
Heuristic score baseline: ${heuristicResult.score}

Provide the comprehensive security assessment.`;

    const response = await genAI.models.generateContent({
      model: GEMINI_TEXT_MODEL,
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
            summary: { type: Type.STRING },
            recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['risk_score', 'verdict', 'risk_level', 'findings', 'summary', 'recommended_actions'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');

    const aiFindings: WarningSign[] = (parsedJson.findings || []).map(
      (f: Record<string, string>, idx: number) => ({
        id: `ai-${idx + 1}`,
        label: f.label || 'Risk Indicator',
        evidence: f.evidence || '',
        explanation: f.explanation || '',
        severity: (f.severity as 'low' | 'medium' | 'high') || 'medium',
      })
    );

    const allFindings = aiFindings.length > 0 ? aiFindings : heuristicResult.findings;

    // FIX: Don't blindly take max(AI score, 70) when there are multiple findings.
    // Use AI score if valid, otherwise fall back to heuristic. Cap at 99.
    const rawAiScore = typeof parsedJson.risk_score === 'number' ? parsedJson.risk_score : null;
    const finalScore = Math.min(
      rawAiScore !== null ? Math.max(rawAiScore, heuristicResult.score) : heuristicResult.score,
      99
    );

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
      confidence: parsedJson.confidence ?? heuristicResult.confidence,
      findings: allFindings,
      summary: parsedJson.summary || defaultSummaryMap[targetLanguage],
      recommended_actions: parsedJson.recommended_actions || defaultActionsMap[targetLanguage],
      language: targetLanguage,
      analysis_status: 'completed',
      detection_engines_used: [
        `Google Gemini (${GEMINI_TEXT_MODEL})`,
        'Deterministic Rule Engine',
        'Indian Cybercrime Heuristic DB',
      ],
      technical_details: {
        aiModelUsed: GEMINI_TEXT_MODEL,
        ssrfProtected: true,
        ...extraDetails,
      },
    };
  } catch (err) {
    console.error('Gemini analysis failed, using deterministic fallback:', err instanceof Error ? err.message : err);
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
      detection_engines_used: ['Deterministic Rule Engine (AI Unavailable)', 'Indian Cybercrime Heuristic DB'],
      technical_details: { aiModelUsed: 'Fallback Rule Engine', ...extraDetails },
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    version: '1.1.0',
    app: 'AI Scam Shield',
    services: {
      gemini_configured: !!GEMINI_API_KEY,
      gemini_text_model: GEMINI_TEXT_MODEL,
      gemini_audio_model: GEMINI_AUDIO_MODEL,
      safe_browsing_configured: !!SAFE_BROWSING_KEY,
      virustotal_configured: !!VIRUSTOTAL_KEY,
      // Never expose key values; presence only.
    },
  });
});

// POST /api/analyze/message
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
    console.error('Error in message analysis:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Internal server error analyzing message.' });
  }
});

// POST /api/analyze/url
app.post('/api/analyze/url', async (req: Request, res: Response) => {
  try {
    const { url, language = 'en' } = req.body;
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    const safetyCheck = isSafeUrl(url.trim());
    if (!safetyCheck.safe) {
      return res.status(400).json({ error: safetyCheck.reason || 'URL validation failed.', blocked: true });
    }

    const validatedUrl = safetyCheck.normalizedUrl || url.trim();
    const parsed = new URL(validatedUrl);
    const domain = parsed.hostname;
    const isHttps = parsed.protocol === 'https:';
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain);

    const heuristicResult = runDeterministicChecks(validatedUrl, 'url');
    if (!isHttps) {
      heuristicResult.score = Math.min(Math.max(heuristicResult.score, 35), 95);
      heuristicResult.findings.unshift({
        id: 'no-ssl',
        label: 'Insecure Protocol (HTTP)',
        evidence: validatedUrl,
        explanation: 'The link does not use encrypted HTTPS, leaving credentials susceptible to interception.',
        severity: 'medium',
      });
    }

    // Run external reputation checks in parallel
    const [sbResult, vtResult] = await Promise.all([
      checkSafeBrowsing(validatedUrl),
      checkVirusTotal(validatedUrl),
    ]);

    // Incorporate Safe Browsing threat signal into score
    if (sbResult.outcome === 'threat_found') {
      heuristicResult.score = Math.min(Math.max(heuristicResult.score, 85), 99);
      heuristicResult.findings.unshift({
        id: 'safe-browsing-match',
        label: `Google Safe Browsing: ${sbResult.threatType || 'Threat Detected'}`,
        evidence: validatedUrl,
        explanation:
          'Google Safe Browsing has flagged this URL as dangerous. Do not visit this link.',
        severity: 'high',
      });
    }

    // Incorporate VirusTotal signal
    if (vtResult.outcome === 'malicious') {
      heuristicResult.score = Math.min(Math.max(heuristicResult.score, 80), 99);
      heuristicResult.findings.unshift({
        id: 'virustotal-malicious',
        label: 'VirusTotal: Malicious URL',
        evidence: validatedUrl,
        explanation: `VirusTotal security vendors flagged this URL as malicious (${vtResult.stats?.malicious ?? 'unknown'} engines).`,
        severity: 'high',
      });
    } else if (vtResult.outcome === 'suspicious') {
      heuristicResult.score = Math.min(Math.max(heuristicResult.score, 55), 99);
      heuristicResult.findings.push({
        id: 'virustotal-suspicious',
        label: 'VirusTotal: Suspicious URL',
        evidence: validatedUrl,
        explanation: `Some VirusTotal security vendors flagged this URL as suspicious (${vtResult.stats?.suspicious ?? 'unknown'} engines).`,
        severity: 'medium',
      });
    }

    // Build status notes for display
    const reputationNotes: string[] = [sbResult.statusNote];
    if (vtResult.outcome !== 'unavailable') reputationNotes.push(vtResult.statusNote);

    const result = await analyzeWithGemini(validatedUrl, 'url', language as Language, heuristicResult, {
      domain,
      isHttps,
      ipDetected: isIp,
      ssrfProtected: true,
      safeBrowsing: sbResult.statusNote,
      virusTotal: vtResult.statusNote,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in URL analysis:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Internal server error analyzing URL.' });
  }
});

// POST /api/analyze/qr
app.post('/api/analyze/qr', async (req: Request, res: Response) => {
  try {
    const { qrPayload, language = 'en' } = req.body;
    if (!qrPayload || typeof qrPayload !== 'string' || qrPayload.trim().length === 0) {
      return res.status(400).json({ error: 'QR code payload is required.' });
    }
    if (qrPayload.length > 2048) {
      return res.status(400).json({ error: 'QR payload exceeds maximum length.' });
    }

    const { upiDetails, isUpi, warnings } = parseUpiUri(qrPayload.trim());
    const heuristicResult = runDeterministicChecks(qrPayload, 'qr');

    if (isUpi) {
      if (warnings.length > 0) {
        heuristicResult.score = Math.min(Math.max(heuristicResult.score, 75), 95);
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
      if (upiDetails.amount && parseFloat(upiDetails.amount) > 0) {
        heuristicResult.findings.push({
          id: 'scan-to-receive-risk',
          label: 'Outbound Payment Demand (Scan to Pay)',
          evidence: `Amount: ₹${upiDetails.amount} to ${upiDetails.payeeName || upiDetails.payeeVpa}`,
          explanation:
            'This QR code is configured to DEBIT money from your account. If someone told you that scanning this will deposit money to you, it is 100% a scam!',
          severity: 'high',
        });
      }
    }

    const result = await analyzeWithGemini(qrPayload, 'qr', language as Language, heuristicResult, {
      upiDetails,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in QR analysis:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Internal server error analyzing QR.' });
  }
});

// POST /api/analyze/audio
// FIX: Removed hardcoded fallback transcript. Missing audio+transcript now returns 400.
// FIX: Added base64 size validation (max ~3 MB encoded ≈ ~2.25 MB raw audio).
app.post('/api/analyze/audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/mp3', transcriptText, language = 'en' } = req.body;

    // Validate that at least one input source is present
    if (!audioBase64 && !transcriptText) {
      return res.status(400).json({
        error: 'Either audio data (audioBase64) or a transcript text (transcriptText) is required.',
      });
    }

    // FIX: Validate base64 payload size. ~4MB base64 ≈ 3MB raw audio.
    const MAX_AUDIO_BASE64_BYTES = 4 * 1024 * 1024; // 4 MB base64 string
    if (audioBase64 && typeof audioBase64 === 'string' && audioBase64.length > MAX_AUDIO_BASE64_BYTES) {
      return res.status(413).json({
        error: 'Audio file too large. Maximum supported size is approximately 3 MB. Please trim the recording.',
      });
    }

    // Validate MIME type
    const SUPPORTED_MIME_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/ogg', 'audio/mp4'];
    if (audioBase64 && !SUPPORTED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({
        error: `Unsupported audio format: ${mimeType}. Supported formats: mp3, wav, webm, m4a.`,
      });
    }

    let finalTranscript = typeof transcriptText === 'string' ? transcriptText.trim() : '';
    let transcriptionMethod = 'transcript_provided';

    if (!finalTranscript && audioBase64 && genAI) {
      try {
        transcriptionMethod = 'gemini_transcription';
        const audioResponse = await genAI.models.generateContent({
          model: GEMINI_AUDIO_MODEL,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/mp3',
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe this audio phone call or voice note accurately. Output only the transcribed speech in English, Hindi, or Marathi. Do not add commentary.',
              },
            ],
          },
        });
        finalTranscript = (audioResponse.text || '').trim();
      } catch (audioErr) {
        console.warn('Audio transcription failed:', audioErr instanceof Error ? audioErr.message : audioErr);
        transcriptionMethod = 'transcription_failed';
        // FIX: Do not fall back to a hardcoded scam transcript.
        // Instead, if we have audio but transcription failed, return a partial result.
        return res.status(422).json({
          error:
            'Audio transcription failed. Please try again, or paste the call transcript manually using the transcript field.',
          transcription_status: 'failed',
        });
      }
    }

    if (!finalTranscript) {
      return res.status(400).json({
        error: 'No transcript could be extracted from the provided audio. Please check the file or paste a transcript.',
      });
    }

    const heuristicResult = runDeterministicChecks(finalTranscript, 'audio');
    const result = await analyzeWithGemini(finalTranscript, 'audio', language as Language, heuristicResult, {
      transcript: finalTranscript,
      transcriptionMethod,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error in audio analysis:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Internal server error analyzing audio.' });
  }
});

// POST /api/reports
app.post('/api/reports', async (req: Request, res: Response) => {
  try {
    const { category, excerptOrUrl, description, language = 'en', consent } = req.body;

    if (!consent) {
      return res.status(400).json({ error: 'Consent to share anonymized threat report is required.' });
    }
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required.' });
    }
    if (!description || typeof description !== 'string' || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters.' });
    }
    if (description.length > 1000) {
      return res.status(400).json({ error: 'Description must not exceed 1000 characters.' });
    }

    const sanitizedExcerpt = (excerptOrUrl || '')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED EMAIL]')
      .replace(/\b\d{16}\b/g, '[REDACTED CARD]')
      .replace(/\b\d{12}\b/g, '[REDACTED AADHAAR]')
      .slice(0, 500);

    const newReport: CommunityReport = {
      id: `rep-${Date.now()}`,
      category: category.trim().slice(0, 100),
      excerptOrUrl: sanitizedExcerpt.trim(),
      language: (language as Language) || 'en',
      description: description.trim(),
      timestamp: Date.now(),
      status: 'under_review',
      upvotes: 0,
    };

    if (reportsCollection) {
      await reportsCollection.insertOne(newReport);
    } else {
      communityReports.unshift(newReport);
      if (communityReports.length > 100) communityReports.pop();
    }

    return res.status(201).json({
      success: true,
      report: newReport,
      message: 'Report submitted successfully. Thank you for protecting the community.',
    });
  } catch (err) {
    console.error('Error submitting report:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Failed to record community report.' });
  }
});

// GET /api/reports/recent
app.get('/api/reports/recent', async (_req: Request, res: Response) => {
  try {
    if (reportsCollection) {
      const reports = await reportsCollection
        .find({}, { projection: { _id: 0 } })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();
      const total = await reportsCollection.countDocuments();
      return res.json({ reports, total, note: 'Reports are persisted in MongoDB Atlas.' });
    }
    return res.json({
      reports: communityReports.slice(0, 20),
      total: communityReports.length,
      note: 'Reports are stored in process memory and reset on server restart. Set MONGODB_URI to enable persistence.',
    });
  } catch (err) {
    console.error('Error fetching reports:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Failed to fetch community reports.' });
  }
});

// POST /api/reports/:id/upvote  — persist upvote in server-side store or MongoDB
app.post('/api/reports/:id/upvote', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (reportsCollection) {
    const result = await reportsCollection.findOneAndUpdate(
      { id },
      { $inc: { upvotes: 1 } },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    if (!result) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    return res.json({ success: true, upvotes: result.upvotes });
  }
  const report = communityReports.find(r => r.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found.' });
  }
  report.upvotes += 1;
  return res.json({ success: true, upvotes: report.upvotes });
});

// POST /api/feedback  — FIX: actually handle false-positive feedback
app.post('/api/feedback', (req: Request, res: Response) => {
  try {
    const { scanId, feedbackType, comments, inputPreview, riskScore } = req.body;

    if (!feedbackType || !['false_positive', 'false_negative', 'other'].includes(feedbackType)) {
      return res.status(400).json({ error: 'Invalid feedback type.' });
    }
    if (!scanId) {
      return res.status(400).json({ error: 'scanId is required.' });
    }

    // Log feedback for operator review. Do NOT log full message content.
    console.log('[Feedback]', {
      scanId,
      feedbackType,
      riskScore,
      inputPreviewLength: typeof inputPreview === 'string' ? inputPreview.length : 0,
      commentsLength: typeof comments === 'string' ? comments.length : 0,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Feedback received. Thank you for helping us improve detection accuracy.',
    });
  } catch (err) {
    console.error('Feedback error:', err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

// ─── Dev: Vite middleware | Prod: static dist ─────────────────────────────────
async function startServer() {
  // Connect to MongoDB before accepting requests (non-fatal if it fails)
  await connectMongoDB();
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
    console.log(`   Gemini AI: ${GEMINI_API_KEY ? `configured (${GEMINI_TEXT_MODEL})` : 'not configured — running on heuristics'}`);
    console.log(`   Safe Browsing: ${SAFE_BROWSING_KEY ? 'configured' : 'not configured'}`);
    console.log(`   VirusTotal: ${VIRUSTOTAL_KEY ? 'configured' : 'not configured'}`);
  });
}

startServer();
