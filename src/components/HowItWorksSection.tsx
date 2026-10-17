import React from 'react';
import { ArrowRight, Cpu, FileCheck2, Gauge, ShieldAlert } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface HowItWorksProps {
  language: Language;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({ language }) => {
  const t = translations[language];

  const steps = [
    {
      num: '01',
      title: t.howItWorks.steps.step1Title,
      desc: t.howItWorks.steps.step1Desc,
      icon: ShieldAlert,
      color: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-500/30',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
    },
    {
      num: '02',
      title: t.howItWorks.steps.step2Title,
      desc: t.howItWorks.steps.step2Desc,
      icon: Cpu,
      color: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-500/30',
      bg: 'bg-teal-50 dark:bg-teal-500/10',
    },
    {
      num: '03',
      title: t.howItWorks.steps.step3Title,
      desc: t.howItWorks.steps.step3Desc,
      icon: Gauge,
      color: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-500/30',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      num: '04',
      title: t.howItWorks.steps.step4Title,
      desc: t.howItWorks.steps.step4Desc,
      icon: FileCheck2,
      color: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-500/30',
      bg: 'bg-green-50 dark:bg-green-500/10',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 bg-white dark:bg-[#0B1220] border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2.5 max-w-3xl mx-auto mb-14">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 uppercase tracking-wider">
            {t.howItWorks.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.howItWorks.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            {t.howItWorks.subtitle}
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl bg-slate-50 dark:bg-[#111C30] border border-slate-200 dark:border-slate-800 p-6 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:-translate-y-0.5 duration-200 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-11 h-11 rounded-xl ${step.bg} border ${step.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <span className="text-2xl font-black text-slate-300 dark:text-slate-700 font-mono">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  {step.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.desc}
                </p>

                {idx < 3 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300 dark:text-slate-600">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
