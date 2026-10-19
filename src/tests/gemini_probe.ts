/**
 * Quick Gemini API connectivity probe.
 * Run: npx tsx src/tests/gemini_probe.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..', '..');
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env'), 'utf8')
    .split('\n')
    .filter(l => /^[A-Z_]+=./.test(l))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    })
);

const model = env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
console.log(`Probing model: ${model}`);
console.log(`API key present: ${env.GEMINI_API_KEY?.length > 10}`);

const { GoogleGenAI } = await import('@google/genai');
const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

try {
  const resp = await ai.models.generateContent({
    model,
    contents: 'Reply with exactly one word: Hello',
    config: { temperature: 0.1 },
  });
  console.log('✅ Gemini responded:', resp.text?.trim());
} catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  console.error('❌ Gemini error:', msg);
}
