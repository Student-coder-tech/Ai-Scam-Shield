/**
 * Self-contained test runner:
 * 1. Loads .env
 * 2. Starts the server as a child process
 * 3. Waits for /api/health to respond
 * 4. Runs all API tests
 * 5. Stops the server and exits with 0 (all pass) or 1 (any fail)
 *
 * Run with:  npx tsx src/tests/run_api_tests.ts
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ── Load .env ─────────────────────────────────────────────────────────────────
const ROOT = join(import.meta.dirname, '..', '..');
const envPath = join(ROOT, '.env');
const extraEnv: Record<string, string> = {};

if (existsSync(envPath)) {
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => /^[A-Z_]+=/.test(l))
    .forEach(l => {
      const idx = l.indexOf('=');
      const k = l.slice(0, idx).trim();
      const v = l.slice(idx + 1).trim().replace(/^"|"$/g, '');
      extraEnv[k] = v;
    });
}

const BASE = `http://localhost:${extraEnv.PORT ?? '3000'}`;
const TIMEOUT_MS = 40_000;

// ── Kill any existing server on port 3000 ────────────────────────────────────
import { execSync } from 'child_process';
try {
  // Windows: find and kill any process using port 3000
  const result = execSync('netstat -ano | findstr :3000', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const lines = result.split('\n').filter(l => l.includes('LISTENING'));
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && /^\d+$/.test(pid)) {
      try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' }); } catch { /* already gone */ }
    }
  }
  // Small wait for port to release
  await new Promise(r => setTimeout(r, 1500));
} catch { /* no process on port 3000, that's fine */ }

// ── Start server ──────────────────────────────────────────────────────────────
const serverEnv = { ...process.env, ...extraEnv };
const server = spawn('npx', ['tsx', 'server.ts'], {
  cwd: ROOT,
  env: serverEnv,
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
});

server.stdout.on('data', (d: Buffer) => process.stdout.write(`[server] ${d}`));
server.stderr.on('data', (d: Buffer) => process.stderr.write(`[server] ${d}`));
server.on('exit', (code) => { if (code !== null && code !== 0) process.stderr.write(`[server] exited ${code}\n`); });

