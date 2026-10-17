import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { educationalArticles, quizQuestions } from '../data/educationData';

interface LearnSectionProps {
  language: Language;
}

export const LearnAndStaySafeSection: React.FC<LearnSectionProps> = ({ language }) => {
  const t = translations[language];

  // Articles state
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(educationalArticles[0].id);

  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasCheckedAnswer, setHasCheckedAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const handleSelectOption = (idx: number) => {
    if (hasCheckedAnswer) return;
    setSelectedOptionIndex(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOptionIndex === null) return;
    setHasCheckedAnswer(true);
    if (currentQuestion.options[selectedOptionIndex].isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setHasCheckedAnswer(false);
    } else {
      setIsQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setHasCheckedAnswer(false);
    setScore(0);
    setIsQuizCompleted(false);
  };

  return (
    <section id="learn" className="py-16 bg-white dark:bg-[#0B1220] border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center space-y-2.5 max-w-3xl mx-auto">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20 uppercase tracking-wider">
            {t.learn.badge}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t.learn.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
            {t.learn.subtitle}
          </p>
        </div>

        {/* 1. Educational Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {educationalArticles.map((article) => {
            const isExpanded = expandedArticleId === article.id;
            return (
              <div
                key={article.id}
                className="rounded-2xl bg-slate-50 dark:bg-[#111C30] border border-slate-200 dark:border-slate-800 p-6 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{article.readTime}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {article.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {article.summary}
                </p>

                {/* Example scenario box */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 font-mono">
                  <span className="text-slate-500 dark:text-slate-400 block font-sans text-[10px] mb-1">
                    Realistic Scenario:
                  </span>
                  "{article.exampleScenario}"
                </div>

                {/* Expand / Collapse Button */}
                <button
                  onClick={() =>
                    setExpandedArticleId(isExpanded ? null : article.id)
                  }
                  className="w-full flex items-center justify-between text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 pt-2 border-t border-slate-200 dark:border-slate-800/80 cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Safety Rules' : 'Read Warning Signs & Protection Rules'}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="space-y-4 pt-2 text-xs border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
                    <div className="space-y-1.5">
                      <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Warning Signs:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                        {article.warningSigns.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        How to Protect Yourself:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1">
                        {article.protectionSteps.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/20 p-3 rounded-xl">
                      <span className="font-bold text-red-700 dark:text-red-400 block">
                        If You Suspect You Were Scammed:
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[11px]">
                        {article.actionIfVictim.map((a, idx) => (
                          <li key={idx}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 2. Interactive "Spot the Scam" Challenge Quiz */}
        <div className="rounded-3xl bg-slate-50 dark:bg-gradient-to-b dark:from-[#111C30] dark:to-[#0d1627] border border-slate-200 dark:border-blue-500/30 p-6 sm:p-8 shadow-sm dark:shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.learn.quizBadge}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.learn.quizTitle}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
                {t.learn.quizSubtitle}
              </p>
            </div>

            {/* Score Tracker */}
            <div className="flex items-center gap-3 bg-white dark:bg-[#0B1220] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.learn.quizScore}:</span>
              <span className="text-base font-bold text-teal-600 dark:text-teal-400">
                {score} / {quizQuestions.length}
              </span>
            </div>
          </div>

          {!isQuizCompleted ? (
            <div className="space-y-5">
              {/* Question Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Scenario {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  {currentQuestion.type}
                </span>
              </div>

              {/* Scenario Context */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {currentQuestion.scenario}
                </p>

                {/* Simulated message or phone card */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5 font-mono">
                    <span>Sender: {currentQuestion.sender}</span>
                    <span>Received Now</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed">
                    {currentQuestion.content}
                  </p>
                </div>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  What would you do?
                </span>

                <div className="space-y-2">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOptionIndex === idx;
                    let optionStyle =
                      'bg-white dark:bg-[#0B1220] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200';

                    if (isSelected && !hasCheckedAnswer) {
                      optionStyle =
                        'bg-sky-50 dark:bg-blue-900/30 border-sky-400 dark:border-blue-500 text-sky-900 dark:text-white shadow-xs';
                    }

                    if (hasCheckedAnswer) {
                      if (option.isCorrect) {
                        optionStyle = 'bg-green-50 dark:bg-green-950/40 border-green-500 text-green-900 dark:text-green-300';
                      } else if (isSelected && !option.isCorrect) {
                        optionStyle = 'bg-red-50 dark:bg-red-950/40 border-red-500 text-red-900 dark:text-red-300';
                      } else {
                        optionStyle = 'opacity-40 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1220] text-slate-400';
                      }
                    }

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-start gap-3 ${optionStyle}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            isSelected ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="leading-relaxed">{option.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback and Explanation */}
              {hasCheckedAnswer && selectedOptionIndex !== null && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fadeIn ${
                    currentQuestion.options[selectedOptionIndex].isCorrect
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-500/40 text-green-800 dark:text-green-300'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {currentQuestion.options[selectedOptionIndex].isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span>Correct Instinct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span>Dangerous Choice!</span>
                      </>
                    )}
                  </div>
                  <p className="leading-relaxed">
                    {currentQuestion.options[selectedOptionIndex].explanation}
                  </p>
                </div>
              )}

              {/* Quiz Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                {!hasCheckedAnswer ? (
                  <button
                    disabled={selectedOptionIndex === null}
                    onClick={handleCheckAnswer}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    {t.learn.checkAnswer}
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {currentQuestionIndex < quizQuestions.length - 1
                        ? t.learn.nextQuestion
                        : 'Finish Challenge'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Completed State */
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Challenge Completed!</h4>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm max-w-md mx-auto">
                  You scored <strong className="text-teal-600 dark:text-teal-400 font-bold">{score}</strong> out of{' '}
                  <strong className="text-slate-900 dark:text-white">{quizQuestions.length}</strong>.
                  {score === quizQuestions.length
                    ? ' Perfect score! You have sharp scam detection reflexes.'
                    : ' Good effort! Review the warning signs above to stay one step ahead of digital fraudsters.'}
                </p>
              </div>

              <button
                onClick={handleRestartQuiz}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{t.learn.restartQuiz}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
