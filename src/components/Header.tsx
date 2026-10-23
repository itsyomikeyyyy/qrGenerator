/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GeneratorMode } from '../types';
import { 
  Barcode, 
  QrCode, 
  Layers, 
  Printer, 
  ScanLine, 
  History, 
  Github, 
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';

interface HeaderProps {
  currentMode: GeneratorMode;
  onSelectMode: (mode: GeneratorMode) => void;
  onOpenHistory: () => void;
  onOpenAbout: () => void;
  historyCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenHistory,
  onOpenAbout,
  historyCount,
  darkMode,
  onToggleDarkMode,
}) => {
  const navItems: { id: GeneratorMode; label: string; icon: React.ReactNode }[] = [
    { id: 'barcode', label: 'Barcode', icon: <Barcode className="w-4 h-4" /> },
    { id: 'qrcode', label: 'QR Code', icon: <QrCode className="w-4 h-4" /> },
    { id: 'batch', label: 'Batch Studio', icon: <Layers className="w-4 h-4" /> },
    { id: 'labels', label: 'Print Labels', icon: <Printer className="w-4 h-4" /> },
    { id: 'scan', label: 'Scan & Decode', icon: <ScanLine className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectMode('barcode')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-600 transition-colors">
                <Barcode className="w-4 h-4" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                  OpenCode Studio
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:block whitespace-nowrap">
                  Free & Open Source Generator
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {navItems.map((item) => {
              const isActive = currentMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectMode(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action / utility actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenHistory}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Recent History"
              aria-label="View history"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white text-[10px] font-mono font-medium rounded-full flex items-center justify-center">
                  {historyCount > 9 ? '9+' : historyCount}
                </span>
              )}
            </button>

            <button
              onClick={onToggleDarkMode}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenAbout}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="whitespace-nowrap">100% Client-Side</span>
            </button>

            <a
              href="https://github.com/itsyomikeyyyy/qrGenerator"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">Open Source</span>
            </a>
          </div>
        </div>

        {/* Mobile Navigation strip */}
        <div className="flex md:hidden items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectMode(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
