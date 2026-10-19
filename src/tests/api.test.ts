/**
 * AI Scam Shield — Live API Integration Tests
 *
 * Runs against the local server on http://localhost:3000.
 * Start the server first with:  npm run dev
 * Then run this file with:      npx tsx src/tests/api.test.ts
 *
 * Does NOT expose secrets — only reports presence/absence of API key.
 */

const BASE = 'http://localhost:3000';
const TIMEOUT_MS = 40_000;

// ── helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

async function req(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<{ status: number; body: unknown }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: options.method ?? 'GET',
      headers: options.body ? { 'Content-Type': 'application/json' } : {},
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = text; }
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function assert(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS  ${name}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL  ${name}${detail ? `  →  ${detail}` : ''}`);
    failed++;
  }
}

function section(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 55 - title.length))}`);
}

// ── tests ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🛡️  AI Scam Shield — Live API Integration Tests\n');

  // ── 1. Health ───────────────────────────────────────────────────────────────
  section('Health');
  const health = await req('/api/health');
  assert('GET /api/health → 200', health.status === 200, `got ${health.status}`);
  const svc = (health.body as Record<string, Record<string, unknown>>).services ?? {};
  assert('Health: version field present', !!(health.body as Record<string,unknown>).version);
  assert('Health: gemini_text_model is gemini-3.8-flash', svc.gemini_text_model === 'gemini-3.8-flash', `got ${svc.gemini_text_model}`);
  console.log(`       gemini_configured=${svc.gemini_configured}  safe_browsing=${svc.safe_browsing_configured}  virustotal=${svc.virustotal_configured}`);

  // ── 2. Message analysis ─────────────────────────────────────────────────────
  section('Message Analysis');

  // 2a. Scam message → high score
  const mScam = await req('/api/analyze/message', {
    method: 'POST',
    body: { message: 'Dear SBI Customer, your account will be blocked today. Update KYC at http://sbi-pan-kyc.xyz/login immediately', language: 'en' },
  });
  assert('POST /api/analyze/message → 200', mScam.status === 200, `got ${mScam.status}`);
  const mScamBody = mScam.body as Record<string, unknown>;
  assert('Message scam: risk_score ≥ 70', Number(mScamBody.risk_score) >= 70, `got ${mScamBody.risk_score}`);
  assert('Message scam: verdict = Scam', mScamBody.verdict === 'Scam', `got ${mScamBody.verdict}`);
  assert('Message scam: findings array present', Array.isArray(mScamBody.findings));
  assert('Message scam: summary present', typeof mScamBody.summary === 'string' && String(mScamBody.summary).length > 10);
  const mScamDetails = mScamBody.technical_details as Record<string, unknown> ?? {};
  console.log(`       score=${mScamBody.risk_score}  verdict=${mScamBody.verdict}  findings=${(mScamBody.findings as unknown[]).length}  ai_model=${mScamDetails.aiModelUsed}  status=${mScamBody.analysis_status}`);

  // 2b. Safe message → low score
  const mSafe = await req('/api/analyze/message', {
    method: 'POST',
    body: { message: 'Your Amazon order #IND-90823 has been dispatched. Track inside the Amazon app.', language: 'en' },
  });
  assert('POST /api/analyze/message (safe) → 200', mSafe.status === 200);
  const mSafeBody = mSafe.body as Record<string, unknown>;
  assert('Message safe: risk_score < 30', Number(mSafeBody.risk_score) < 30, `got ${mSafeBody.risk_score}`);
  console.log(`       score=${mSafeBody.risk_score}  verdict=${mSafeBody.verdict}`);

  // 2c. Validation errors
  const mEmpty = await req('/api/analyze/message', { method: 'POST', body: { message: '', language: 'en' } });
  assert('Message empty body → 400', mEmpty.status === 400, `got ${mEmpty.status}`);

  const mLong = await req('/api/analyze/message', { method: 'POST', body: { message: 'x'.repeat(5001), language: 'en' } });
  assert('Message >5000 chars → 400', mLong.status === 400, `got ${mLong.status}`);

  // ── 3. URL analysis ─────────────────────────────────────────────────────────
  section('URL Analysis');

  const uPhish = await req('/api/analyze/url', {
    method: 'POST',
    body: { url: 'http://sbi-pan-kyc-verify.shop/login', language: 'en' },
  });
  assert('POST /api/analyze/url → 200', uPhish.status === 200, `got ${uPhish.status}`);
  const uPhishBody = uPhish.body as Record<string, unknown>;
  assert('URL phishing: risk_score ≥ 50', Number(uPhishBody.risk_score) >= 50, `got ${uPhishBody.risk_score}`);
  console.log(`       score=${uPhishBody.risk_score}  verdict=${uPhishBody.verdict}  findings=${(uPhishBody.findings as unknown[]).length}`);

  const uSsrf = await req('/api/analyze/url', { method: 'POST', body: { url: 'http://localhost:9000/admin', language: 'en' } });
  assert('URL SSRF localhost → 400', uSsrf.status === 400, `got ${uSsrf.status}`);

  const uMeta = await req('/api/analyze/url', { method: 'POST', body: { url: 'http://169.254.169.254/latest/meta-data', language: 'en' } });
  assert('URL SSRF metadata endpoint → 400', uMeta.status === 400, `got ${uMeta.status}`);

  const uPriv = await req('/api/analyze/url', { method: 'POST', body: { url: 'http://192.168.1.1/router', language: 'en' } });
  assert('URL SSRF private IP → 400', uPriv.status === 400, `got ${uPriv.status}`);

  // ── 4. QR analysis ──────────────────────────────────────────────────────────
  section('QR / UPI Analysis');

  const qScam = await req('/api/analyze/qr', {
    method: 'POST',
    body: { qrPayload: 'upi://pay?pa=cashbackloot@ybl&pn=PhonePeCashback&am=4999&tn=EnterPINtoReceive', language: 'en' },
  });
  assert('POST /api/analyze/qr → 200', qScam.status === 200, `got ${qScam.status}`);
  const qScamBody = qScam.body as Record<string, unknown>;
  assert('QR scam: risk_score ≥ 70', Number(qScamBody.risk_score) >= 70, `got ${qScamBody.risk_score}`);
  const qDetails = qScamBody.technical_details as Record<string, Record<string, unknown>>;
  assert('QR scam: upiDetails decoded', !!qDetails?.upiDetails?.payeeVpa, `vpa=${qDetails?.upiDetails?.payeeVpa}`);
  console.log(`       score=${qScamBody.risk_score}  verdict=${qScamBody.verdict}  vpa=${qDetails?.upiDetails?.payeeVpa}`);

  const qLegit = await req('/api/analyze/qr', {
    method: 'POST',
    body: { qrPayload: 'upi://pay?pa=freshmart.grocery@icici&pn=FreshMartStore&cu=INR', language: 'en' },
  });
  assert('QR legit merchant → 200', qLegit.status === 200);
  const qLegitBody = qLegit.body as Record<string, unknown>;
  assert('QR legit: risk_score < 70 (no amount trap)', Number(qLegitBody.risk_score) < 70, `got ${qLegitBody.risk_score}`);
  console.log(`       score=${qLegitBody.risk_score}  verdict=${qLegitBody.verdict}  (legit merchant)`);

  const qEmpty = await req('/api/analyze/qr', { method: 'POST', body: { qrPayload: '', language: 'en' } });
  assert('QR empty payload → 400', qEmpty.status === 400, `got ${qEmpty.status}`);

  // ── 5. Audio analysis ────────────────────────────────────────────────────────
  section('Audio Analysis');

  const aArrest = await req('/api/analyze/audio', {
    method: 'POST',
    body: {
      transcriptText: 'This is Inspector Sharma from Mumbai Cyber Crime Branch. A parcel under your Aadhaar contains narcotics. Transfer 50000 immediately or you will be arrested.',
      language: 'en',
    },
  });
  assert('POST /api/analyze/audio (transcript) → 200', aArrest.status === 200, `got ${aArrest.status}`);
  const aArrestBody = aArrest.body as Record<string, unknown>;
  assert('Audio arrest: risk_score ≥ 70', Number(aArrestBody.risk_score) >= 70, `got ${aArrestBody.risk_score}`);
  console.log(`       score=${aArrestBody.risk_score}  verdict=${aArrestBody.verdict}  findings=${(aArrestBody.findings as unknown[]).length}  status=${aArrestBody.analysis_status}`);

  const aSafe = await req('/api/analyze/audio', {
    method: 'POST',
    body: { transcriptText: "Hello Mr. Verma, this is Dr. Rao's clinic confirming your dental appointment tomorrow at 4:30 PM.", language: 'en' },
  });
  assert('Audio safe call → 200', aSafe.status === 200);
  const aSafeBody = aSafe.body as Record<string, unknown>;
  assert('Audio safe: risk_score < 30', Number(aSafeBody.risk_score) < 30, `got ${aSafeBody.risk_score}`);
  console.log(`       score=${aSafeBody.risk_score}  verdict=${aSafeBody.verdict}  (clinic call)`);

  const aEmpty = await req('/api/analyze/audio', { method: 'POST', body: { language: 'en' } });
  assert('Audio no input → 400', aEmpty.status === 400, `got ${aEmpty.status}`);

  // ── 6. Community reports ─────────────────────────────────────────────────────
  section('Community Reports');

  const repOk = await req('/api/reports', {
    method: 'POST',
    body: {
      category: 'Bank KYC Phishing',
      excerptOrUrl: 'http://sbi-fake.xyz',
      description: 'Received fake SMS threatening to block SBI account unless KYC updated immediately on suspicious link.',
      language: 'en',
      consent: true,
    },
  });
  assert('POST /api/reports → 201', repOk.status === 201, `got ${repOk.status}`);
  const repOkBody = repOk.body as Record<string, Record<string, unknown>>;
  assert('Report: has id', typeof repOkBody.report?.id === 'string');
  assert('Report: status = under_review', repOkBody.report?.status === 'under_review');
  console.log(`       id=${repOkBody.report?.id}  status=${repOkBody.report?.status}`);

  const repNoConsent = await req('/api/reports', {
    method: 'POST',
    body: { category: 'Test', description: 'Valid description text', consent: false, language: 'en' },
  });
  assert('Report no consent → 400', repNoConsent.status === 400, `got ${repNoConsent.status}`);

  const repShort = await req('/api/reports', {
    method: 'POST',
    body: { category: 'Test', description: 'Short', consent: true, language: 'en' },
  });
  assert('Report short description → 400', repShort.status === 400, `got ${repShort.status}`);

  const repList = await req('/api/reports/recent');
  assert('GET /api/reports/recent → 200', repList.status === 200, `got ${repList.status}`);
  const repListBody = repList.body as Record<string, unknown>;
  assert('Reports list: has reports array', Array.isArray(repListBody.reports));
  console.log(`       count=${(repListBody.reports as unknown[]).length}  total=${repListBody.total}`);

  // ── 7. Feedback ──────────────────────────────────────────────────────────────
  section('Feedback');

  const fbOk = await req('/api/feedback', {
    method: 'POST',
    body: { scanId: 'scan-test-1', feedbackType: 'false_positive', comments: 'Legitimate bank notification', riskScore: 80 },
  });
  assert('POST /api/feedback → 200', fbOk.status === 200, `got ${fbOk.status}`);
  assert('Feedback: success=true', (fbOk.body as Record<string, unknown>).success === true);

  const fbBadType = await req('/api/feedback', {
    method: 'POST',
    body: { scanId: 'x', feedbackType: 'hack_me' },
  });
  assert('Feedback invalid type → 400', fbBadType.status === 400, `got ${fbBadType.status}`);

  const fbNoId = await req('/api/feedback', {
    method: 'POST',
    body: { feedbackType: 'false_positive' },
  });
  assert('Feedback missing scanId → 400', fbNoId.status === 400, `got ${fbNoId.status}`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Test Results:  ${passed} passed,  ${failed} failed`);
  console.log(`${'═'.repeat(60)}\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('\n💥 Test runner crashed:', err.message);
  process.exit(1);
});
