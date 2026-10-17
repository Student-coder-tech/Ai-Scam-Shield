import React from 'react';
import { Users, Smartphone, GraduationCap, Store, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface AudienceSectionProps {
  language: Language;
}

export const AudienceSection: React.FC<AudienceSectionProps> = ({ language }) => {
  const t = translations[language];

  const cards = [
    {
      title: t.audience.seniorsTitle,
      desc: t.audience.seniorsDesc,
      icon: Users,
      badge: 'High Legibility',
      color: 'from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      highlights: ['Digital arrest fraud warning', 'Zero confusing acronyms', 'Audio explanation playback'],
    },
    {
      title: t.audience.upiTitle,
      desc: t.audience.upiDesc,
      icon: Smartphone,
      badge: 'Scan-to-Pay Protection',
      color: 'from-teal-500/10 to-cyan-500/5 dark:from-teal-500/20 dark:to-cyan-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/30',
      highlights: ['Clear "No PIN for receiving" reminder', 'Payee VPA verification', 'Malicious QR alerts'],
    },
    {
      title: t.audience.studentsTitle,
      desc: t.audience.studentsDesc,
      icon: GraduationCap,
      badge: 'Job & Loan Safety',
      color: 'from-blue-500/10 to-indigo-500/5 dark:from-blue-500/20 dark:to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
      highlights: ['Telegram task scam detector', 'Fake work-from-home offers', 'Phishing scholarship links'],
    },
    {
      title: t.audience.businessTitle,
      desc: t.audience.businessDesc,
      icon: Store,
      badge: 'Retail Integrity',
      color: 'from-emerald-500/10 to-green-500/5 dark:from-emerald-500/20 dark:to-green-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      highlights: ['Counterfeit merchant QR checks', 'Fake payment screenshots', 'Supplier invoice fraud alerts'],
    },
  ];

  return (
    <section className="py-16 bg-slate-50/50 dark:bg-[#0B1220] border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2.5 max-w-3xl mx-auto mb-14">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 uppercase tracking-wider">
            {t.audience.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.audience.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            {t.audience.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:-translate-y-0.5 shadow-xs"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} border`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {card.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
