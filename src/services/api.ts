import { Language, ScanResult, CommunityReport } from '../types';

// Default timeout for all API calls (30 seconds).
// Audio transcription can take longer — it gets a 60s timeout.
const DEFAULT_TIMEOUT_MS = 30_000;
const AUDIO_TIMEOUT_MS = 60_000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. The server is taking too long to respond. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  async analyzeMessage(message: string, language: Language): Promise<ScanResult> {
    const res = await fetchWithTimeout(
      '/api/analyze/message',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, language }),
      },
      DEFAULT_TIMEOUT_MS
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(err.error || 'Failed to analyze message');
    }
    return res.json();
  },

  async analyzeUrl(url: string, language: Language): Promise<ScanResult> {
    const res = await fetchWithTimeout(
      '/api/analyze/url',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language }),
      },
      DEFAULT_TIMEOUT_MS
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'URL analysis failed' }));
      throw new Error(err.error || 'Failed to analyze URL');
    }
    return res.json();
  },

  async analyzeQr(qrPayload: string, language: Language): Promise<ScanResult> {
    const res = await fetchWithTimeout(
      '/api/analyze/qr',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload, language }),
      },
      DEFAULT_TIMEOUT_MS
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'QR analysis failed' }));
      throw new Error(err.error || 'Failed to analyze QR code');
    }
    return res.json();
  },

  async analyzeAudio(
    payload: { audioBase64?: string; transcriptText?: string; mimeType?: string },
    language: Language
  ): Promise<ScanResult> {
    const res = await fetchWithTimeout(
      '/api/analyze/audio',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, language }),
      },
      AUDIO_TIMEOUT_MS
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Audio analysis failed' }));
      throw new Error(err.error || 'Failed to analyze audio');
    }
    return res.json();
  },

  async submitReport(data: {
    category: string;
    excerptOrUrl: string;
    description: string;
    language: Language;
    consent: boolean;
  }): Promise<{ success: boolean; report: CommunityReport; message: string }> {
    const res = await fetchWithTimeout(
      '/api/reports',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      DEFAULT_TIMEOUT_MS
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },

  async fetchRecentReports(): Promise<{ reports: CommunityReport[]; total: number }> {
    const res = await fetchWithTimeout('/api/reports/recent', {}, DEFAULT_TIMEOUT_MS);
    if (!res.ok) {
      throw new Error('Failed to load recent reports');
    }
    return res.json();
  },

  async upvoteReport(id: string): Promise<{ success: boolean; upvotes: number }> {
    const res = await fetchWithTimeout(
      `/api/reports/${id}/upvote`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      DEFAULT_TIMEOUT_MS
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upvote failed' }));
      throw new Error(err.error || 'Failed to upvote report');
    }
    return res.json();
  },
};
