/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, CheckCircle2, Github, Heart, Sparkles, BookOpen, Layers } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            OC
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              OpenCode Studio
            </h2>
            <p className="text-xs text-slate-500">
              Free & Open Source Barcode & QR Code Studio · MIT License
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
          {/* Privacy & Open Source Guarantee */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Client-Side Privacy Guarantee</span>
            </div>
            <p className="text-emerald-800">
              All barcodes and QR codes are rendered locally inside your web browser using HTML5 Canvas and SVG. No data, numbers, passwords, or customer records ever leave your device or touch an external server.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Supported Barcode & QR Symbologies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">UPC-A:</span> 12-digit US & Canadian Retail (with auto check-digit calc)
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">ISBN-13 / Bookland:</span> Global Book publishing standard (with ISBN-10 converter)
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">EAN-13 & EAN-8:</span> International retail merchandise & small packaging
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">Code 128:</span> High-density alphanumeric logistics & Amazon FNSKU
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">Code 39:</span> Automotive, defense, healthcare asset tags
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">ITF-14:</span> Shipping carton & corrugated container standard
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">QR Code:</span> URLs, Wi-Fi keys, vCard business cards, payments & events
              </div>
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <span className="font-bold text-slate-800">Codabar & Pharmacode:</span> Blood banks, libraries, pharmaceutical packing
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
              Vector & Print Export Capabilities
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              <li><strong>Vector SVG:</strong> Scalable vector graphics for graphic designers, laser cutting, Adobe Illustrator, and professional packaging print.</li>
              <li><strong>Ultra HD PNG:</strong> 1x, 2x, and 4x (300 DPI) raster graphics for high-resolution web and direct thermal label printers.</li>
              <li><strong>Avery Label Sheets:</strong> Print 30-up (Avery 5160) or 10-up (Avery 5163) sheets directly to your office printer.</li>
              <li><strong>Bulk ZIP Bundles:</strong> Generate dozens of barcodes in one batch and download as an organized ZIP archive.</li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              Released under the permissive MIT Open Source License.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              Close Studio Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
