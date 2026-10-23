/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { logger } from './logger';

export interface ExportImageOptions {
  filename: string;
  format: 'png' | 'svg' | 'jpeg' | 'webp';
  scale?: number; // 1, 2, 4
  backgroundColor?: string;
}

/**
 * Sanitizes user-provided or auto-generated filenames to prevent directory traversal
 * and illegal filesystem characters across Windows, macOS, and Linux.
 */
export function sanitizeFilename(name: string, defaultName: string = 'code-export'): string {
  if (!name || typeof name !== 'string') return defaultName;
  const cleaned = name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^\.+/, '')
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 100) : defaultName;
}

/**
 * Downloads raw SVG as a vector .svg file
 */
export function downloadSvg(svgElement: SVGElement, filename: string): void {
  const safeName = sanitizeFilename(filename, 'barcode-vector');
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);

  // Add xml namespace if missing
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Converts SVG or Canvas element into a raster Image Blob with customizable scale
 */
export async function elementToBlob(
  element: SVGElement | HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  scale: number = 2,
  backgroundColor: string = '#ffffff'
): Promise<Blob> {
  if (element instanceof HTMLCanvasElement) {
    if (scale === 1 && format === 'image/png') {
      return new Promise((resolve, reject) => {
        element.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))), format);
      });
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = element.width * scale;
    offscreen.height = element.height * scale;
    const ctx = offscreen.getContext('2d')!;

    if (format === 'image/jpeg' || (backgroundColor && backgroundColor !== 'transparent')) {
      ctx.fillStyle = backgroundColor || '#ffffff';
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(element, 0, 0, offscreen.width, offscreen.height);

    return new Promise((resolve, reject) => {
      offscreen.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas conversion failed'))),
        format,
        0.95
      );
    });
  }

  // Handle SVG Element
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(element);
  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const rect = element.getBoundingClientRect();
      const width = (rect.width || 300) * scale;
      const height = (rect.height || 150) * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      if (format === 'image/jpeg' || (backgroundColor && backgroundColor !== 'transparent')) {
        ctx.fillStyle = backgroundColor || '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Raster conversion failed'))),
        format,
        0.95
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG into image for rasterization'));
    };
    img.src = url;
  });
}

/**
 * Downloads the element as raster format (PNG, JPEG, WebP)
 */
export async function downloadRaster(
  element: SVGElement | HTMLCanvasElement,
  filename: string,
  format: 'png' | 'jpeg' | 'webp' = 'png',
  scale: number = 2,
  backgroundColor: string = '#ffffff'
): Promise<void> {
  const safeName = sanitizeFilename(filename, 'barcode-export');
  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const blob = await elementToBlob(element, mimeType, scale, backgroundColor);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copies high-res PNG directly to system clipboard
 */
export async function copyToClipboard(element: SVGElement | HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await elementToBlob(element, 'image/png', 2);
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API not supported');
    }
    const item = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    logger.error('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Generates and downloads a print-ready vector/high-DPI PDF label document
 */
export async function downloadPdf(
  element: SVGElement | HTMLCanvasElement,
  filename: string,
  meta?: {
    title?: string;
    subtext?: string;
    price?: string;
    codeValue?: string;
  }
): Promise<void> {
  const safeName = sanitizeFilename(filename, 'label-card');
  const blob = await elementToBlob(element, 'image/png', 4, '#ffffff');
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onload = () => {
      try {
        const dataUrl = reader.result as string;
        // Standard single label card or A4 document
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const cardWidth = 105; // mm (half of A4 width, classic label card)
        const cardHeight = 74; // mm
        const startX = (pageWidth - cardWidth) / 2;
        const startY = 30;

        // Draw light card outline & header
        pdf.setDrawColor(203, 213, 225); // slate-300
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(startX, startY, cardWidth, cardHeight, 3, 3, 'FD');

        let currentY = startY + 8;

        // Title line
        if (meta?.title) {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(11);
          pdf.setTextColor(15, 23, 42); // slate-900
          pdf.text(meta.title, startX + cardWidth / 2, currentY, { align: 'center', maxWidth: cardWidth - 10 });
          currentY += 6;
        }

        // Image barcode / QR
        const imgProps = pdf.getImageProperties(dataUrl);
        const maxImgWidth = cardWidth - 16;
        const maxImgHeight = 36;
        const aspect = imgProps.width / imgProps.height;
        let imgW = maxImgWidth;
        let imgH = imgW / aspect;
        if (imgH > maxImgHeight) {
          imgH = maxImgHeight;
          imgW = imgH * aspect;
        }

        const imgX = startX + (cardWidth - imgW) / 2;
        pdf.addImage(dataUrl, 'PNG', imgX, currentY, imgW, imgH, undefined, 'FAST');
        currentY += imgH + 5;

        // Subtext / Price line
        if (meta?.price || meta?.codeValue) {
          pdf.setFont('courier', 'bold');
          pdf.setFontSize(9);
          pdf.setTextColor(51, 65, 85);

          if (meta.codeValue && !meta.price) {
            pdf.text(meta.codeValue, startX + cardWidth / 2, currentY, { align: 'center' });
          } else if (meta.price) {
            pdf.text(meta.codeValue || '', startX + 8, currentY);
            pdf.setFontSize(10);
            pdf.setTextColor(15, 23, 42);
            pdf.text(meta.price, startX + cardWidth - 8, currentY, { align: 'right' });
          }
        }

        // Print footer notice
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text('Generated with OpenCode Studio · Free & Open Source', pageWidth / 2, 280, { align: 'center' });

        pdf.save(`${safeName}.pdf`);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates and downloads a zip archive of multiple files
 */
export async function downloadZipBundle(
  files: { filename: string; blob: Blob }[],
  zipName: string
): Promise<void> {
  const safeZipName = sanitizeFilename(zipName, 'batch-archive');
  const zip = new JSZip();
  files.forEach((f) => {
    const safeFname = sanitizeFilename(f.filename, 'code-file');
    zip.file(safeFname, f.blob);
  });
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeZipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

