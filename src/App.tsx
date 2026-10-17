import React, { useState, useEffect } from 'react';
import { Language, ScanResult, Theme } from './types';
import { Sidebar, NavigationPage } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { HeroSection } from './components/HeroSection';
import { ScannerSection } from './components/ScannerSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { AudienceSection } from './components/AudienceSection';
import { LearnAndStaySafeSection } from './components/LearnAndStaySafeSection';
import { CommunityReportsSection } from './components/CommunityReportsSection';
import { Footer } from './components/Footer';
import { HistoryModal } from './components/HistoryModal';
import { FalsePositiveModal } from './components/FalsePositiveModal';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Theme state: 'light' (Theme 1) | 'dark' (Theme 2) | 'classic' (Theme 3 — Classic Cream & Navy)
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('scam_shield_theme');
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'classic') {
        return savedTheme;
      }
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback
    }
    return 'dark';
  });

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('theme-classic', theme === 'classic');
    try {
      localStorage.setItem('scam_shield_theme', theme);
    } catch {
      // Fallback
    }
  }, [theme]);

  const handleSelectTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
  };

  // Local Scan History
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFalsePositiveOpen, setIsFalsePositiveOpen] = useState(false);
  const [falsePositiveTarget, setFalsePositiveTarget] = useState<ScanResult | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai_scam_shield_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveHistory = (newHistory: ScanResult[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('ai_scam_shield_history', JSON.stringify(newHistory));
    } catch {
      // Fallback
    }
  };

  const handleScanCompleted = (result: ScanResult) => {
    const updated = [result, ...history.filter((h) => h.id !== result.id)].slice(0, 30);
    saveHistory(updated);
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  // Navigation handler
  const handleNavigate = (page: NavigationPage) => {
    setCurrentPage(page);

    if (page === 'history') {
      setIsHistoryOpen(true);
      return;
    }

    const sectionIdMap: Record<string, string> = {
      home: 'hero',
      scanner: 'scanner',
      'how-it-works': 'how-it-works',
      learn: 'learn',
      reports: 'reports',
    };

    const targetId = sectionIdMap[page];
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // "New Scan" button handler from TopHeader
  const handleNewScan = () => {
    setCurrentPage('scanner');
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 flex font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* 1. Left-Side Fixed Navigation Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        language={language}
        onLanguageChange={setLanguage}
        historyCount={history.length}
        isOpenOnMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Content Viewport to the right */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          currentPage={currentPage}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          theme={theme}
          onSelectTheme={handleSelectTheme}
          onNewScan={handleNewScan}
          onOpenHistory={() => setIsHistoryOpen(true)}
          historyCount={history.length}
          language={language}
        />

        {/* Page Content */}
        <main className="flex-1 min-w-0">
          {/* Hero Section */}
          <HeroSection
            language={language}
            onCheckScams={() => handleNavigate('scanner')}
            onExploreHowItWorks={() => handleNavigate('how-it-works')}
          />

          {/* Dedicated Scanner Section */}
          <ScannerSection
            language={language}
            onScanCompleted={handleScanCompleted}
            onReportFalsePositive={(res) => {
              setFalsePositiveTarget(res);
              setIsFalsePositiveOpen(true);
            }}
            resetKey={resetKey}
          />

          {/* 4-Step Defensive Pipeline */}
          <HowItWorksSection language={language} />

          {/* Accessibility & Target Audience */}
          <AudienceSection language={language} />

          {/* Learn & Stay Safe: Educational Articles & Spot the Scam Quiz */}
          <LearnAndStaySafeSection language={language} />

          {/* Community Threat Reports & Live Awareness Feed */}
          <CommunityReportsSection language={language} />
        </main>

        {/* Footer */}
        <Footer
          language={language}
          onLanguageChange={setLanguage}
          onNavigate={handleNavigate}
        />
      </div>

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onSelectScan={() => {
          handleNavigate('scanner');
        }}
        language={language}
      />

      {/* Discrepancy / False Positive Modal */}
      <FalsePositiveModal
        isOpen={isFalsePositiveOpen}
        onClose={() => {
          setIsFalsePositiveOpen(false);
          setFalsePositiveTarget(null);
        }}
        result={falsePositiveTarget}
      />
    </div>
  );
}
