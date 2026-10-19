import React, { useState, useEffect } from 'react';
import {
  Users,
  Send,
  AlertTriangle,
  CheckCircle2,
  ThumbsUp,
  Clock,
  Shield,
  Loader2,
} from 'lucide-react';
import { CommunityReport, Language } from '../types';
import { translations } from '../translations';
import { api } from '../services/api';

interface CommunityReportsProps {
  language: Language;
}

export const CommunityReportsSection: React.FC<CommunityReportsProps> = ({ language }) => {
  const t = translations[language];

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [category, setCategory] = useState('UPI Scan-to-Receive Fraud');
  const [excerptOrUrl, setExcerptOrUrl] = useState('');
  const [description, setDescription] = useState('');
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.fetchRecentReports();
      setReports(data.reports || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setErrorMsg('Please agree to the consent checkbox before submitting.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please provide a brief description.');
      return;
    }

    try {
      setErrorMsg(null);
      setSubmitting(true);
      const res = await api.submitReport({
        category,
        excerptOrUrl,
        description,
        language,
        consent,
      });

      setSuccessMsg(t.reports.successMsg);
      setExcerptOrUrl('');
      setDescription('');
      setConsent(false);
      if (res.report) {
        setReports((prev) => [res.report, ...prev]);
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    // Optimistic UI update
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r))
    );
    try {
      await api.upvoteReport(id);
    } catch {
      // Revert optimistic update on failure
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, upvotes: Math.max(0, r.upvotes - 1) } : r))
      );
    }
  };

  const scamCategories = [
    'UPI Scan-to-Receive Fraud',
    'Electricity / Utility Cutoff Threat',
    'Bank KYC & Account Block SMS',
    'Digital Arrest / Police Impersonation',
    'Part-Time Job / Telegram Task Scam',
    'Lottery & Fake Cashback Offer',
    'Phishing Website / Fake Banking Portal',
  ];

  return (
    <section id="reports" className="py-16 bg-slate-50/50 dark:bg-[#0B1220] border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center space-y-2.5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" />
            <span>COMMUNITY VIGILANCE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.reports.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            {t.reports.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Report Form */}
          <div className="lg:col-span-6 bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm dark:shadow-xl space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Report a Suspected Scam</span>
            </h3>

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600 dark:text-green-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  {t.reports.categoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {scamCategories.map((c, i) => (
                    <option key={i} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Excerpt or URL */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  {t.reports.excerptLabel}
                </label>
                <input
                  type="text"
                  value={excerptOrUrl}
                  onChange={(e) => setExcerptOrUrl(e.target.value)}
                  placeholder="e.g. +91 98210-XXXXX or suspicious link or UPI VPA"
                  className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                  {t.reports.descLabel}
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what they claimed and how they asked for money or PIN..."
                  className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                />
              </div>

              {/* Consent Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0 mt-0.5"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.reports.consentLabel}
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || !consent}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.reports.submitting}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.reports.submitBtn}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Community Threat Feed */}
          <div className="lg:col-span-6 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t.reports.recentHeading}</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{reports.length} verified alerts</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-800 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20">
                      {report.category}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(report.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  {report.excerptOrUrl && (
                    <div className="p-2 rounded bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-slate-800 dark:text-slate-300 break-words">
                      "{report.excerptOrUrl}"
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Anonymized & Reviewed
                    </span>
                    <button
                      onClick={() => handleUpvote(report.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-[#0B1220] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3 h-3 text-blue-500" />
                      <span>{report.upvotes} helpful</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
