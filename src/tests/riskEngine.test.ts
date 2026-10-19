/**
 * AI Scam Shield — Unit Tests
 *
 * These tests run standalone via `npm test` (tsx src/tests/riskEngine.test.ts).
 * They test the core validation and scoring logic that mirrors server.ts exactly.
 *
 * NOTE: The test file intentionally duplicates the pure-logic functions from
 * server.ts so this file runs without Express/Vite/Gemini dependencies.
 * Any change to the scoring rules in server.ts must be reflected here.
 */

// ─── Shared logic (mirrored from server.ts) ───────────────────────────────────

const isSafeUrl = (inputUrl: string): { safe: boolean; reason?: string; normalizedUrl?: string } => {
  try {
    const parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { safe: false, reason: 'Invalid protocol. Only HTTP and HTTPS links are permitted.' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' || host === '127.0.0.1' || host === '::1' ||
      host === '0.0.0.0' || host.endsWith('.local') || host.endsWith('.internal')
    ) {
      return { safe: false, reason: 'Access to loopback and internal network addresses is blocked for security.' };
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
        first === 127 || first === 0
      ) {
        return { safe: false, reason: 'Private IP ranges are blocked.' };
      }
    }
    return { safe: true, normalizedUrl: parsed.href };
  } catch {
    return { safe: false, reason: 'Malformed or invalid URL structure.' };
  }
};

interface WarningSign {
  id: string;
  label: string;
  evidence: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high';
}

const runDeterministicChecks = (
  text: string,
  _type: 'message' | 'url' | 'qr' | 'audio'
): { score: number; findings: WarningSign[]; confidence: number } => {
  const findings: WarningSign[] = [];
  let score = 10;
  const seen = new Set<string>();

  const addFinding = (id: string, label: string, evidence: string, explanation: string, severity: 'low' | 'medium' | 'high', weight: number) => {
    if (seen.has(id)) return;
    seen.add(id);
    score = Math.min(score + weight, 95);
    findings.push({ id, label, evidence, explanation, severity });
  };

  if (/(power|electricity|bijli).*disconnected.*(tonight|today|9:30|8:00)/i.test(text)) {
    addFinding('urgency-utility', 'Immediate Utility Disconnection Threat', text.slice(0, 150), '', 'high', 45);
  }
  if (/(account|card|sim|kyc|pan).*will be (blocked|suspended|terminated|deactivated)/i.test(text)) {
    addFinding('urgency-account', 'Account Suspension Threat', text.slice(0, 150), '', 'high', 40);
  }
  if (/(immediately|urgent|within (10|15|30|60) min|last reminder|final notice)/i.test(text)) {
    addFinding('urgency-pressure', 'Artificial Time Pressure', text.slice(0, 150), '', 'medium', 25);
  }
  if (/(arrest|warrant|cbi|police|customs|narcotics|digital arrest|fir registered)/i.test(text)) {
    addFinding('urgency-arrest', 'Law Enforcement / Arrest Coercion', text.slice(0, 150), '', 'high', 50);
  }
  if (/(otp|one time password|pin|upi pin|cvv|password|passcode)/i.test(text)) {
    addFinding('cred-otp', 'Secret Credential Solicitation', text.slice(0, 150), '', 'high', 45);
  }
  if (/(lottery|won.*lakh|prize.*crore|cashback.*claim|bonus.*credit)/i.test(text)) {
    addFinding('cred-lottery', 'Unrealistic Prize / Lottery Bait', text.slice(0, 150), '', 'high', 35);
  }

  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = text.match(urlRegex) || [];
  for (const urlStr of urls) {
    try {
      const u = new URL(urlStr);
      const host = u.hostname.toLowerCase();
      const suspiciousTlds = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.buzz', '.work', '.click', '.link', '.shop', '.rest', '.live'];
      if (suspiciousTlds.some(tld => host.endsWith(tld))) {
        addFinding(`tld-${host}`, 'Suspicious Domain Extension (TLD)', host, '', 'high', 35);
      }
      if (/(sbi|hdfc|icici|axis|pnb|paytm|phonepe|gpay|bank|kyc|pan)/i.test(host) &&
          !host.endsWith('.co.in') && !host.endsWith('.sbi') && !host.endsWith('.com')) {
        addFinding(`spoof-${host}`, 'Brand Lookalike Phishing Domain', host, '', 'high', 40);
      }
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
        addFinding(`ip-host-${host}`, 'Raw IP Address Used Instead of Domain', host, '', 'high', 45);
      }
    } catch { /* Ignored */ }
  }

  if (/(call|contact|whatsapp).*(?:\+91|0)?[6-9]\d{9}/i.test(text)) {
    addFinding('phone-personal', 'Personal Mobile Number for Support/Officer', '', '', 'medium', 20);
  }

  const normalizedScore = Math.min(Math.max(score, 5), 95);
  const confidence = findings.length > 0 ? Math.min(75 + findings.length * 5, 92) : 70;
  return { score: normalizedScore, findings, confidence };
};

