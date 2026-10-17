import React from 'react';
import { ShieldCheck, PhoneCall, Globe, Shield, ExternalLink } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { NavigationPage } from './Sidebar';

interface FooterProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onNavigate: (page: NavigationPage) => void;
}

export const Footer: React.FC<FooterProps> = ({
  language,
  onLanguageChange,
  onNavigate,
}) => {
  const t = translations[language];

  return (
    <footer className="bg-slate-100 dark:bg-[#070C15] text-slate-700 dark:text-white border-t border-slate-200 dark:border-slate-800/90 pt-14 pb-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Emergency Helpline Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-100/80 via-white to-blue-100/80 dark:from-red-950/40 dark:via-[#111C30] dark:to-blue-950/40 border border-red-200 dark:border-red-500/25 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-500/30">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                {t.footer.emergencyHelpline}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                If you have been defrauded, call immediately within the golden hour to freeze illicit transactions.
              </span>
            </div>
          </div>

          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-red-600 text-white dark:bg-red-600/20 dark:text-red-300 border border-transparent dark:border-red-500/30 text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:bg-red-700 dark:hover:bg-red-600/30 transition-all cursor-pointer"
          >
            <span>cybercrime.gov.in</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Main Footer Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 p-0.5">
                <div className="w-full h-full bg-white dark:bg-[#0B1220] rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-teal-400" />
                </div>
              </div>
              <span className="font-bold text-base text-slate-900 dark:text-white font-sans">{t.appName}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              {t.mission}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <Globe className="w-3.5 h-3.5" />
              <span>Available in:</span>
              <button
                onClick={() => onLanguageChange('en')}
                className={`hover:underline cursor-pointer ${language === 'en' ? 'text-sky-600 dark:text-teal-400 font-bold' : ''}`}
              >
                English
              </button>
              <span>•</span>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`hover:underline cursor-pointer ${language === 'hi' ? 'text-sky-600 dark:text-teal-400 font-bold' : ''}`}
              >
                हिंदी
              </button>
              <span>•</span>
              <button
                onClick={() => onLanguageChange('mr')}
                className={`hover:underline cursor-pointer ${language === 'mr' ? 'text-sky-600 dark:text-teal-400 font-bold' : ''}`}
              >
                मराठी
              </button>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('scanner')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.scan}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('how-it-works')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.howItWorks}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('learn')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.learn}
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('reports')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.reports}
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Security Standards
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Zero PIN / Password Retention</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>SSRF Loopback Protection</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Indian Fraud Heuristic DB</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Ephemeral Audio Discard</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security Disclaimer Box */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed shadow-xs">
          <strong className="text-slate-800 dark:text-slate-300 block mb-1">Official Cybersecurity Advisory:</strong>
          {t.footer.disclaimer}
        </div>

        {/* Copyright & Meta */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>© {new Date().getFullYear()} AI Scam Shield. {t.footer.rights}</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">{t.footer.privacy}</span>
            <span>•</span>
            <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">{t.footer.terms}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
