/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GeneratorMode, HistoryItem, BarcodeFormat, BarcodeConfig, QRConfig, QRType } from './types';
import { logger } from './utils/logger';
import { Header } from './components/Header';
import { BarcodeGenerator } from './components/BarcodeGenerator';
import { QRCodeGenerator } from './components/QRCodeGenerator';
import { BatchGenerator } from './components/BatchGenerator';
import { LabelSheetGenerator } from './components/LabelSheetGenerator';
import { CodeScanner } from './components/CodeScanner';
import { HistoryDrawer } from './components/HistoryDrawer';
import { AboutModal } from './components/AboutModal';

const HISTORY_STORAGE_KEY = 'opencode_history_v1';
const HISTORY_ENABLED_KEY = 'opencode_history_enabled';
const THEME_STORAGE_KEY = 'opencode_theme';

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentMode, setCurrentMode] = useState<GeneratorMode>('qrcode');
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // 300ms delay to make load-up look premium
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const [historyEnabled, setHistoryEnabled] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(HISTORY_ENABLED_KEY);
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  });

  // History state persisted in localStorage
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      logger.warn('Could not read history from localStorage', e);
    }
    // Default initial history sample
    return [
      {
        id: 'hist-1',
        type: 'barcode',
        title: 'Organic Fair-Trade Coffee 12oz',
        formatOrType: 'UPC',
        value: '012345678905',
        createdAt: Date.now() - 3600000,
        isFavorite: true,
      },
      {
        id: 'hist-2',
        type: 'barcode',
        title: 'Clean Code: A Handbook of Agile Software Craft',
        formatOrType: 'ISBN',
        value: '9780306406157',
        createdAt: Date.now() - 7200000,
        isFavorite: false,
      },
      {
        id: 'hist-3',
        type: 'qrcode',
        title: 'OpenCode Studio Repository',
        formatOrType: 'url',
        value: 'https://github.com',
        createdAt: Date.now() - 10800000,
        isFavorite: true,
      },
    ];
  });

  // Prefilled states when passing between modes
  const [barcodePreload, setBarcodePreload] = useState<Partial<BarcodeConfig> | null>(null);
  const [qrPreload, setQrPreload] = useState<Partial<QRConfig> | null>(null);
  const [labelSheetPreload, setLabelSheetPreload] = useState<{
    value: string;
    label: string;
    price?: string;
    format?: BarcodeFormat;
    isQr?: boolean;
  } | null>(null);

  // Sync theme
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {}
  }, [darkMode]);

  // Sync history retention preference
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_ENABLED_KEY, String(historyEnabled));
    } catch {}
  }, [historyEnabled]);

  // Persist history changes
  useEffect(() => {
    try {
      if (historyEnabled) {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyItems));
      } else {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
      }
    } catch (e) {
      logger.warn('Could not save history to localStorage', e);
    }
  }, [historyItems, historyEnabled]);

  const handleSaveToHistory = (item: Omit<HistoryItem, 'id' | 'createdAt'>) => {
    if (!historyEnabled) return;
    const newItem: HistoryItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
      isFavorite: false,
    };
    setHistoryItems((prev) => [newItem, ...prev.slice(0, 49)]); // keep up to 50
  };

  const handleToggleFavorite = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isFavorite: !i.isFavorite } : i))
    );
  };

  const handleDeleteItem = (id: string) => {
    setHistoryItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your saved history?')) {
      setHistoryItems([]);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.type === 'barcode') {
      setBarcodePreload({
        format: (item.formatOrType as BarcodeFormat) || 'UPC',
        value: item.value,
        topLabel: item.title,
      });
      setCurrentMode('barcode');
    } else {
      setQrPreload({
        type: (item.formatOrType as QRType) || 'url',
        rawValue: item.value,
      });
      setCurrentMode('qrcode');
    }
  };

  const handleSendToLabelSheet = (item: {
    value: string;
    label: string;
    price?: string;
    format?: BarcodeFormat;
    isQr?: boolean;
  }) => {
    setLabelSheetPreload(item);
    setCurrentMode('labels');
  };

  const handleLoadScannedInBarcode = (value: string, format?: BarcodeFormat) => {
    setBarcodePreload({
      value,
      format: format || 'UPC',
      topLabel: `Scanned ${format || 'Barcode'}`,
    });
    setCurrentMode('barcode');
  };

  const handleLoadScannedInQr = (value: string) => {
    setQrPreload({
      type: 'url',
      rawValue: value,
    });
    setCurrentMode('qrcode');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center text-center animate-studio-fade-in max-w-sm">
          {/* Studio Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-800 dark:to-slate-900 shadow-xl border border-slate-700/40 flex items-center justify-center mb-5 text-white">
            <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5v14" />
              <path d="M8 5v14" />
              <path d="M12 5v14" />
              <path d="M17 5v14" />
              <path d="M21 5v14" />
            </svg>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            OpenCode Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Free QR Code & Barcode Studio
          </p>

          {/* 300ms micro-progress bar */}
          <div className="w-44 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full animate-progress-sweep" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col selection:bg-slate-900 selection:text-white transition-colors animate-studio-fade-in ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Bar Navigation */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        historyCount={historyItems.length}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />

      {/* Main Mode Viewport with smooth fade animation and 300ms delayed entrance */}
      <main className="flex-1 animate-studio-fade-in-delayed" key={currentMode}>
        {currentMode === 'barcode' && (
          <BarcodeGenerator
            initialConfig={barcodePreload || undefined}
            onSaveToHistory={handleSaveToHistory}
            onSendToLabelSheet={(item) =>
              handleSendToLabelSheet({
                value: item.value,
                label: item.label,
                price: item.price,
                format: item.format,
                isQr: false,
              })
            }
          />
        )}

        {currentMode === 'qrcode' && (
          <QRCodeGenerator
            initialConfig={qrPreload || undefined}
            onSaveToHistory={handleSaveToHistory}
            onSendToLabelSheet={(item) =>
              handleSendToLabelSheet({
                value: item.value,
                label: item.label,
                price: item.price,
                isQr: true,
              })
            }
          />
        )}

        {currentMode === 'batch' && <BatchGenerator />}

        {currentMode === 'labels' && (
          <LabelSheetGenerator initialItem={labelSheetPreload || undefined} />
        )}

        {currentMode === 'scan' && (
          <CodeScanner
            onLoadInBarcode={handleLoadScannedInBarcode}
            onLoadInQr={handleLoadScannedInQr}
          />
        )}
      </main>

      {/* Footer conforming strictly to Frontend Design anti-slop rules (no decorative pulsers, no fake telemetry) */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-900">OpenCode Studio</span>
            <span aria-hidden="true">·</span>
            <span>Free & Open Source</span>
            <span aria-hidden="true">·</span>
            <span>MIT License</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setCurrentMode('barcode')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              UPC & Barcodes
            </button>
            <button
              onClick={() => setCurrentMode('qrcode')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              QR Codes
            </button>
            <button
              onClick={() => setCurrentMode('batch')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Batch ZIP Export
            </button>
            <button
              onClick={() => setCurrentMode('labels')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Print Labels
            </button>
            <button
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Privacy & Docs
            </button>
          </div>
        </div>
      </footer>

      {/* History Slide-Over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onToggleFavorite={handleToggleFavorite}
        onDeleteItem={handleDeleteItem}
        onClearHistory={handleClearHistory}
        onSelectItem={handleSelectHistoryItem}
        historyEnabled={historyEnabled}
        onToggleHistoryEnabled={() => setHistoryEnabled((prev) => !prev)}
      />

      {/* About & Privacy Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}
