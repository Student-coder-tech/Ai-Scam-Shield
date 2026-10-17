import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Flag,
  ChevronDown,
  ChevronUp,
  Info,
  QrCode,
  Shield,
} from 'lucide-react';
import { ScanResult, Language } from '../types';
import { translations } from '../translations';

interface RiskScoreCardProps {
  result: ScanResult;
  language: Language;
  onNewScan: () => void;
  onReportFalsePositive: () => void;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  result,
  language,
  onNewScan,
  onReportFalsePositive,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const t = translations[language];

  // Color config based on risk score
  const isHighRisk = result.risk_score >= 70;
  const isSuspicious = result.risk_score >= 30 && result.risk_score < 70;
  const isSafe = result.risk_score < 30;

  const scoreColor = isHighRisk
    ? 'text-red-600 dark:text-red-500'
    : isSuspicious
    ? 'text-amber-600 dark:text-amber-500'
    : 'text-green-600 dark:text-green-500';

  const strokeColor = isHighRisk
    ? 'var(--risk-high)'
    : isSuspicious
    ? 'var(--risk-medium)'
    : 'var(--risk-safe)';

  const badgeBg = isHighRisk
    ? 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
    : isSuspicious
    ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    : 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30';

  const verdictLabel = isHighRisk
    ? t.results.verdictScam
    : isSuspicious
    ? t.results.verdictSuspicious
    : t.results.verdictSafe;

  const VerdictIcon = isHighRisk
    ? ShieldAlert
    : isSuspicious
    ? AlertTriangle
    : ShieldCheck;

  // Circular gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (result.risk_score / 100) * circumference;

  // Speech Synthesis TTS
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak = `${verdictLabel}. ${result.summary}. Recommended steps: ${result.recommended_actions.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else if (language === 'mr') {
      utterance.lang = 'mr-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy Report
  const handleCopyReport = () => {
    const reportText = `🛡️ AI Scam Shield Report
Input Type: ${result.input_type.toUpperCase()}
Risk Score: ${result.risk_score}/100 (${result.verdict})
Confidence: ${result.confidence}%

Summary:
${result.summary}

Warning Indicators:
${result.findings.map((f) => `• ${f.label}: ${f.explanation}`).join('\n')}

Protective Actions:
${result.recommended_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

National Cyber Crime Helpline: 1930 | https://cybercrime.gov.in`;

    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-lg dark:shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-white space-y-8 animate-fadeIn transition-colors duration-200">
      {/* Top Banner: Verdict & Circular Score Gauge */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Circular Score Gauge */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-34 h-34 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-200 dark:text-slate-800"
                strokeWidth="12"
                stroke="currentColor"
                fill="transparent"
              />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  style={{ stroke: strokeColor }}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold ${scoreColor}`}>
                {result.risk_score}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-400">
                / 100 RISK
              </span>
            </div>
          </div>

          {/* Verdict Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeBg}`}
              >
                <VerdictIcon className="w-4 h-4" />
                {verdictLabel}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {t.results.confidence}: {result.confidence}%
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {result.input_type === 'message'
                ? 'Message Fraud Evaluation'
                : result.input_type === 'url'
                ? 'Link Safety Assessment'
                : result.input_type === 'qr'
                ? 'UPI / QR Intent Analysis'
                : 'Audio Call Threat Analysis'}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {result.summary}
            </p>
          </div>
        </div>

        {/* Quick Voice & Share Actions */}
        <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleToggleSpeech}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-500/40 animate-pulse'
                : 'bg-slate-50 hover:bg-slate-100 dark:bg-[#0B1220] dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t.results.stopListening}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t.results.listenExplanation}</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyReport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#0B1220] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">{t.results.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>{t.results.copyReport}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Warning Signs & Evidence Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>{t.results.evidenceHeading}</span>
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {result.findings.length} signal{result.findings.length === 1 ? '' : 's'} identified
          </span>
        </div>

