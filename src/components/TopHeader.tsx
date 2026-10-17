import React, { useEffect, useRef, useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Palette,
  Landmark,
  Check,
  ShieldPlus,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { NavigationPage } from './Sidebar';
import { Language, Theme } from '../types';
import { translations } from '../translations';

interface TopHeaderProps {
  currentPage: NavigationPage;
  onOpenMobileSidebar: () => void;
  theme: Theme;
  onSelectTheme: (theme: Theme) => void;
  onNewScan: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  language: Language;
}

interface ThemeOption {
  id: Theme;
  label: string;
  hint: string;
  icon: React.ElementType;
}

const themeOptions: ThemeOption[] = [
  {
    id: 'light',
    label: 'Light',
    hint: 'Original light theme',
    icon: Sun,
  },
  {
    id: 'dark',
    label: 'Dark',
    hint: 'Original dark theme',
    icon: Moon,
  },
  {
    id: 'classic',
    label: 'Classic Cream & Navy',
    hint: 'Warm cream & deep navy',
    icon: Landmark,
  },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPage,
  onOpenMobileSidebar,
  theme,
  onSelectTheme,
  onNewScan,
  onOpenHistory,
  historyCount,
  language,
}) => {
  const t = translations[language];

  // Theme selector menu state
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isThemeMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemeMenuOpen(false);
        themeButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isThemeMenuOpen]);

  // Move focus to the currently selected theme option when the menu opens
  useEffect(() => {
    if (!isThemeMenuOpen || !themeMenuRef.current) return;
    const checked = themeMenuRef.current.querySelector<HTMLButtonElement>('[aria-checked="true"]');
    const first = themeMenuRef.current.querySelector<HTMLButtonElement>('button');
    (checked ?? first)?.focus();
  }, [isThemeMenuOpen]);

  const getPageInfo = (page: NavigationPage) => {
    switch (page) {
      case 'home':
        return {
          title: 'Security Overview & Detection',
          description: 'One click before you pay. Understand digital fraud risks in seconds.',
        };
      case 'scanner':
        return {
          title: t.scanner.title,
          description: t.scanner.subtitle,
        };
      case 'how-it-works':
        return {
          title: t.howItWorks.title,
          description: t.howItWorks.subtitle,
        };
      case 'learn':
        return {
          title: t.learn.title,
          description: t.learn.subtitle,
        };
      case 'reports':
        return {
          title: t.reports.title,
          description: t.reports.subtitle,
        };
      case 'history':
        return {
          title: 'Session Scan History',
          description: 'Review past evaluated messages, links, QR codes, and phone calls in your private session.',
        };
      default:
        return {
          title: 'AI Scam Shield Dashboard',
          description: t.tagline,
        };
    }
  };

  const { title, description } = getPageInfo(currentPage);

  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Left: Mobile Menu + Page Title & Description */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block max-w-xl">
                {description}
              </p>
            </div>
          </div>

          {/* Right: API Status, New Scan Button, Theme Toggle */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Real-time Engine Status Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI Shield Active</span>
            </div>

            {/* Quick History Button */}
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#111C30] hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="View Scan History"
            >
              <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">{t.nav.history}</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 bg-sky-500/15 text-sky-700 dark:text-cyan-400 text-[10px] rounded-full font-mono font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Primary "New Scan" Action Button */}
            <button
              onClick={onNewScan}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-blue-500/35 transition-all cursor-pointer active:scale-98"
            >
              <ShieldPlus className="w-4 h-4" />
              <span className="whitespace-nowrap">New Scan</span>
            </button>

            {/* Theme Selector (Palette menu: Light / Dark / Classic) */}
            <div className="relative" ref={themeMenuRef}>
              <button
                ref={themeButtonRef}
                onClick={() => setIsThemeMenuOpen((open) => !open)}
                className={`p-2 rounded-xl bg-slate-100 dark:bg-[#111C30] hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer ${
                  isThemeMenuOpen ? 'bg-slate-200/80 ring-2 ring-sky-500/30' : ''
                }`}
                aria-label="Select theme"
                aria-haspopup="menu"
                aria-expanded={isThemeMenuOpen}
                aria-controls="theme-selector-menu"
                title="Select theme"
              >
                <Palette className="w-4 h-4" />
              </button>

              {isThemeMenuOpen && (
                <div
                  id="theme-selector-menu"
                  role="menu"
                  aria-label="Theme selection"
                  className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111C30] shadow-lg dark:shadow-2xl p-1.5 z-50 animate-fadeIn"
                >
                  <div className="px-2.5 pt-1.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Appearance
                  </div>

                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = theme === option.id;

                    return (
                      <button
                        key={option.id}
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => {
                          onSelectTheme(option.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-cyan-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-sky-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-semibold truncate">{option.label}</span>
                          <span className="block text-[10px] text-slate-400 dark:text-slate-400 truncate">
                            {option.hint}
                          </span>
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