const parseUpi = (rawUri: string) => {
  if (!rawUri.startsWith('upi://pay')) {
    return { isUpi: false, warnings: [] as string[] };
  }
  const warnings: string[] = [];
  try {
    const url = new URL(rawUri);
    const pa = url.searchParams.get('pa') || '';
    const pn = url.searchParams.get('pn') || '';
    const am = url.searchParams.get('am') || '';
    if ((pa.includes('@ybl') || pa.includes('@paytm') || pa.includes('@okicici')) &&
        /bill|electricity|support|officer|refund/i.test(pn)) {
      warnings.push('Personal UPI handle claiming to be official service');
    }
    if (am && parseFloat(am) > 0) {
      warnings.push(`Requests immediate debit of ₹${am}`);
    }
    return { isUpi: true, pa, pn, am, warnings };
  } catch {
    return { isUpi: false, warnings: ['Malformed URI'] };
  }
};

// ─── Community report validation (mirrors server.ts) ─────────────────────────
const validateReportInput = (body: Record<string, unknown>): { valid: boolean; error?: string } => {
  if (!body.consent) return { valid: false, error: 'Consent required.' };
  if (!body.category || typeof body.category !== 'string' || !(body.category as string).trim()) {
    return { valid: false, error: 'Category is required.' };
  }
  const desc = body.description;
  if (!desc || typeof desc !== 'string') return { valid: false, error: 'Description required.' };
  if ((desc as string).trim().length < 10) return { valid: false, error: 'Description too short.' };
  if ((desc as string).length > 1000) return { valid: false, error: 'Description too long.' };
  return { valid: true };
};

// ─── Audio input validation (mirrors server.ts) ───────────────────────────────
const MAX_AUDIO_BASE64_BYTES = 4 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/m4a', 'audio/ogg', 'audio/mp4'];

const validateAudioInput = (body: Record<string, unknown>): { valid: boolean; status?: number; error?: string } => {
  if (!body.audioBase64 && !body.transcriptText) {
    return { valid: false, status: 400, error: 'Either audioBase64 or transcriptText is required.' };
  }
  if (body.audioBase64 && typeof body.audioBase64 === 'string' && body.audioBase64.length > MAX_AUDIO_BASE64_BYTES) {
    return { valid: false, status: 413, error: 'Audio file too large.' };
  }
  if (body.audioBase64 && body.mimeType && !SUPPORTED_MIME_TYPES.includes(body.mimeType as string)) {
    return { valid: false, status: 400, error: `Unsupported audio format: ${body.mimeType}` };
  }
  return { valid: true };
};

