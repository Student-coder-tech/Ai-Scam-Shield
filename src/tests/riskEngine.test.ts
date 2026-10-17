/**
 * Unit Tests for AI Scam Shield Risk Engine & Security Validation
 */

// SSRF & Safe URL Validator (Logic mirror from server.ts)
export const isSafeUrl = (inputUrl: string): { safe: boolean; reason?: string } => {
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

    // Check cloud metadata endpoint
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

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Malformed or invalid URL structure.' };
  }
};

// UPI Payment URI Analyzer
export const parseUpi = (rawUri: string) => {
  if (!rawUri.startsWith('upi://pay')) {
    return { isUpi: false, warnings: [] };
  }
  const warnings: string[] = [];
  try {
    const url = new URL(rawUri);
    const pa = url.searchParams.get('pa') || '';
    const pn = url.searchParams.get('pn') || '';
    const am = url.searchParams.get('am') || '';

    if (pa.includes('@ybl') || pa.includes('@paytm')) {
      if (/bill|electricity|support|officer/i.test(pn)) {
        warnings.push('Personal UPI handle claiming to be official service');
      }
    }

    if (am && parseFloat(am) > 0) {
      warnings.push(`Requests immediate debit of ₹${am}`);
    }

    return { isUpi: true, pa, pn, am, warnings };
  } catch {
    return { isUpi: false, warnings: ['Malformed URI'] };
  }
};

// Test Runner
function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  console.log('\n🛡️  Running AI Scam Shield Security & Risk Engine Unit Tests...\n');

  // Test Suite 1: SSRF Protection
  console.log('--- Test Suite 1: SSRF & URL Guard ---');
  assert(!isSafeUrl('http://localhost:3000/api').safe, 'Blocks localhost requests');
  assert(!isSafeUrl('http://127.0.0.1/admin').safe, 'Blocks 127.0.0.1 loopback');
  assert(!isSafeUrl('http://169.254.169.254/latest/meta-data').safe, 'Blocks AWS/GCP cloud metadata endpoint');
  assert(!isSafeUrl('http://192.168.1.1/router').safe, 'Blocks RFC1918 private IP 192.168.x.x');
  assert(!isSafeUrl('http://10.0.0.5/internal').safe, 'Blocks RFC1918 private IP 10.x.x.x');
  assert(!isSafeUrl('file:///etc/passwd').safe, 'Blocks non-http/https file:// protocol');
  assert(isSafeUrl('https://onlinesbi.sbi').safe, 'Allows legitimate public HTTPS domain');
  assert(isSafeUrl('http://example.com/test').safe, 'Allows public HTTP domain');

  // Test Suite 2: UPI Fraud Detection
  console.log('\n--- Test Suite 2: UPI Scan-to-Receive Fraud Parser ---');
  const scanToReceive = parseUpi('upi://pay?pa=mule99@ybl&pn=ElectricityOffice&am=5000&tn=Refund');
  assert(scanToReceive.isUpi, 'Correctly identifies upi://pay URI schema');
  assert(scanToReceive.warnings.length >= 2, 'Flags personal VPA pretending to be ElectricityOffice with debit amount');
  assert(scanToReceive.am === '5000', 'Accurately parses payment amount intended for outbound deduction');

  const legitUpi = parseUpi('upi://pay?pa=freshmart@icici&pn=FreshMartStore&cu=INR');
  assert(legitUpi.isUpi, 'Identifies merchant payment QR');
  assert(legitUpi.warnings.length === 0, 'No false warnings for normal merchant payment');

  // Test Summary
  console.log(`\n================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
