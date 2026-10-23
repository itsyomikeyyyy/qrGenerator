/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HistoryItem, BarcodeFormat } from '../types';
import { 
  X, 
  Trash2, 
  Star, 
  Copy, 
  Check, 
  ArrowRight, 
  Barcode, 
  QrCode,
  Search,
  ExternalLink
} from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearHistory: () => void;
  onSelectItem: (item: HistoryItem) => void;
  historyEnabled: boolean;
  onToggleHistoryEnabled: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onToggleFavorite,
  onDeleteItem,
  onClearHistory,
  onSelectItem,
  historyEnabled,
  onToggleHistoryEnabled,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'barcode' | 'qrcode'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = items.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        item.formatOrType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = async (id: string, val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              History & Saved Codes
            </h2>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code value or title..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('barcode')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filterType === 'barcode'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Barcodes
              </button>
              <button
                type="button"
                onClick={() => setFilterType('qrcode')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  filterType === 'qrcode'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                QR Codes
              </button>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            )}
          </div>

          {/* Privacy & Retention Control */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Local Browser Storage Only (No Cloud)</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={historyEnabled}
                onChange={onToggleHistoryEnabled}
                className="rounded border-slate-300 text-slate-900"
              />
              <span>Keep History</span>
            </label>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelectItem(item);
                onClose();
              }}
              className="p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 w-7 h-7 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  {item.type === 'barcode' ? (
                    <Barcode className="w-4 h-4" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {item.title}
                  </div>
                  <div className="font-mono text-xs text-slate-600 truncate mt-0.5">
                    {item.value}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span className="uppercase font-semibold tracking-wider text-slate-500">
                      {item.formatOrType}
                    </span>
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                  title="Toggle Favorite"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      item.isFavorite ? 'text-amber-500 fill-amber-500' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCopy(item.id, item.value, e)}
                  className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                  title="Copy value"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No saved codes found. Generate barcodes or QR codes to save them here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
