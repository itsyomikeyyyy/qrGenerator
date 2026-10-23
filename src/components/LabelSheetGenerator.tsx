/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useId } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { BarcodeFormat } from '../types';
import { Printer, RefreshCw, Sliders, CheckCircle2 } from 'lucide-react';

interface LabelSheetProps {
  initialItem?: {
    value: string;
    label: string;
    price?: string;
    format?: BarcodeFormat;
    isQr?: boolean;
  };
}

export const LabelSheetGenerator: React.FC<LabelSheetProps> = ({ initialItem }) => {
  const [codeType, setCodeType] = useState<'barcode' | 'qrcode'>(
    initialItem?.isQr ? 'qrcode' : 'barcode'
  );
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>(
    initialItem?.format || 'UPC'
  );
  const [value, setValue] = useState<string>(initialItem?.value || '012345678905');
  const [productTitle, setProductTitle] = useState<string>(
    initialItem?.label || 'Organic Dark Roast Coffee 12oz'
  );
  const [price, setPrice] = useState<string>(initialItem?.price || '$14.99');
  const [sheetTemplate, setSheetTemplate] = useState<'avery5160' | 'avery5163' | 'euro24'>('avery5160');
  const [repeatCount, setRepeatCount] = useState<number>(30);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showTitle, setShowTitle] = useState<boolean>(true);

  // Form input IDs
  const codeTypeId = useId();
  const symbologySelectId = useId();
  const codeValId = useId();
  const prodTitleId = useId();
  const unitPriceId = useId();
  const sheetTempId = useId();
  const labelQtyId = useId();

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Determine grid dimensions based on template
  const templateConfig = {
    avery5160: {
      name: 'Avery 5160 / 8160 (30 Labels)',
      cols: 3,
      rows: 10,
      total: 30,
      labelHeight: 'h-24',
      gridColsClass: 'grid-cols-3',
    },
    avery5163: {
      name: 'Avery 5163 (10 Shipping Labels)',
      cols: 2,
      rows: 5,
      total: 10,
      labelHeight: 'h-40',
      gridColsClass: 'grid-cols-2',
    },
    euro24: {
      name: 'European Standard (24 Labels, 3x8)',
      cols: 3,
      rows: 8,
      total: 24,
      labelHeight: 'h-28',
      gridColsClass: 'grid-cols-3',
    },
  }[sheetTemplate];

  // Adjust count when template changes
  useEffect(() => {
    setRepeatCount(templateConfig.total);
  }, [sheetTemplate]);

  // Render barcodes or QR codes in each cell
  useEffect(() => {
    if (!printAreaRef.current) return;

    if (codeType === 'barcode') {
      const svgs = printAreaRef.current.querySelectorAll<SVGSVGElement>('.cell-barcode-svg');
      svgs.forEach((svg) => {
        try {
          JsBarcode(svg, value, {
            format: barcodeFormat === 'ISBN' ? 'EAN13' : barcodeFormat,
            width: sheetTemplate === 'avery5163' ? 2 : 1.4,
            height: sheetTemplate === 'avery5163' ? 55 : 36,
            displayValue: true,
            fontSize: sheetTemplate === 'avery5163' ? 14 : 11,
            margin: 4,
            font: 'JetBrains Mono, monospace',
          });
        } catch (e) {
          // Keep silent or placeholder
        }
      });
    } else {
      const canvases = printAreaRef.current.querySelectorAll<HTMLCanvasElement>('.cell-qr-canvas');
      canvases.forEach((canvas) => {
        QRCode.toCanvas(canvas, value, {
          width: sheetTemplate === 'avery5163' ? 100 : 70,
          margin: 1,
          errorCorrectionLevel: 'M',
        }).catch(() => {});
      });
    }
  }, [value, codeType, barcodeFormat, repeatCount, sheetTemplate, showPrice, showTitle]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editorial Header */}
      <div className="mb-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Printable Label Sheet Generator
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Print ready-to-peel barcode and QR sticker sheets formatted for standard Avery 5160, 5163, and European label paper.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label Sheet</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Settings (4 cols) */}
        <div className="lg:col-span-4 space-y-5 no-print">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Label Sheet Configuration
            </h2>

            <div>
              <label htmlFor={sheetTempId} className="block text-xs font-medium text-slate-700 mb-1">
                Paper Label Sheet Template
              </label>
              <select
                id={sheetTempId}
                value={sheetTemplate}
                onChange={(e) => setSheetTemplate(e.target.value as 'avery5160' | 'avery5163' | 'euro24')}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
              >
                <option value="avery5160">Avery 5160 / 8160 (30 Labels, 3x10)</option>
                <option value="avery5163">Avery 5163 (10 Shipping Labels, 2x5)</option>
                <option value="euro24">European Standard (24 Labels, 3x8)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={codeTypeId} className="block text-xs font-medium text-slate-700 mb-1">Code Type</label>
                <select
                  id={codeTypeId}
                  value={codeType}
                  onChange={(e) => setCodeType(e.target.value as 'barcode' | 'qrcode')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                >
                  <option value="barcode">Barcode</option>
                  <option value="qrcode">QR Code</option>
                </select>
              </div>

              {codeType === 'barcode' && (
                <div>
                  <label htmlFor={symbologySelectId} className="block text-xs font-medium text-slate-700 mb-1">Symbology</label>
                  <select
                    id={symbologySelectId}
                    value={barcodeFormat}
                    onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900"
                  >
                    <option value="UPC">UPC-A</option>
                    <option value="ISBN">ISBN</option>
                    <option value="EAN13">EAN-13</option>
                    <option value="CODE128">Code 128</option>
                    <option value="CODE39">Code 39</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label htmlFor={codeValId} className="block text-xs font-medium text-slate-700 mb-1">
                Code Digits / Content
              </label>
              <input
                id={codeValId}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label htmlFor={prodTitleId} className="block text-xs font-medium text-slate-700 mb-1">
                Product Title / Header Line
              </label>
              <input
                id={prodTitleId}
                type="text"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
              />
            </div>

            <div>
              <label htmlFor={unitPriceId} className="block text-xs font-medium text-slate-700 mb-1">
                Price or SKU
              </label>
              <input
                id={unitPriceId}
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900"
                />
                <span className="text-xs text-slate-700">Print Product Title</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900"
                />
                <span className="text-xs text-slate-700">Print Price / SKU</span>
              </label>

              <div className="flex items-center justify-between pt-2">
                <label htmlFor={labelQtyId} className="text-xs text-slate-600">Quantity to print:</label>
                <input
                  id={labelQtyId}
                  type="number"
                  min={1}
                  max={templateConfig.total}
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Math.min(templateConfig.total, Math.max(1, Number(e.target.value))))}
                  className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Paper Simulation Sheet (8 cols) */}
        <div className="lg:col-span-8">
          <div className="bg-slate-200 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto shadow-inner">
            {/* Sheet Viewport */}
            <div
              ref={printAreaRef}
              className="bg-white w-[750px] min-h-[960px] p-6 shadow-md rounded-sm border border-slate-300 print-sheet"
              style={{ minWidth: '700px' }}
            >
              <div
                className={`grid ${templateConfig.gridColsClass} gap-3 sm:gap-4`}
              >
                {Array.from({ length: repeatCount }).map((_, index) => (
                  <div
                    key={index}
                    className={`border border-dashed border-slate-300 rounded p-2 flex flex-col items-center justify-between text-center overflow-hidden bg-white ${templateConfig.labelHeight}`}
                  >
                    {showTitle && productTitle && (
                      <div className="text-[10px] font-bold text-slate-800 tracking-tight truncate w-full px-1">
                        {productTitle}
                      </div>
                    )}

                    <div className="flex-1 flex items-center justify-center overflow-hidden my-0.5">
                      {codeType === 'barcode' ? (
                        <svg className="cell-barcode-svg max-w-full h-auto" />
                      ) : (
                        <canvas className="cell-qr-canvas max-w-full h-auto" />
                      )}
                    </div>

                    {showPrice && price && (
                      <div className="text-[10px] font-mono font-bold text-slate-900 leading-none">
                        {price}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
