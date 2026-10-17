import React from 'react';
import { X, Trash2, ShieldCheck, AlertTriangle, ShieldAlert, Clock, ArrowRight } from 'lucide-react';
import { ScanResult, Language } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ScanResult[];
  onClearHistory: () => void;
  onSelectScan: (scan: ScanResult) => void;
  language: Language;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectScan,
}) => {
  if (!isOpen) return null;

  const totalScans = history.length;
  const highRiskCount = history.filter((s) => s.risk_score >= 70).length;
  const suspiciousCount = history.filter((s) => s.risk_score >= 30 && s.risk_score < 70).length;
  const safeCount = history.filter((s) => s.risk_score < 30).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#111C30] border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl text-slate-900 dark:text-white transition-colors duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Local Scan Session History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800 text-center text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Total Scans</span>
            <span className="text-base font-bold text-slate-900 dark:text-white">{totalScans}</span>
          </div>
          <div>
            <span className="text-red-600 dark:text-red-400 block text-[10px] uppercase font-semibold">High Risk</span>
            <span className="text-base font-bold text-red-600 dark:text-red-400">{highRiskCount}</span>
          </div>
          <div>
            <span className="text-amber-600 dark:text-amber-400 block text-[10px] uppercase font-semibold">Suspicious</span>
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">{suspiciousCount}</span>
          </div>
          <div>
            <span className="text-green-600 dark:text-green-400 block text-[10px] uppercase font-semibold">Safe</span>
            <span className="text-base font-bold text-green-600 dark:text-green-400">{safeCount}</span>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-500 opacity-60" />
              <p>No scans in this session yet.</p>
              <p className="text-[11px] text-slate-400">
                Scanned messages, links, and QR codes will appear here for quick review.
              </p>
            </div>
          ) : (
            history.map((scan) => {
              const isHigh = scan.risk_score >= 70;
              const isSusp = scan.risk_score >= 30 && scan.risk_score < 70;
              const Icon = isHigh ? ShieldAlert : isSusp ? AlertTriangle : ShieldCheck;
              const color = isHigh
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30'
                : isSusp
                ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
                : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30';

              return (
                <div
                  key={scan.id}
                  onClick={() => {
                    onSelectScan(scan);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B1220] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase font-mono">
                          {scan.input_type}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-sm">
                        {scan.input_preview}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
                      {scan.risk_score}/100
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#0B1220] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Stored locally in your private session memory.
          </span>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
