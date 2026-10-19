/**
 * MongoDB Atlas connectivity + persistence test.
 * - Connects using MONGODB_URI from .env
 * - Never prints the URI, password, or any credential
 * - Inserts a clearly-labelled test document
 * - Disconnects and reconnects to verify the document persisted
 * - Deletes the test document afterwards (clean up)
 * - Reports pass/fail without exposing secrets
 *
 * Run: npx tsx src/tests/mongo_probe.ts
 */

import { MongoClient, ServerApiVersion } from 'mongodb';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const envPath = join(ROOT, '.env');

if (!existsSync(envPath)) {
  console.error('❌ .env file not found at project root.');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => /^[A-Z_]+=./.test(l))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);

const MONGODB_URI = env.MONGODB_URI;

if (!MONGODB_URI || MONGODB_URI.includes('your_mongodb') || MONGODB_URI.length < 20) {
  console.log('⚠️  MONGODB_URI is not configured in .env — skipping MongoDB test.');
  console.log('   Set MONGODB_URI to a valid Atlas connection string to enable persistence.');
  process.exit(0);
}

// Sanitise for logging — never show credentials
function sanitizeUri(uri: string): string {
  return uri.replace(/\/\/[^@]+@/, '//[credentials-redacted]@');
}

// Extract DB name from URI path
function extractDbName(uri: string): string {
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
    const name = url.pathname.replace('/', '').split('?')[0];
    return name || 'ai_scam_shield';
  } catch {
    return 'ai_scam_shield';
  }
}

const dbName = extractDbName(MONGODB_URI);
const TEST_ID = `probe-${Date.now()}`;

console.log('\n🔌 MongoDB Atlas Connectivity + Persistence Test\n');
console.log(`   URI:      ${sanitizeUri(MONGODB_URI)}`);
console.log(`   Database: ${dbName}`);
console.log(`   Test ID:  ${TEST_ID}\n`);

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean, detail = '') {
  if (condition) { console.log(`  ✅ PASS  ${name}`); passed++; }
  else { console.log(`  ❌ FAIL  ${name}${detail ? `  →  ${detail}` : ''}`); failed++; }
}

async function run() {
  // ── Phase 1: Initial connection ───────────────────────────────────────────
  console.log('── Phase 1: Connect & Insert ─────────────────────────────────');

  let client1: MongoClient;
  try {
    client1 = new MongoClient(MONGODB_URI, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    await client1.connect();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const sanitized = msg.replace(/mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb://[credentials-redacted]@');
    console.error(`  ❌ FAIL  Connection failed: ${sanitized}`);
    console.error('\n  Possible causes:');
    console.error('  1. IP not whitelisted in Atlas Network Access (add 0.0.0.0/0 for local dev)');
    console.error('  2. Wrong username or password in MONGODB_URI');
    console.error('  3. Cluster paused or deleted in Atlas');
    console.error('  4. Database name contains spaces — must be percent-encoded (%20) in URI');
    process.exit(1);
  }

  // Ping
  try {
    await client1.db('admin').command({ ping: 1 });
    assert('Ping admin DB', true);
  } catch (err: unknown) {
    assert('Ping admin DB', false, err instanceof Error ? err.message : String(err));
  }

  // Insert test document
  const col1 = client1.db(dbName).collection('community_reports');
  const testDoc = {
    id: TEST_ID,
    category: '🧪 AUTOMATED TEST — SAFE TO DELETE',
    excerptOrUrl: 'probe-test',
    language: 'en',
    description: 'This document was inserted by the AI Scam Shield MongoDB connectivity probe. It will be deleted automatically.',
    timestamp: Date.now(),
    status: 'under_review' as const,
    upvotes: 0,
  };

  try {
    await col1.insertOne(testDoc);
    assert('Insert test document', true);
  } catch (err: unknown) {
    assert('Insert test document', false, err instanceof Error ? err.message : String(err));
    await client1.close();
    process.exit(1);
  }

  await client1.close();
  console.log('   Connection 1 closed.\n');

  // ── Phase 2: Reconnect and verify persistence ─────────────────────────────
  console.log('── Phase 2: Reconnect & Verify Persistence ───────────────────');

  let client2: MongoClient;
  try {
    client2 = new MongoClient(MONGODB_URI, {
      serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    await client2.connect();
    assert('Reconnect on new client', true);
  } catch (err: unknown) {
    assert('Reconnect on new client', false, err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const col2 = client2.db(dbName).collection('community_reports');

  // Find the test document
  const found = await col2.findOne({ id: TEST_ID });
  assert('Test document found after reconnect', !!found, found ? '' : 'document not found — persistence failed');
  assert('Test document category matches', found?.category === testDoc.category);

  // Count total documents
  const total = await col2.countDocuments();
  console.log(`   Total documents in community_reports: ${total}`);

  // ── Phase 3: Clean up test document ───────────────────────────────────────
  console.log('\n── Phase 3: Clean Up ─────────────────────────────────────────');
  const del = await col2.deleteOne({ id: TEST_ID });
  assert('Test document deleted (clean up)', del.deletedCount === 1);

  await client2.close();
  console.log('   Connection 2 closed.');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  MongoDB Test Results:  ${passed} passed,  ${failed} failed`);
  if (failed === 0) {
    console.log('  ✅ Atlas is connected. Reports WILL persist across server restarts.');
  } else {
    console.log('  ❌ Persistence NOT verified. Check errors above.');
  }
  console.log(`${'═'.repeat(60)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  const sanitized = msg.replace(/mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb://[credentials-redacted]@');
  console.error('\n💥 Probe crashed:', sanitized);
  process.exit(1);
});
