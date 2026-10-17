import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  HeartHandshake,
  Lock,
  AlertOctagon,
  CheckCircle2,
  PhoneCall,
  QrCode,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface HeroSectionProps {
  language: Language;
  onCheckScams: () => void;
  onExploreHowItWorks: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  language,
  onCheckScams,
  onExploreHowItWorks,
}) => {
  const t = translations[language];

  return (
    <section id="hero" className="relative bg-white dark:bg-[#0B1220] text-slate-900 dark:text-white pt-10 pb-16 transition-colors duration-200 overflow-hidden">
      {/* Background Subtle Tech Grid & Glow */}
      <div className="absolute inset-0 hero-grid [background-size:24px_24px] opacity-40 dark:opacity-25 pointer-events-none" />
      <div className="absolute -top-40 right-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-400 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t.hero.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              {t.hero.headline}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              {t.hero.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
              <button
                onClick={onCheckScams}
                className="inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer"
              >
                <ShieldAlert className="w-5 h-5 text-white" />
                <span>{t.hero.ctaPrimary}</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>

              <button
                onClick={onExploreHowItWorks}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#111C30] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer"
              >
                <span>{t.hero.ctaSecondary}</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-[#111C30] border border-teal-200/80 dark:border-slate-800 text-teal-600 dark:text-teal-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t.hero.trust1}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.hero.trust1Desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-[#111C30] border border-blue-200/80 dark:border-slate-800 text-blue-600 dark:text-blue-400 shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t.hero.trust2}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.hero.trust2Desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-[#111C30] border border-amber-200/80 dark:border-slate-800 text-amber-600 dark:text-amber-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{t.hero.trust3}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.hero.trust3Desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Security Dashboard Preview */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-700/80 p-6 shadow-xl dark:shadow-2xl dark:shadow-blue-950/60 transition-colors duration-200">
              {/* Header of Preview */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t.hero.liveDemoBadge}
                  </span>
                </div>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 font-semibold flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  {t.hero.highRisk}
                </span>
              </div>

              {/* Sample Message Body */}
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed relative">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1 font-sans">
                  <span>Incoming SMS • +91 98210-XXXXX</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Threat Detected</span>
                </div>
                "{t.hero.sampleMessage}"
              </div>

              {/* Risk Gauge Bar Preview */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Calculated Fraud Probability</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{t.hero.riskScore}</span>
                </div>
                {/* Visual score bar */}
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="w-[15%] bg-green-500" />
                  <div className="w-[35%] bg-amber-500" />
                  <div className="w-[50%] bg-red-500" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  <span>0 Safe</span>
                  <span>30 Suspicious</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">92 High Risk</span>
                </div>
              </div>

              {/* Quick Findings Breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">Psychological Urgency:</strong> Threatens instant power cutoff tonight at 9:30 PM.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">Impersonation:</strong> Directs call to personal 10-digit mobile number instead of official power board discom.
                  </span>
                </div>
              </div>

              {/* Multi-channel chips */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-[11px]">
                  <FileText className="w-3.5 h-3.5 text-blue-500" /> SMS
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <QrCode className="w-3.5 h-3.5 text-teal-500" /> UPI QR
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500" /> URLs
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <PhoneCall className="w-3.5 h-3.5 text-purple-500" /> Voice Call
                </span>
              </div>

              <p className="mt-3 text-[10px] text-slate-400 text-center italic">
                {t.hero.demoNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