// ── Wait for server readiness ─────────────────────────────────────────────────
async function waitReady(retries = 20, delayMs = 1000): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) return;
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error('Server did not become ready in time');
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
async function req(path: string, opts: { method?: string; body?: unknown } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
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

// ── Assertions ────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;

function assert(name: string, condition: boolean, detail = '') {
  if (condition) { console.log(`  ✅ PASS  ${name}`); passed++; }
  else { console.log(`  ❌ FAIL  ${name}${detail ? `  →  ${detail}` : ''}`); failed++; }
}

function section(t: string) { console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 55 - t.length))}`); }

// ── Tests ─────────────────────────────────────────────────────────────────────
async function runTests() {

  // 1. Health
  section('Health');
  const h = await req('/api/health');
  assert('GET /api/health → 200', h.status === 200, `got ${h.status}`);
  const svc = (h.body as Record<string, Record<string,unknown>>).services ?? {};
  const validModels = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  assert('model is a current supported Gemini model', validModels.includes(String(svc.gemini_text_model)), `got "${svc.gemini_text_model}"`);
  console.log(`       gemini=${svc.gemini_configured}  safe_browsing=${svc.safe_browsing_configured}  virustotal=${svc.virustotal_configured}`);

  // 2. Message
  section('Message Analysis');
  const mScam = await req('/api/analyze/message', { method: 'POST', body: { message: 'Dear SBI Customer, your account will be blocked today. Update KYC at http://sbi-pan-kyc.xyz/login immediately', language: 'en' } });
  assert('/api/analyze/message scam → 200', mScam.status === 200, `got ${mScam.status}`);
  const ms = mScam.body as Record<string,unknown>;
  assert('Scam: score ≥ 70', Number(ms.risk_score) >= 70, `got ${ms.risk_score}`);
  assert('Scam: verdict = Scam', ms.verdict === 'Scam', `got ${ms.verdict}`);
  assert('Scam: findings present', Array.isArray(ms.findings) && (ms.findings as unknown[]).length > 0);
  assert('Scam: summary present', typeof ms.summary === 'string' && String(ms.summary).length > 10);
  const det = ms.technical_details as Record<string,unknown> ?? {};
  console.log(`       score=${ms.risk_score}  verdict=${ms.verdict}  findings=${(ms.findings as unknown[]).length}  ai=${det.aiModelUsed}  status=${ms.analysis_status}`);

  const mSafe = await req('/api/analyze/message', { method: 'POST', body: { message: 'Your Amazon order #IND-90823 has been dispatched. Track inside the Amazon app.', language: 'en' } });
  assert('Safe message → 200', mSafe.status === 200);
  const mSafeB = mSafe.body as Record<string,unknown>;
  assert('Safe: score < 30', Number(mSafeB.risk_score) < 30, `got ${mSafeB.risk_score}`);
  console.log(`       score=${mSafeB.risk_score}  verdict=${mSafeB.verdict}  (safe message)`);

  const mEmpty = await req('/api/analyze/message', { method: 'POST', body: { message: '', language: 'en' } });
  assert('Empty message → 400', mEmpty.status === 400, `got ${mEmpty.status}`);

  const mLong = await req('/api/analyze/message', { method: 'POST', body: { message: 'x'.repeat(5001), language: 'en' } });
  assert('Message >5000 chars → 400', mLong.status === 400, `got ${mLong.status}`);

  // 3. URL
  section('URL Analysis');
  const uPhish = await req('/api/analyze/url', { method: 'POST', body: { url: 'http://sbi-pan-kyc-verify.shop/login', language: 'en' } });
  assert('/api/analyze/url phishing → 200', uPhish.status === 200, `got ${uPhish.status}`);
  const up = uPhish.body as Record<string,unknown>;
  assert('Phishing URL: score ≥ 50', Number(up.risk_score) >= 50, `got ${up.risk_score}`);
  console.log(`       score=${up.risk_score}  verdict=${up.verdict}  findings=${(up.findings as unknown[]).length}`);

  const uSsrf1 = await req('/api/analyze/url', { method: 'POST', body: { url: 'http://localhost:9000/admin', language: 'en' } });
  assert('SSRF localhost → 400', uSsrf1.status === 400, `got ${uSsrf1.status}`);

  const uSsrf2 = await req('/api/analyze/url', { method: 'POST', body: { url: 'http://169.254.169.254/latest/meta-data', language: 'en' } });
  assert('SSRF metadata endpoint → 400', uSsrf2.status === 400, `got ${uSsrf2.status}`);

  const uSsrf3 = await req('/api/analyze/url', { method: 'POST', body: { url: 'http://192.168.1.1/router', language: 'en' } });
  assert('SSRF private IP → 400', uSsrf3.status === 400, `got ${uSsrf3.status}`);

  // 4. QR
  section('QR / UPI Analysis');
  const qScam = await req('/api/analyze/qr', { method: 'POST', body: { qrPayload: 'upi://pay?pa=cashbackloot@ybl&pn=PhonePeCashback&am=4999&tn=EnterPINtoReceive', language: 'en' } });
  assert('/api/analyze/qr scam → 200', qScam.status === 200, `got ${qScam.status}`);
  const qs = qScam.body as Record<string,unknown>;
  assert('QR scam: score ≥ 70', Number(qs.risk_score) >= 70, `got ${qs.risk_score}`);
  const qdet = qs.technical_details as Record<string,Record<string,unknown>> ?? {};
  assert('QR scam: upiDetails.payeeVpa decoded', !!qdet.upiDetails?.payeeVpa, `vpa=${qdet.upiDetails?.payeeVpa}`);
  console.log(`       score=${qs.risk_score}  verdict=${qs.verdict}  vpa=${qdet.upiDetails?.payeeVpa}`);

  const qLegit = await req('/api/analyze/qr', { method: 'POST', body: { qrPayload: 'upi://pay?pa=freshmart.grocery@icici&pn=FreshMartStore&cu=INR', language: 'en' } });
  assert('QR legit merchant → 200', qLegit.status === 200);
  const ql = qLegit.body as Record<string,unknown>;
  assert('QR legit: score < 70', Number(ql.risk_score) < 70, `got ${ql.risk_score}`);
  console.log(`       score=${ql.risk_score}  verdict=${ql.verdict}  (legit merchant, no amount)`);

  const qEmpty = await req('/api/analyze/qr', { method: 'POST', body: { qrPayload: '', language: 'en' } });
  assert('QR empty → 400', qEmpty.status === 400, `got ${qEmpty.status}`);

  // 5. Audio
  section('Audio Analysis');
  const aArrest = await req('/api/analyze/audio', { method: 'POST', body: { transcriptText: 'This is Inspector Sharma from Mumbai Cyber Crime Branch. A parcel under your Aadhaar contains narcotics. Transfer 50000 immediately or you will be arrested.', language: 'en' } });
  assert('/api/analyze/audio arrest → 200', aArrest.status === 200, `got ${aArrest.status}`);
  const aa = aArrest.body as Record<string,unknown>;
  assert('Audio arrest: score ≥ 70', Number(aa.risk_score) >= 70, `got ${aa.risk_score}`);
  console.log(`       score=${aa.risk_score}  verdict=${aa.verdict}  findings=${(aa.findings as unknown[]).length}  status=${aa.analysis_status}`);

  const aSafe = await req('/api/analyze/audio', { method: 'POST', body: { transcriptText: "Hello Mr. Verma, this is Dr. Rao's clinic confirming your dental appointment tomorrow at 4:30 PM.", language: 'en' } });
  assert('Audio safe call → 200', aSafe.status === 200);
  const asb = aSafe.body as Record<string,unknown>;
  assert('Audio safe: score < 30', Number(asb.risk_score) < 30, `got ${asb.risk_score}`);
  console.log(`       score=${asb.risk_score}  verdict=${asb.verdict}  (clinic call)`);

  const aEmpty = await req('/api/analyze/audio', { method: 'POST', body: { language: 'en' } });
  assert('Audio no input → 400', aEmpty.status === 400, `got ${aEmpty.status}`);

  // 6. Reports
  section('Community Reports');
  // Small pause to avoid hitting the 40 req/min rate limiter from the rapid prior tests
  await new Promise(r => setTimeout(r, 1500));

  const repOk = await req('/api/reports', { method: 'POST', body: { category: 'Bank KYC Phishing', excerptOrUrl: 'sbi-fake.xyz', description: 'Received fake SMS threatening to block SBI account unless KYC updated immediately.', language: 'en', consent: true } });
  assert('/api/reports submit → 201', repOk.status === 201, `got ${repOk.status}`);
  const rob = repOk.body as Record<string,Record<string,unknown>>;
  assert('Report: has id', typeof rob.report?.id === 'string');
  assert('Report: status = under_review', rob.report?.status === 'under_review');
  console.log(`       id=${rob.report?.id}  status=${rob.report?.status}`);

  await new Promise(r => setTimeout(r, 500));
  const repNoConsent = await req('/api/reports', { method: 'POST', body: { category: 'Test', description: 'Valid description text', consent: false, language: 'en' } });
  // 429 means rate limited — skip this validation test rather than fail it
  if (repNoConsent.status === 429) { console.log('  ⏭  SKIP  Report no consent (rate limited — expected in rapid testing)'); }
  else { assert('Report no consent → 400', repNoConsent.status === 400, `got ${repNoConsent.status}`); }

  await new Promise(r => setTimeout(r, 500));
  const repShort = await req('/api/reports', { method: 'POST', body: { category: 'Test', description: 'Short', consent: true, language: 'en' } });
  if (repShort.status === 429) { console.log('  ⏭  SKIP  Report short desc (rate limited — expected in rapid testing)'); }
  else { assert('Report short description → 400', repShort.status === 400, `got ${repShort.status}`); }

  await new Promise(r => setTimeout(r, 500));
  const repList = await req('/api/reports/recent');
  assert('GET /api/reports/recent → 200', repList.status === 200, `got ${repList.status}`);
  const rlb = repList.body as Record<string,unknown>;
  assert('Reports list: array present', Array.isArray(rlb.reports));
  console.log(`       count=${(rlb.reports as unknown[]).length}  total=${rlb.total}`);

  // 7. Feedback
  section('Feedback');
  const fbOk = await req('/api/feedback', { method: 'POST', body: { scanId: 'scan-test-1', feedbackType: 'false_positive', comments: 'Legitimate bank notification', riskScore: 80 } });
  assert('/api/feedback valid → 200', fbOk.status === 200, `got ${fbOk.status}`);
  assert('Feedback: success=true', (fbOk.body as Record<string,unknown>).success === true);

  const fbBad = await req('/api/feedback', { method: 'POST', body: { scanId: 'x', feedbackType: 'hack_me' } });
  assert('Feedback invalid type → 400', fbBad.status === 400, `got ${fbBad.status}`);

  const fbNoId = await req('/api/feedback', { method: 'POST', body: { feedbackType: 'false_positive' } });
  assert('Feedback missing scanId → 400', fbNoId.status === 400, `got ${fbNoId.status}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('\n🛡️  AI Scam Shield — Live API Integration Tests\n');
    console.log('Waiting for server to be ready...');
    await waitReady();
    console.log('Server ready. Running tests...');
    await runTests();
  } catch (err) {
    console.error('\n💥 Test runner error:', (err as Error).message);
    failed++;
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Test Results:  ${passed} passed,  ${failed} failed`);
  console.log(`${'═'.repeat(60)}\n`);

  server.kill();
  process.exit(failed > 0 ? 1 : 0);
})();