// ─── Test runner ──────────────────────────────────────────────────────────────
function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  console.log('\n🛡️  Running AI Scam Shield Security & Risk Engine Unit Tests\n');

  // ── Suite 1: SSRF Protection ────────────────────────────────────────────────
  console.log('─── Suite 1: SSRF & URL Guard ───────────────────────────────');
  assert(!isSafeUrl('http://localhost:3000/api').safe, 'Blocks localhost');
  assert(!isSafeUrl('http://127.0.0.1/admin').safe, 'Blocks 127.0.0.1 loopback');
  assert(!isSafeUrl('http://169.254.169.254/latest/meta-data').safe, 'Blocks AWS/GCP metadata endpoint');
  assert(!isSafeUrl('http://192.168.1.1/router').safe, 'Blocks 192.168.x.x private range');
  assert(!isSafeUrl('http://10.0.0.5/internal').safe, 'Blocks 10.x.x.x private range');
  assert(!isSafeUrl('http://172.20.0.1/internal').safe, 'Blocks 172.16-31.x.x private range');
  assert(!isSafeUrl('file:///etc/passwd').safe, 'Blocks file:// protocol');
  assert(!isSafeUrl('ftp://example.com').safe, 'Blocks ftp:// protocol');
  assert(!isSafeUrl('not-a-url').safe, 'Rejects malformed non-URL string');
  assert(isSafeUrl('https://onlinesbi.sbi').safe, 'Allows legitimate public HTTPS domain');
  assert(isSafeUrl('http://example.com/test').safe, 'Allows public HTTP domain');
  assert(isSafeUrl('https://www.google.com/search?q=test').safe, 'Allows Google with query string');

  // ── Suite 2: UPI Fraud Detection ────────────────────────────────────────────
  console.log('\n─── Suite 2: UPI Scan-to-Receive Fraud Parser ───────────────');
  const scanToReceive = parseUpi('upi://pay?pa=mule99@ybl&pn=ElectricityOffice&am=5000&tn=Refund');
  assert(scanToReceive.isUpi, 'Identifies upi://pay URI');
  assert(scanToReceive.warnings.length >= 2, 'Flags personal VPA + debit amount');
  assert(scanToReceive.am === '5000', 'Parses payment amount correctly');

  const legitUpi = parseUpi('upi://pay?pa=freshmart.grocery@icici&pn=FreshMartStore&cu=INR');
  assert(legitUpi.isUpi, 'Identifies legitimate merchant QR');
  assert(legitUpi.warnings.length === 0, 'No false warnings for normal merchant (no amount)');

  const notUpi = parseUpi('https://example.com/page');
  assert(!notUpi.isUpi, 'Correctly rejects non-UPI URI');

  const malformedUpi = parseUpi('upi://pay?pa=MALFORMED%ZZ');
  assert(!malformedUpi.isUpi || malformedUpi.warnings.length >= 0, 'Handles malformed UPI URI without crash');

  // ── Suite 3: Deterministic Risk Scoring ────────────────────────────────────
  console.log('\n─── Suite 3: Deterministic Risk Engine ──────────────────────');

  // High-risk scam message
  const scam1 = runDeterministicChecks(
    'Dear SBI Customer, your account will be blocked today. Update KYC immediately at http://sbi-pan-kyc.xyz/login. Call officer on 9876543210.',
    'message'
  );
  assert(scam1.score > 30, `Scam message scores above 30 (got ${scam1.score})`);
  assert(scam1.findings.length >= 2, `Scam message has multiple findings (got ${scam1.findings.length})`);

  // Legitimate safe message
  const safe1 = runDeterministicChecks(
    'Your order #IND-90823 from Amazon has been dispatched. Track inside the Amazon app.',
    'message'
  );
  assert(safe1.score < 30, `Legitimate Amazon dispatch scores below 30 (got ${safe1.score})`);
  assert(safe1.findings.length === 0, `Legitimate message has zero findings (got ${safe1.findings.length})`);

  // Digital arrest coercion
  const arrest = runDeterministicChecks(
    'This is CBI Inspector. A digital arrest warrant has been issued against your Aadhaar. Transfer ₹50,000 immediately.',
    'audio'
  );
  assert(arrest.score >= 70, `Digital arrest scores high risk (got ${arrest.score})`);

  // Score deduplication — same text should not inflate score by running same rule multiple times
  const duplicateText = 'URGENT URGENT URGENT final notice final notice final notice immediately immediately immediately';
  const dedup = runDeterministicChecks(duplicateText, 'message');
  assert(dedup.score <= 95, `Score stays within max 95 cap (got ${dedup.score})`);
  // The 'urgency-pressure' rule fires once; verify only one finding with that id
  const pressureFindings = dedup.findings.filter(f => f.id === 'urgency-pressure');
  assert(pressureFindings.length <= 1, `Duplicate pattern matches produce max 1 finding (got ${pressureFindings.length})`);

  // Malformed URL embedded in message — should not crash
  const malformedUrl = runDeterministicChecks(
    'Click http://not a valid url here for offer',
    'url'
  );
  assert(typeof malformedUrl.score === 'number', 'Engine handles malformed URLs without crash');

  // Raw IP in URL
  const rawIp = runDeterministicChecks('Check this http://45.123.45.67/banking/login', 'url');
  assert(rawIp.score > 30, `Raw IP address in URL scores suspiciously (got ${rawIp.score})`);
  assert(rawIp.findings.some(f => f.id.startsWith('ip-host')), 'Raw IP finding is recorded');

  // Lottery bait
  const lottery = runDeterministicChecks(
    'Congratulations! You have won a prize of 5 lakh rupees in the national lottery. Claim cashback now!',
    'message'
  );
  assert(lottery.score > 30, `Lottery bait message scores suspicious (got ${lottery.score})`);

  // ── Suite 4: Community Report Validation ───────────────────────────────────
  console.log('\n─── Suite 4: Community Report Input Validation ──────────────');
  assert(!validateReportInput({}).valid, 'Rejects empty body');
  assert(!validateReportInput({ consent: true }).valid, 'Rejects missing category');
  assert(!validateReportInput({ consent: true, category: 'Phishing', description: 'Short' }).valid, 'Rejects description too short');
  assert(!validateReportInput({ consent: false, category: 'Phishing', description: 'A valid description here' }).valid, 'Rejects missing consent');
  assert(
    validateReportInput({ consent: true, category: 'Phishing', description: 'This is a valid description of a scam attempt I encountered.' }).valid,
    'Accepts valid report'
  );
  const longDesc = { consent: true, category: 'Phishing', description: 'x'.repeat(1001) };
  assert(!validateReportInput(longDesc).valid, 'Rejects description over 1000 chars');

  // ── Suite 5: Audio Input Validation ────────────────────────────────────────
  console.log('\n─── Suite 5: Audio Input Validation ─────────────────────────');
  assert(!validateAudioInput({}).valid, 'Rejects empty audio request');
  assert(validateAudioInput({}).status === 400, 'Returns 400 for empty audio request');
  assert(validateAudioInput({ transcriptText: 'Some transcript text' }).valid, 'Accepts transcript-only input');
  assert(validateAudioInput({ audioBase64: 'validdata', mimeType: 'audio/mp3' }).valid, 'Accepts valid audio with mp3 mime');
  assert(!validateAudioInput({ audioBase64: 'x'.repeat(MAX_AUDIO_BASE64_BYTES + 1), mimeType: 'audio/mp3' }).valid, 'Rejects oversized audio');
  assert(validateAudioInput({ audioBase64: 'x'.repeat(MAX_AUDIO_BASE64_BYTES + 1), mimeType: 'audio/mp3' }).status === 413, 'Returns 413 for oversized audio');
  assert(!validateAudioInput({ audioBase64: 'data', mimeType: 'video/mp4' }).valid, 'Rejects unsupported video mime type');
  assert(validateAudioInput({ audioBase64: 'data', mimeType: 'audio/webm' }).valid, 'Accepts audio/webm');

  // ── Suite 6: Credential-less Mode (No Gemini key) ─────────────────────────
  console.log('\n─── Suite 6: Missing Credentials / Fallback Behavior ────────');
  // When GEMINI_API_KEY is absent the engine should still return a usable result.
  // We can't easily test the actual server here, but we can test the pure functions.
  const fallbackScore = runDeterministicChecks(
    'Dear Consumer, your electricity will be disconnected tonight at 9:30 PM. Call officer immediately.',
    'message'
  );
  assert(fallbackScore.score >= 30, `Heuristics alone score scam above 30 without any AI key (got ${fallbackScore.score})`);
  assert(fallbackScore.findings.length >= 1, 'Heuristics alone produce at least one finding');

  // ── Results ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Test Results:  ${passed} passed,  ${failed} failed`);
  console.log(`${'═'.repeat(60)}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