        {result.findings.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <span>
              No immediate high-risk indicators were detected in this submission. However, always exercise caution with unexpected financial requests.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {result.findings.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.severity === 'high'
                          ? 'bg-red-500'
                          : item.severity === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    {item.label}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      item.severity === 'high'
                        ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                        : item.severity === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                        : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20'
                    }`}
                  >
                    {item.severity} severity
                  </span>
                </div>

                {item.evidence && (
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-300 break-words">
                    <span className="text-slate-500 dark:text-slate-400 font-sans block text-[10px] mb-0.5">
                      Flagged content excerpt:
                    </span>
                    "{item.evidence}"
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPI Intent Breakdown (if QR code scanned) */}
      {result.technical_details?.upiDetails && (
        <div className="p-5 rounded-xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-teal-800 dark:text-teal-300 flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Decoded UPI Payment Parameters
            </span>
            <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
              Inspection Pre-Payment
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1220] border border-teal-200/80 dark:border-teal-900/50">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Payee VPA (UPI ID):</span>
              <span className="font-mono text-slate-900 dark:text-white font-semibold">
                {result.technical_details.upiDetails.payeeVpa || 'Not specified in QR'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1220] border border-teal-200/80 dark:border-teal-900/50">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Recipient Display Name:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {result.technical_details.upiDetails.payeeName || 'Unknown / Unnamed'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1220] border border-teal-200/80 dark:border-teal-900/50">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Requested Amount:</span>
              <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                {result.technical_details.upiDetails.amount
                  ? `₹${result.technical_details.upiDetails.amount}`
                  : 'Open (User enters amount)'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-[#0B1220] border border-teal-200/80 dark:border-teal-900/50">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Transaction Note:</span>
              <span className="text-slate-700 dark:text-slate-200">
                {result.technical_details.upiDetails.transactionNote || 'None'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-teal-800 dark:text-teal-300/90 italic">
            Remember: Scanning a QR code ALWAYS sends money out from your account. You NEVER need to scan a QR or enter your UPI PIN to receive money!
          </p>
        </div>
      )}

      {/* What You Should Do (Protective Action Steps) */}
      <div className="space-y-3">
        <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>{t.results.actionsHeading}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.recommended_actions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 font-bold text-[11px] shrink-0 mt-0.5 border border-teal-200 dark:border-teal-500/20">
                {idx + 1}
              </div>
              <span className="leading-relaxed">{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Details Accordion */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-slate-400" />
            {t.results.technicalDetails}
          </span>
          {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTechnical && (
          <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 text-xs space-y-2 font-mono text-slate-700 dark:text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Detection Engines:</span>
              <span className="text-slate-900 dark:text-white">{result.detection_engines_used.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-sans">Analysis Timestamp:</span>
              <span className="text-slate-600 dark:text-slate-300">{new Date(result.timestamp).toLocaleString()}</span>
            </div>
            {result.technical_details?.domain && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">Target Domain:</span>
                <span className="text-blue-600 dark:text-blue-400">{result.technical_details.domain}</span>
              </div>
            )}
            {result.technical_details?.isHttps !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">HTTPS Status:</span>
                <span className={result.technical_details.isHttps ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {result.technical_details.isHttps ? 'Encrypted (HTTPS)' : 'Insecure (HTTP)'}
                </span>
              </div>
            )}
            {result.technical_details?.ssrfProtected && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-sans">SSRF Sandbox Protection:</span>
                <span className="text-teal-600 dark:text-teal-400">Active (Loopback & Private Subnets Blocked)</span>
              </div>
            )}
            {result.technical_details?.transcript && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 font-sans block mb-1">Call Transcript Analyzed:</span>
                <p className="font-sans text-slate-700 dark:text-slate-300 text-[11px] italic bg-white dark:bg-slate-900/60 p-2 rounded border border-slate-200 dark:border-slate-800">
                  "{result.technical_details.transcript}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Safety Notice & Footer Buttons */}
      <div className="space-y-4 pt-2">
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80">
          {t.results.safetyDisclaimer}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            onClick={onNewScan}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.results.newScan}</span>
          </button>

          <button
            onClick={onReportFalsePositive}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{t.results.reportFalsePositive}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
