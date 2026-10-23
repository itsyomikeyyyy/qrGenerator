/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useId } from 'react';
import JsBarcode from 'jsbarcode';
import { BarcodeConfig, BarcodeFormat, HistoryItem } from '../types';
import { 
  BARCODE_FORMATS, 
  validateBarcode, 
  BarcodeValidationResult,
  GS1_ISBN_STANDARDS_NOTICE 
} from '../utils/barcodeUtils';
import { 
  downloadSvg, 
  downloadRaster, 
  downloadPdf,
  copyToClipboard 
} from '../utils/exportUtils';
import { 
  Check, 
  Copy, 
  Download, 
  Printer, 
  Wand2, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  RefreshCw, 
  Bookmark, 
  Share2,
  FileCode2,
  Image as ImageIcon
} from 'lucide-react';

interface BarcodeGeneratorProps {
  initialConfig?: Partial<BarcodeConfig>;
  onSaveToHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
  onSendToLabelSheet: (item: { value: string; label: string; price?: string; format: BarcodeFormat }) => void;
}

export const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({
  initialConfig,
  onSaveToHistory,
  onSendToLabelSheet,
}) => {
  const [config, setConfig] = useState<BarcodeConfig>({
    format: initialConfig?.format || 'UPC',
    value: initialConfig?.value || '012345678905',
    width: initialConfig?.width || 2,
    height: initialConfig?.height || 85,
    displayValue: initialConfig?.displayValue !== undefined ? initialConfig.displayValue : true,
    font: 'monospace',
    fontSize: initialConfig?.fontSize || 16,
    textMargin: initialConfig?.textMargin || 4,
    textAlign: 'center',
    background: initialConfig?.background || '#ffffff',
    lineColor: initialConfig?.lineColor || '#0f172a',
    margin: initialConfig?.margin !== undefined ? initialConfig.margin : 12,
    topLabel: initialConfig?.topLabel || 'Fair-Trade Organic Coffee 12oz',
    priceLabel: initialConfig?.priceLabel || '$14.99',
  });

  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'retail'>('content');
  const [exportScale, setExportScale] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Form input IDs
  const valueInputId = useId();
  const formatSelectId = useId();
  const topLabelId = useId();
  const priceLabelId = useId();
  const barWidthId = useId();
  const barHeightId = useId();
  const marginId = useId();
  const fontSizeId = useId();

  const selectedFormatMeta = BARCODE_FORMATS.find((f) => f.id === config.format) || BARCODE_FORMATS[0];
  const validation: BarcodeValidationResult = validateBarcode(config.format, config.value);

  // Render barcode whenever config changes
  useEffect(() => {
    if (!svgRef.current) return;

    if (!config.value || config.value.trim().length === 0) {
      setRenderError('Enter barcode data to render');
      return;
    }

    try {
      // Map ISBN to EAN13 format in JsBarcode
      let renderFormat = config.format === 'ISBN' ? 'EAN13' : config.format;
      let renderValue = config.value.trim();

      // For ISBN, if it's 10 digits or contains hyphens, clean it
      if (config.format === 'ISBN') {
        const cleanUpper = renderValue.replace(/[-\s]/g, '').toUpperCase();
        if (cleanUpper.length === 10) {
          // auto convert ISBN-10 to 13
          const first9 = cleanUpper.slice(0, 9);
          // calculate check digit
          const d = ('978' + first9).split('').map(Number);
          let sum = 0;
          for (let i = 0; i < 12; i++) {
            sum += i % 2 === 0 ? d[i] : d[i] * 3;
          }
          const check = (10 - (sum % 10)) % 10;
          renderValue = '978' + first9 + check;
        } else {
          renderValue = cleanUpper.replace(/\D/g, '');
        }
      }

      // JsBarcode handles standard barcodes
      JsBarcode(svgRef.current, renderValue, {
        format: renderFormat,
        width: config.width,
        height: config.height,
        displayValue: config.displayValue,
        text: config.format === 'ISBN' && renderValue.length === 13 
          ? `ISBN ${renderValue.slice(0,3)}-${renderValue.slice(3,4)}-${renderValue.slice(4,7)}-${renderValue.slice(7,12)}-${renderValue.slice(12)}`
          : undefined,
        font: 'JetBrains Mono, monospace',
        fontOptions: 'bold',
        fontSize: config.fontSize,
        textMargin: config.textMargin,
        textAlign: config.textAlign,
        background: config.background,
        lineColor: config.lineColor,
        margin: config.margin,
        valid: (valid) => {
          if (!valid) {
            setRenderError(`Value '${renderValue}' does not conform to ${config.format} symbology.`);
          } else {
            setRenderError(null);
          }
        },
      });
    } catch (err) {
      console.error('Barcode rendering error:', err);
      setRenderError(err instanceof Error ? err.message : 'Invalid barcode data for chosen format.');
    }
  }, [config]);

  const handleFixChecksum = () => {
    if (validation.suggestedFix) {
      setConfig((prev) => ({ ...prev, value: validation.suggestedFix! }));
    }
  };

  const handleApplyPreset = (format: BarcodeFormat, sampleValue: string, sampleLabel: string) => {
    setConfig((prev) => ({
      ...prev,
      format,
      value: sampleValue,
      topLabel: sampleLabel,
    }));
  };

  const [customFilename, setCustomFilename] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const getEffectiveFilename = () => {
    if (customFilename.trim()) {
      return customFilename.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    }
    return `${config.format.toLowerCase()}_${config.value.replace(/[^a-zA-Z0-9]/g, '_')}`;
  };

  const handleDownloadSvg = () => {
    if (!svgRef.current || isExporting) return;
    downloadSvg(svgRef.current, getEffectiveFilename());
  };

  const handleDownloadRaster = async (format: 'png' | 'jpeg' | 'webp') => {
    if (!svgRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await downloadRaster(svgRef.current, getEffectiveFilename(), format, exportScale, config.background);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!svgRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await downloadPdf(svgRef.current, getEffectiveFilename(), {
        title: config.topLabel,
        price: config.priceLabel,
        codeValue: `${config.format}: ${config.value}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!svgRef.current) return;
    const ok = await copyToClipboard(svgRef.current);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToHistory = () => {
    onSaveToHistory({
      type: 'barcode',
      title: config.topLabel || `${config.format} Code`,
      formatOrType: config.format,
      value: config.value,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editorial Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Barcode Studio
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate 100% compliant UPC, ISBN Bookland, EAN, and industrial Code 128 barcodes with auto checksum calculation and vector exports.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Client-side Engine</span>
            <span aria-hidden="true">·</span>
            <span>Zero Tracking</span>
            <span aria-hidden="true">·</span>
            <span>Vector SVG & 300 DPI</span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Format Selector Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor={formatSelectId} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Barcode Symbology Standard
              </label>
              <span className="text-xs text-slate-500 font-mono">
                {selectedFormatMeta.category}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {BARCODE_FORMATS.slice(0, 4).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, format: f.id }))}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all cursor-pointer ${
                    config.format === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <div className="truncate">{f.id === 'ISBN' ? 'ISBN Bookland' : f.id === 'UPC' ? 'UPC-A (Retail)' : f.name.split(' ')[0]}</div>
                  <div className={`text-[10px] font-normal truncate ${config.format === f.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    {f.expectedLength.split(' ')[0]}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor={formatSelectId} className="text-xs font-medium text-slate-600 whitespace-nowrap">
                All formats:
              </label>
              <select
                id={formatSelectId}
                value={config.format}
                onChange={(e) => setConfig((prev) => ({ ...prev, format: e.target.value as BarcodeFormat }))}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
              >
                {BARCODE_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
              <p className="text-slate-600 leading-relaxed flex-1">
                {selectedFormatMeta.description}
              </p>
              <div className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2.5 py-1 rounded shrink-0 self-start sm:self-auto">
                Check Digit: <span className="font-semibold text-slate-900">{selectedFormatMeta.checkDigitRule}</span>
              </div>
            </div>

            {/* GS1 & ISBN Standards Guidance Notice */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-0.5">Commercial Identifier Advisory:</span>
              {GS1_ISBN_STANDARDS_NOTICE}
            </div>
          </div>

          {/* Value Input & Checksum Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={valueInputId} className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Barcode Value / Digits
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">
                  {config.value.length} chars
                </span>
                <span className="text-xs text-slate-400">({selectedFormatMeta.allowedChars})</span>
              </div>
            </div>

            <div className="relative">
              <input
                id={valueInputId}
                type="text"
                value={config.value}
                onChange={(e) => setConfig((prev) => ({ ...prev, value: e.target.value }))}
                placeholder={`Enter ${selectedFormatMeta.name}...`}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-base font-mono font-medium tracking-wider text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => setConfig((prev) => ({ ...prev, value: selectedFormatMeta.sample, topLabel: selectedFormatMeta.sampleLabel }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-500 hover:text-slate-900 px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                title="Fill with valid sample"
              >
                Sample
              </button>
            </div>

            {/* Validation State Banner */}
            <div className="mt-3">
              {validation.isValid ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Valid {config.format} format and checksum verified.</span>
                  </div>
                  {validation.suggestedFix && (
                    <span className="font-mono text-emerald-700 font-medium">
                      EAN: {validation.suggestedFix}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{validation.message}</span>
                  </div>
                  {validation.canAutoFix && validation.suggestedFix && (
                    <button
                      type="button"
                      onClick={handleFixChecksum}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Auto-Fix ({validation.suggestedFix})</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 mb-2">
                Quick Industry Presets:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('UPC', '012345678905', 'Artisan Dark Roast Coffee')}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                >
                  UPC-A Retail Grocery
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ISBN', '9780306406157', 'Clean Architecture (Hardcover)')}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                >
                  ISBN-13 Bookland
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('EAN13', '5901234123457', 'European Gourmet Cheese')}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                >
                  EAN-13 Worldwide
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('CODE128', 'X0039A84BZ', 'Amazon FNSKU Warehouse Pallet')}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                >
                  Amazon FNSKU
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('ITF14', '10012345678902', 'Master Case Carton (24 Pack)')}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                >
                  Carton ITF-14
                </button>
              </div>
            </div>
          </div>

          {/* Customization Tabs: Content / Style / Packaging Labels */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'content'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 -mb-px'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Retail Label Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'style'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 -mb-px'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Bar Dimensions & Spacing
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('retail')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'retail'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 -mb-px'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Colors & Text
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'content' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={topLabelId} className="block text-xs font-medium text-slate-700 mb-1">
                      Product Name / Header Label (Optional)
                    </label>
                    <input
                      id={topLabelId}
                      type="text"
                      value={config.topLabel || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, topLabel: e.target.value }))}
                      placeholder="e.g. Fair-Trade Organic Coffee"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Displays above the barcode on product tags and label sheets.
                    </p>
                  </div>

                  <div>
                    <label htmlFor={priceLabelId} className="block text-xs font-medium text-slate-700 mb-1">
                      Price or SKU / Department (Optional)
                    </label>
                    <input
                      id={priceLabelId}
                      type="text"
                      value={config.priceLabel || ''}
                      onChange={(e) => setConfig((prev) => ({ ...prev, priceLabel: e.target.value }))}
                      placeholder="e.g. $14.99 or SKU-8849"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Displays below or adjacent to the barcode on printable labels.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'style' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <div className="flex justify-between text-xs text-slate-700 font-medium mb-1.5">
                      <label htmlFor={barWidthId}>Bar Thickness</label>
                      <span className="font-mono text-slate-500">{config.width}px</span>
                    </div>
                    <input
                      id={barWidthId}
                      type="range"
                      min={1}
                      max={4}
                      step={1}
                      value={config.width}
                      onChange={(e) => setConfig((prev) => ({ ...prev, width: Number(e.target.value) }))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>1px (Compact)</span>
                      <span>4px (Jumbo)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-700 font-medium mb-1.5">
                      <label htmlFor={barHeightId}>Bar Height</label>
                      <span className="font-mono text-slate-500">{config.height}px</span>
                    </div>
                    <input
                      id={barHeightId}
                      type="range"
                      min={30}
                      max={150}
                      step={5}
                      value={config.height}
                      onChange={(e) => setConfig((prev) => ({ ...prev, height: Number(e.target.value) }))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>30px</span>
                      <span>150px</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-700 font-medium mb-1.5">
                      <label htmlFor={marginId}>Quiet Zone (Margin)</label>
                      <span className="font-mono text-slate-500">{config.margin}px</span>
                    </div>
                    <input
                      id={marginId}
                      type="range"
                      min={0}
                      max={30}
                      step={2}
                      value={config.margin}
                      onChange={(e) => setConfig((prev) => ({ ...prev, margin: Number(e.target.value) }))}
                      className="w-full accent-slate-900 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>0px (Flush)</span>
                      <span>30px (Wide)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'retail' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.displayValue}
                        onChange={(e) => setConfig((prev) => ({ ...prev, displayValue: e.target.checked }))}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span className="text-xs font-medium text-slate-700">
                        Display Human-Readable Digits
                      </span>
                    </label>

                    {config.displayValue && (
                      <div className="flex items-center gap-2">
                        <label htmlFor={fontSizeId} className="text-xs font-medium text-slate-600">Font Size:</label>
                        <input
                          id={fontSizeId}
                          type="number"
                          min={10}
                          max={26}
                          value={config.fontSize}
                          onChange={(e) => setConfig((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                          className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Barcode Line Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.lineColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, lineColor: e.target.value }))}
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.lineColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, lineColor: e.target.value }))}
                          className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, lineColor: '#0f172a' }))}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Default Black
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.background === 'transparent' ? '#ffffff' : config.background}
                          onChange={(e) => setConfig((prev) => ({ ...prev, background: e.target.value }))}
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.background}
                          onChange={(e) => setConfig((prev) => ({ ...prev, background: e.target.value }))}
                          className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, background: '#ffffff' }))}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                        >
                          White
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview & Multi-Format Export Options (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Preview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[340px]">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-4 pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                High-Resolution Preview
              </span>
              <span className="font-mono text-[11px]">
                {config.format} · Vector
              </span>
            </div>

            {/* Printable Product Label Wrapper */}
            <div
              ref={containerRef}
              className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-5 flex flex-col items-center justify-center transition-all shadow-xs animate-studio-fade-in"
            >
              {config.topLabel && (
                <div className="w-full text-center mb-2 px-2">
                  <span className="text-sm font-bold text-slate-900 tracking-tight block truncate">
                    {config.topLabel}
                  </span>
                </div>
              )}

              {/* The actual Barcode SVG */}
              <div className="overflow-x-auto max-w-full flex justify-center py-2">
                <svg ref={svgRef} className="max-w-full h-auto block" />
              </div>

              {renderError && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2.5 py-1 text-center font-mono">
                  {renderError}
                </div>
              )}

              {config.priceLabel && (
                <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-dashed border-slate-200 px-3">
                  <span className="text-[11px] font-mono text-slate-500">
                    SKU: {config.value.slice(-6)}
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {config.priceLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Scale Selector for Raster exports */}
            <div className="w-full flex items-center justify-between mt-5 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-medium">Export Resolution:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setExportScale(1)}
                  className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    exportScale === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  1x (Web)
                </button>
                <button
                  type="button"
                  onClick={() => setExportScale(2)}
                  className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    exportScale === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  2x (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setExportScale(4)}
                  className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    exportScale === 4 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  4x (300 DPI Print)
                </button>
              </div>
            </div>
          </div>

          {/* Export Action Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Export & Download Options
            </h2>

            {/* Custom Filename Field */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Custom Export Filename (Optional)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder={getEffectiveFilename()}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
                <span className="text-xs text-slate-400 font-mono">.[ext]</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadSvg}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <FileCode2 className="w-4 h-4" />
                <span>Vector SVG</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadRaster('png')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <ImageIcon className="w-4 h-4" />
                <span>PNG ({exportScale * 150} DPI)</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs col-span-2 sm:col-span-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadRaster('jpeg')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JPEG File</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadRaster('webp')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer col-span-1 sm:col-span-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>WebP File</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Copy PNG to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Print single label"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToHistory}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Save to favorites"
              >
                <Bookmark className={`w-3.5 h-3.5 ${savedSuccess ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                <span>{savedSuccess ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            {/* Send to Multi-Label Sheet button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  onSendToLabelSheet({
                    value: config.value,
                    label: config.topLabel || `${config.format} Code`,
                    price: config.priceLabel,
                    format: config.format,
                  })
                }
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Create 30-Up Label Sheet (Avery 5160)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
