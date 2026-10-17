import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  ShieldAlert,
  Workflow,
  GraduationCap,
  Users,
  Clock,
  PhoneCall,
  X,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

export type NavigationPage =
  | 'home'
  | 'scanner'
  | 'how-it-works'
  | 'learn'
  | 'reports'
  | 'history';

interface SidebarProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  historyCount: number;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  language,
  onLanguageChange,
  historyCount,
  isOpenOnMobile,
  onCloseMobile,
}) => {
  const t = translations[language];

  const navItems: { id: NavigationPage; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'home', label: t.nav.home, icon: LayoutDashboard },
    { id: 'scanner', label: t.nav.scan, icon: ShieldAlert },
    { id: 'how-it-works', label: t.nav.howItWorks, icon: Workflow },
    { id: 'learn', label: t.nav.learn, icon: GraduationCap },
    { id: 'reports', label: t.nav.reports, icon: Users },
    { id: 'history', label: t.nav.history, icon: Clock, badge: historyCount },
  ];

  const handleItemClick = (page: NavigationPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="sidebar-surface flex flex-col h-full bg-white dark:bg-[#0B1220] border-r border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-colors duration-200">
      {/* 1. Header / Logo Area */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleItemClick('home')}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-sky-500 to-teal-400 p-0.5 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/35 transition-all">
              <div className="w-full h-full bg-white dark:bg-[#0B1220] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-teal-400 group-hover:scale-105 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white font-sans">
                  {t.appName}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Detect. Protect. Stay Safe.
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-cyan-400 border border-sky-200 dark:border-cyan-500/30 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-sky-600 dark:text-cyan-400'
                      : 'text-slate-400 dark:text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-sky-600 text-white dark:bg-cyan-500/20 dark:text-cyan-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Bottom Footer & Language Selection */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3 bg-slate-50/70 dark:bg-[#070C15]/50">
        {/* Language selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Language:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-white dark:bg-[#111C30] p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 text-[11px] font-medium">
            <button
              onClick={() => onLanguageChange('en')}
              className={`py-1 rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`py-1 rounded-lg transition-all ${
                language === 'hi'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              हिंदी
            </button>
            <button
              onClick={() => onLanguageChange('mr')}
              className={`py-1 rounded-lg transition-all ${
                language === 'mr'
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              मराठी
            </button>
          </div>
        </div>

        {/* Emergency helpline badge */}
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/25 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-red-700 dark:text-red-400 block leading-tight">
                Helpline 1930
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                National Cyber Crime
              </span>
            </div>
          </div>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            title="cybercrime.gov.in"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block w-70 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenOnMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-fadeIn">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
