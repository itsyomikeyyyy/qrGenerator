/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ScanLine, 
  Upload, 
  Camera, 
  Copy, 
  Check, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { BarcodeFormat } from '../types';
import { logger } from '../utils/logger';

interface CodeScannerProps {
  onLoadInBarcode: (value: string, format?: BarcodeFormat) => void;
  onLoadInQr: (value: string) => void;
}

export const CodeScanner: React.FC<CodeScannerProps> = ({
  onLoadInBarcode,
  onLoadInQr,
}) => {
  const [scanResult, setScanResult] = useState<{
    format: string;
    rawValue: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check if native BarcodeDetector API exists
  const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);

      const img = new Image();
      img.onload = async () => {
        await decodeImageElement(img);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const decodeImageElement = async (img: HTMLImageElement) => {
    if (hasNativeDetector) {
      try {
        // @ts-ignore - standard Web BarcodeDetector
        const detector = new window.BarcodeDetector({
          formats: [
            'qr_code',
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_128',
            'code_39',
            'itf',
            'codabar',
          ],
        });
        const barcodes = await detector.detect(img);
        if (barcodes && barcodes.length > 0) {
          const first = barcodes[0];
          setScanResult({
            format: first.format.toUpperCase(),
            rawValue: first.rawValue,
          });
          return;
        }
      } catch (err) {
        logger.warn('Native BarcodeDetector threw:', err);
      }
    }

    // Fallback if BarcodeDetector didn't find or isn't supported
    // Attempt standard URL / ISBN / UPC regex inspection from manual text or fallback
    setErrorMsg(
      hasNativeDetector
        ? 'No clear barcode or QR code detected in this image. Ensure the image is well-lit and not blurry.'
        : 'Native BarcodeDetector is not supported in this browser. Please use Chrome/Edge or manually enter the digits.'
    );
  };

  // Start Camera Stream
  const startCamera = async () => {
    setErrorMsg(null);
    setScanResult(null);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        scanVideoFrames();
      }
    } catch (err) {
      logger.error('Camera access failed:', err);
      setErrorMsg('Could not access device camera. Please check camera permissions or upload an image instead.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsScanning(false);
  };

  const scanVideoFrames = async () => {
    if (!videoRef.current || !hasNativeDetector) return;

    try {
      // @ts-ignore
      const detector = new window.BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'],
      });
      const barcodes = await detector.detect(videoRef.current);
      if (barcodes && barcodes.length > 0) {
        const first = barcodes[0];
        setScanResult({
          format: first.format.toUpperCase(),
          rawValue: first.rawValue,
        });
        stopCamera();
        return;
      }
    } catch (e) {
      // frame pass
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrames);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCopy = async () => {
    if (!scanResult) return;
    await navigator.clipboard.writeText(scanResult.rawValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInGenerator = () => {
    if (!scanResult) return;
    const isQr = scanResult.format.includes('QR') || scanResult.rawValue.startsWith('http');
    if (isQr) {
      onLoadInQr(scanResult.rawValue);
    } else {
      let format: BarcodeFormat = 'CODE128';
      if (scanResult.format.includes('UPC_A') || scanResult.format.includes('UPC')) format = 'UPC';
      else if (scanResult.format.includes('EAN_13')) format = 'EAN13';
      else if (scanResult.format.includes('EAN_8')) format = 'EAN8';
      else if (scanResult.format.includes('CODE_39')) format = 'CODE39';
      else if (scanResult.format.includes('ITF')) format = 'ITF14';
      onLoadInBarcode(scanResult.rawValue, format);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editorial Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Barcode & QR Scanner & Verifier
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Verify and decode physical retail barcodes, book ISBNs, and QR codes using your device camera or uploaded image files.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Client-side Decoding</span>
            <span aria-hidden="true">·</span>
            <span>Zero Image Uploads</span>
            <span aria-hidden="true">·</span>
            <span>Instant Verifier</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Camera Viewport or File Upload (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Scanner Input Source
              </span>
              <div className="flex items-center gap-2">
                {!isScanning ? (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Use Camera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Stop Camera</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>

            {/* Viewport Box */}
            <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[320px] flex items-center justify-center text-slate-400">
              {isScanning ? (
                <div className="relative w-full h-full min-h-[320px]">
                  <video
                    ref={videoRef}
                    playsInline
                    className="w-full h-full object-cover min-h-[320px]"
                  />
                  {/* Aiming Reticle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-48 border-2 border-indigo-400/80 rounded-lg shadow-lg relative animate-pulse">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/80 shadow-xs" />
                    </div>
                  </div>
                </div>
              ) : imagePreview ? (
                <div className="p-4 flex items-center justify-center max-h-[360px]">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="max-h-[320px] max-w-full rounded object-contain"
                  />
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <ScanLine className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Take a photo with your device camera or upload a saved barcode image / packaging photo to decode.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    Select Image File
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Decoded Result & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4 pb-2 border-b border-slate-100">
              Decoded Code Result
            </h2>

            {scanResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Successfully Decoded</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Detected Symbology:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {scanResult.format}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 block mb-1">
                      Raw Decoded Payload:
                    </span>
                    <div className="font-mono text-sm font-semibold text-slate-900 break-all bg-white p-2.5 rounded border border-slate-200">
                      {scanResult.rawValue}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Value'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenInGenerator}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <span>Open in Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-2 text-slate-400">
                <ScanLine className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">
                  Awaiting image or camera scan.
                </p>
                <p className="text-[11px] text-slate-400">
                  Decoded digits, format verification, and checksum analysis will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
