/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { BarcodeFormat } from '../types';
import { validateBarcode } from '../utils/barcodeUtils';
import { downloadZipBundle } from '../utils/exportUtils';
import { 
  Layers, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileArchive, 
  Loader2,
  Trash2,
  HelpCircle
} from 'lucide-react';

export const BatchGenerator: React.FC = () => {
  const [batchType, setBatchType] = useState<'barcode' | 'qrcode'>('barcode');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('UPC');
  const [rawText, setRawText] = useState<string>(
    '012345678905, Organic Dark Roast\n049000000443, Cola Beverage 12oz\n011110417004, Creamery Salted Butter\n028400064057, Baked Potato Crisps'
  );
  const [isProcessingZip, setIsProcessingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<string>('');

  // Form input IDs
  const batchTypeId = useId();
  const batchFormatId = useId();
  const batchTextareaId = useId();

  const MAX_BATCH_ITEMS = 500;

  // RFC-4180 compliant CSV line parser handling quotes, internal commas, and escaped quotes
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip next escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawLines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const isTruncated = rawLines.length > MAX_BATCH_ITEMS;
  const activeLines = isTruncated ? rawLines.slice(0, MAX_BATCH_ITEMS) : rawLines;

  // Parse items from input text (supports CSV: value, label or 1 value per line)
  const items = activeLines.map((line, index) => {
    const parts = parseCsvLine(line);
    const val = parts[0]?.trim() || '';
    const lbl = parts.slice(1).join(', ').trim() || `Item #${index + 1}`;
    
    let isValid = true;
    let errorMsg = '';

    if (batchType === 'barcode') {
      const res = validateBarcode(barcodeFormat, val);
      isValid = res.isValid;
      errorMsg = res.message || '';
    } else {
      isValid = val.length > 0;
    }

    return {
      id: `batch-${index}`,
      value: val,
      label: lbl,
      isValid,
      error: errorMsg,
    };
  });

  const validCount = items.filter((i) => i.isValid).length;
  const invalidCount = items.length - validCount;

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setRawText(text);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadAllZip = async (format: 'png' | 'svg') => {
    if (items.length === 0 || validCount === 0) return;
    setIsProcessingZip(true);
    setZipProgress('Initializing ZIP generator...');

    try {
      const zipFiles: { filename: string; blob: Blob }[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.isValid) continue;

        setZipProgress(`Rendering ${i + 1} of ${items.length}: ${item.value}`);

        const sanitizedLabel = (item.label || item.value).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${sanitizedLabel}_${item.value}.${format}`;

        if (batchType === 'barcode') {
          // Render barcode SVG
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          try {
            JsBarcode(svg, item.value, {
              format: barcodeFormat === 'ISBN' ? 'EAN13' : barcodeFormat,
              width: 2,
              height: 80,
              displayValue: true,
              margin: 10,
              font: 'monospace',
              fontSize: 14,
            });

            if (format === 'svg') {
              const xml = new XMLSerializer().serializeToString(svg);
              const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
              zipFiles.push({ filename, blob });
            } else {
              // Convert to PNG blob
              const xml = new XMLSerializer().serializeToString(svg);
              const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);
              const img = new Image();
              
              await new Promise<void>((resolve) => {
                img.onload = () => {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width * 2;
                  canvas.height = img.height * 2;
                  const ctx = canvas.getContext('2d')!;
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  URL.revokeObjectURL(url);
                  canvas.toBlob((b) => {
                    if (b) zipFiles.push({ filename, blob: b });
                    resolve();
                  }, 'image/png');
                };
                img.onerror = () => {
                  URL.revokeObjectURL(url);
                  resolve();
                };
                img.src = url;
              });
            }
          } catch (e) {
            console.error(`Failed to generate ${item.value}:`, e);
          }
        } else {
          // Render QR Code
          if (format === 'svg') {
            const svgString = await QRCode.toString(item.value, {
              type: 'svg',
              errorCorrectionLevel: 'M',
              margin: 2,
              width: 300,
            });
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            zipFiles.push({ filename, blob });
          } else {
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, item.value, {
              width: 400,
              margin: 2,
              errorCorrectionLevel: 'M',
            });
            await new Promise<void>((resolve) => {
              canvas.toBlob((b) => {
                if (b) zipFiles.push({ filename, blob: b });
                resolve();
              }, 'image/png');
            });
          }
        }
      }

      // Generate CSV manifest linking each input value to its output filename & validation status
      const manifestRows = ['Index,Input_Value,Product_Label,Filename,Symbology,Status,Validation_Error'];
      items.forEach((item, idx) => {
        const sanitizedLabel = (item.label || item.value).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${sanitizedLabel}_${item.value}.${format}`;
        manifestRows.push(
          `"${idx + 1}","${item.value.replace(/"/g, '""')}","${(item.label || '').replace(/"/g, '""')}","${item.isValid ? filename : 'N/A'}","${batchType === 'barcode' ? barcodeFormat : 'QR_CODE'}","${item.isValid ? 'VALID' : 'INVALID'}","${(item.error || '').replace(/"/g, '""')}"`
        );
      });
      const manifestBlob = new Blob([manifestRows.join('\n')], { type: 'text/csv;charset=utf-8' });
      zipFiles.push({ filename: 'batch_manifest.csv', blob: manifestBlob });

      setZipProgress('Packaging files and manifest into ZIP...');
      await downloadZipBundle(
        zipFiles,
        `opencode_batch_${batchType}_${Date.now()}`
      );
    } catch (err) {
      console.error('Batch ZIP generation failed:', err);
    } finally {
      setIsProcessingZip(false);
      setZipProgress('');
    }
  };

  const handleDownloadManifestOnly = () => {
    if (items.length === 0) return;
    const manifestRows = ['Index,Input_Value,Product_Label,Symbology,Status,Validation_Error'];
    items.forEach((item, idx) => {
      manifestRows.push(
        `"${idx + 1}","${item.value.replace(/"/g, '""')}","${(item.label || '').replace(/"/g, '""')}","${batchType === 'barcode' ? barcodeFormat : 'QR_CODE'}","${item.isValid ? 'VALID' : 'INVALID'}","${(item.error || '').replace(/"/g, '""')}"`
      );
    });
    const blob = new Blob([manifestRows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest_${batchType}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadSingleItem = async (val: string, label: string) => {
    const filename = `${(label || val).replace(/[^a-zA-Z0-9_-]/g, '_')}_${val}`;
    if (batchType === 'barcode') {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      JsBarcode(svg, val, {
        format: barcodeFormat === 'ISBN' ? 'EAN13' : barcodeFormat,
        width: 2,
        height: 80,
        displayValue: true,
        margin: 10,
        font: 'monospace',
      });
      const xml = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      const svg = await QRCode.toString(val, { type: 'svg', margin: 2, width: 300 });
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };

  const handleLoadSample = (type: 'upc' | 'isbn' | 'qr') => {
    if (type === 'upc') {
      setBatchType('barcode');
      setBarcodeFormat('UPC');
      setRawText(
        '012345678905, Organic Dark Roast\n049000000443, Cola Beverage 12oz\n011110417004, Creamery Salted Butter\n028400064057, Baked Potato Crisps\n037000127885, Liquid Laundry Detergent'
      );
    } else if (type === 'isbn') {
      setBatchType('barcode');
      setBarcodeFormat('ISBN');
      setRawText(
        '9780306406157, Clean Code: Agile Craftsmanship\n9780132350884, The Pragmatic Programmer\n9780201616224, Design Patterns: Gang of Four\n9781449331818, Learning React 2nd Edition'
      );
    } else {
      setBatchType('qrcode');
      setRawText(
        'https://example.com/item/1, Table #1 Menu\nhttps://example.com/item/2, Table #2 Menu\nhttps://example.com/item/3, Table #3 Menu\nhttps://example.com/item/4, Table #4 Menu'
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editorial Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Batch Generation Studio
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Bulk generate dozens or hundreds of UPCs, ISBNs, or QR codes at once. Preview live validations and download everything in one organized ZIP bundle.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>CSV & Multiline</span>
            <span aria-hidden="true">·</span>
            <span>Bulk ZIP Export</span>
            <span aria-hidden="true">·</span>
            <span>100% Free</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Controls: Mode & Format */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor={batchTypeId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Generator Mode
                </label>
                <select
                  id={batchTypeId}
                  value={batchType}
                  onChange={(e) => setBatchType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  <option value="barcode">Barcodes (UPC, ISBN, EAN, Code 128)</option>
                  <option value="qrcode">QR Codes (URLs / Text)</option>
                </select>
              </div>

              {batchType === 'barcode' && (
                <div>
                  <label htmlFor={batchFormatId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Barcode Symbology
                  </label>
                  <select
                    id={batchFormatId}
                    value={barcodeFormat}
                    onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
                  >
                    <option value="UPC">UPC-A (12 digits)</option>
                    <option value="ISBN">ISBN / Bookland (13 digits)</option>
                    <option value="EAN13">EAN-13 (13 digits)</option>
                    <option value="EAN8">EAN-8 (8 digits)</option>
                    <option value="CODE128">Code 128 (Alphanumeric)</option>
                    <option value="CODE39">Code 39 (Industrial)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Quick Template Switchers */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 mr-1">Load sample dataset:</span>
              <button
                type="button"
                onClick={() => handleLoadSample('upc')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
              >
                Retail UPC-A List
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('isbn')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
              >
                Bookland ISBN List
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('qr')}
                className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
              >
                Table QR Codes
              </button>
            </div>
          </div>

          {/* Multiline Textarea / CSV Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={batchTextareaId} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Data Input (One code per line or CSV: value, label)
              </label>
              <label className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-medium">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              id={batchTextareaId}
              rows={10}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="012345678905, Product Title&#10;049000000443, Another Product"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-900 leading-relaxed focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
            />

            <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
              <div>
                Format hint: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">value, label</code>
              </div>
              <button
                type="button"
                onClick={() => setRawText('')}
                className="text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Table Preview & Bulk ZIP Export (6 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Summary Metric Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            {isTruncated && (
              <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Input contains {rawLines.length} lines. Capped to {MAX_BATCH_ITEMS} items per batch to preserve browser performance.</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Batch Validation Status
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono">{items.length} total rows</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-medium font-mono">{validCount} valid</span>
                  {invalidCount > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-700 font-medium font-mono">{invalidCount} need attention</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bulk ZIP & Manifest Download Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={items.length === 0}
                  onClick={handleDownloadManifestOnly}
                  className="flex items-center gap-1.5 px-2.5 py-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  title="Download CSV Manifest"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Manifest CSV</span>
                </button>

                <button
                  type="button"
                  disabled={validCount === 0 || isProcessingZip}
                  onClick={() => handleDownloadAllZip('png')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {isProcessingZip ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileArchive className="w-3.5 h-3.5" />
                  )}
                  <span>ZIP (PNG)</span>
                </button>

                <button
                  type="button"
                  disabled={validCount === 0 || isProcessingZip}
                  onClick={() => handleDownloadAllZip('svg')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ZIP (SVG)</span>
                </button>
              </div>
            </div>

            {isProcessingZip && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 font-mono flex items-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{zipProgress}</span>
              </div>
            )}

            {/* Item Rows Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2 w-10">Status</th>
                    <th className="px-3 py-2">Value</th>
                    <th className="px-3 py-2">Label</th>
                    <th className="px-3 py-2 w-16 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={item.isValid ? 'hover:bg-slate-50' : 'bg-amber-50/50 hover:bg-amber-50'}
                    >
                      <td className="px-3 py-2 text-center">
                        {item.isValid ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                        ) : (
                          <span title={item.error}>
                            <AlertCircle className="w-4 h-4 text-amber-600 inline" />
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-900 font-semibold truncate max-w-[140px]">
                        {item.value}
                        {!item.isValid && (
                          <div className="text-[10px] text-amber-700 font-sans font-normal truncate">
                            {item.error}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600 font-sans truncate max-w-[180px]">
                        {item.label}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.isValid && (
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleItem(item.value, item.label || item.value)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            title="Download SVG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-sans">
                        No items entered yet. Paste numbers or load a sample above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
