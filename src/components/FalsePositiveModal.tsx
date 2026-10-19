import React, { useState } from 'react';
import { X, Flag, CheckCircle2, Send, Loader2, AlertCircle } from 'lucide-react';
import { ScanResult } from '../types';

interface FalsePositiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ScanResult | null;
}

export const FalsePositiveModal: React.FC<FalsePositiveModalProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  const [feedbackType, setFeedbackType] = useState<'false_positive' | 'false_negative' | 'other'>('false_positive');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !result) return null;

  const handleClose = () => {
    // Reset state when closing so the modal is fresh on next open
    setFeedbackType('false_positive');
    setComments('');
    setSubmitting(false);
    setSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: result.id,
          feedbackType,
          // Only send the preview (first 100 chars already trimmed by backend), not full content
          inputPreview: result.input_preview,
          riskScore: result.risk_score,
          // Limit comments to 500 chars before sending
          comments: comments.slice(0, 500),
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      setSubmitted(true);
      setTimeout(() => handleClose(), 2500);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        setErrorMsg('Request timed out. Please try again.');
      } else {
        setErrorMsg(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-900 dark:text-white space-y-5 transition-colors duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Report Assessment Discrepancy</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Feedback Submitted</h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Thank you for helping us calibrate our scam detection accuracy.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Scan context */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono block">Item Scanned</span>
              <p className="text-slate-800 dark:text-slate-200 font-mono truncate">{result.input_preview}</p>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                Assessed: {result.risk_score}/100 ({result.verdict})
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Feedback type */}
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block">Discrepancy Nature</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType('false_positive')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    feedbackType === 'false_positive'
                      ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-slate-50 dark:bg-[#0B1220] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  False Alarm (Actually Safe)
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('false_negative')}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    feedbackType === 'false_negative'
                      ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-slate-50 dark:bg-[#0B1220] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Missed Threat (Actually Scam)
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <label className="text-slate-700 dark:text-slate-300 font-semibold block">
                Additional Details <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value.slice(0, 500))}
                placeholder="Why do you believe this score was inaccurate? (e.g. Official bank sender, genuine bill notice...)"
                className="w-full bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <span className="text-slate-400 text-[10px]">{comments.length}/500</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting…</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
