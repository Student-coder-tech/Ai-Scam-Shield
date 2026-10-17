import React, { useState } from 'react';
import { ShieldCheck, Globe, Menu, X, Clock, AlertTriangle, Shield } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenHistory: () => void;
  historyCount: number;
  onNavigate: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  onOpenHistory,
  historyCount,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-800 text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Shield */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavClick('hero')}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#0B1220] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform duration-200" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-white font-sans">
                  {t.appName}
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                  AI DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('hero')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t.nav.home}
            </button>
            <button
              onClick={() => handleNavClick('scanner')}
              className="hover:text-teal-400 transition-colors cursor-pointer"
            >
              {t.nav.scan}
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t.nav.howItWorks}
            </button>
            <button
              onClick={() => handleNavClick('learn')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t.nav.learn}
            </button>
            <button
              onClick={() => handleNavClick('reports')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t.nav.reports}
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-[#111C30] border border-slate-700/80 rounded-lg p-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded transition-all font-medium ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-2.5 py-1 rounded transition-all font-medium ${
                  language === 'hi'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => onLanguageChange('mr')}
                className={`px-2.5 py-1 rounded transition-all font-medium ${
                  language === 'mr'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                मराठी
              </button>
            </div>

            {/* History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#111C30] hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium rounded-lg transition-all"
              title="View Scan History"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.nav.history}</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-blue-500/20 text-blue-400 text-[10px] rounded-full border border-blue-500/30">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Primary CTA */}
            <button
              onClick={() => handleNavClick('scanner')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold rounded-lg shadow-md shadow-blue-600/25 hover:shadow-blue-600/40 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span>{t.nav.scanNow}</span>
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Quick Lang Switcher on Mobile */}
            <select
              value={language}
              aria-label="Select Language"
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-[#111C30] border border-slate-700 text-xs text-slate-300 py-1.5 px-2 rounded-md"
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-[#111C30] rounded-lg transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B1220] border-b border-slate-800 px-4 pt-3 pb-5 space-y-3">
          <div className="grid grid-cols-1 gap-1 text-sm font-medium">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-left px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#111C30]"
            >
              {t.nav.home}
            </button>
            <button
              onClick={() => handleNavClick('scanner')}
              className="text-left px-3 py-2.5 rounded-lg text-teal-400 font-semibold hover:bg-[#111C30]"
            >
              {t.nav.scan}
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-left px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#111C30]"
            >
              {t.nav.howItWorks}
            </button>
            <button
              onClick={() => handleNavClick('learn')}
              className="text-left px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#111C30]"
            >
              {t.nav.learn}
            </button>
            <button
              onClick={() => handleNavClick('reports')}
              className="text-left px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#111C30]"
            >
              {t.nav.reports}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenHistory();
              }}
              className="text-left px-3 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#111C30] flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {t.nav.history}
              </span>
              {historyCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {historyCount}
                </span>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Language:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-3 py-1 text-xs rounded ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'bg-[#111C30] text-slate-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('hi')}
                className={`px-3 py-1 text-xs rounded ${
                  language === 'hi' ? 'bg-blue-600 text-white' : 'bg-[#111C30] text-slate-300'
                }`}
              >
                हिंदी
              </button>
              <button
                onClick={() => onLanguageChange('mr')}
                className={`px-3 py-1 text-xs rounded ${
                  language === 'mr' ? 'bg-blue-600 text-white' : 'bg-[#111C30] text-slate-300'
                }`}
              >
                मराठी
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
