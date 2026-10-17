import { Language, ScanResult, CommunityReport } from '../types';

export const api = {
  async analyzeMessage(message: string, language: Language): Promise<ScanResult> {
    const res = await fetch('/api/analyze/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(err.error || 'Failed to analyze message');
    }
    return res.json();
  },

  async analyzeUrl(url: string, language: Language): Promise<ScanResult> {
    const res = await fetch('/api/analyze/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, language }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'URL analysis failed' }));
      throw new Error(err.error || 'Failed to analyze URL');
    }
    return res.json();
  },

  async analyzeQr(qrPayload: string, language: Language): Promise<ScanResult> {
    const res = await fetch('/api/analyze/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrPayload, language }),
    });
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
    const res = await fetch('/api/analyze/audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, language }),
    });
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
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Submission failed' }));
      throw new Error(err.error || 'Failed to submit report');
    }
    return res.json();
  },

  async fetchRecentReports(): Promise<{ reports: CommunityReport[]; total: number }> {
    const res = await fetch('/api/reports/recent');
    if (!res.ok) {
      throw new Error('Failed to load recent reports');
    }
    return res.json();
  },
};
