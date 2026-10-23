/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WiFiData, VCardData, EmailData, EventData, CryptoData, WhatsAppData, DeepLinkData, QRConfig } from '../types';

export function buildWiFiPayload(data: WiFiData): string {
  const enc = data.encryption === 'nopass' ? 'nopass' : data.encryption;
  const esc = (str: string) => str.replace(/([\\;,:"])/g, '\\$1');
  return `WIFI:T:${enc};S:${esc(data.ssid)};P:${data.encryption === 'nopass' ? '' : esc(data.password)};H:${data.hidden ? 'true' : 'false'};;`;
}

export function buildVCardPayload(data: VCardData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${data.lastName || ''};${data.firstName || ''};;;`,
    `FN:${[data.firstName, data.lastName].filter(Boolean).join(' ') || 'Contact'}`,
  ];

  if (data.organization) lines.push(`ORG:${data.organization}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  if (data.url) lines.push(`URL:${data.url}`);
  if (data.address) lines.push(`ADR;TYPE=WORK:;;${data.address.replace(/\n/g, ', ')};;;;`);
  if (data.note) lines.push(`NOTE:${data.note}`);

  lines.push('END:VCARD');
  return lines.join('\n');
}

export function buildEmailPayload(data: EmailData): string {
  const params: string[] = [];
  if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
  if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
  return `mailto:${data.to || ''}${params.length ? '?' + params.join('&') : ''}`;
}

export function buildWhatsAppPayload(data: WhatsAppData): string {
  const cleanPhone = data.phoneNumber.replace(/[^0-9]/g, '');
  const msgParam = data.message ? `?text=${encodeURIComponent(data.message)}` : '';
  return `https://wa.me/${cleanPhone}${msgParam}`;
}

export function buildDeepLinkPayload(data: DeepLinkData): string {
  return data.schemeOrUrl.trim();
}

export function buildEventPayload(data: EventData): string {
  const formatUtc = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OpenCode Studio//QR Event//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${data.title || 'Event'}`,
  ];

  const start = formatUtc(data.startDate);
  const end = formatUtc(data.endDate);
  if (start) lines.push(`DTSTART:${start}`);
  if (end) lines.push(`DTEND:${end}`);
  if (data.location) lines.push(`LOCATION:${data.location}`);
  if (data.description) lines.push(`DESCRIPTION:${data.description}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\n');
}

export function buildCryptoPayload(data: CryptoData): string {
  if (data.currency === 'upi') {
    const params: string[] = [];
    if (data.label) params.push(`pn=${encodeURIComponent(data.label)}`);
    if (data.amount) params.push(`am=${encodeURIComponent(data.amount)}`);
    params.push('cu=INR');
    return `upi://pay?pa=${data.address}${params.length ? '&' + params.join('&') : ''}`;
  }

  const prefix = data.currency;
  const params: string[] = [];
  if (data.amount) {
    if (data.currency === 'ethereum') params.push(`value=${data.amount}`);
    else params.push(`amount=${data.amount}`);
  }
  if (data.label) params.push(`label=${encodeURIComponent(data.label)}`);

  return `${prefix}:${data.address}${params.length ? '?' + params.join('&') : ''}`;
}

/**
 * Calculates relative luminance for WCAG contrast calculation
 */
function getLuminance(hexColor: string): number {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Computes contrast ratio between foreground and background (1:1 to 21:1)
 */
export function calculateContrastRatio(fgHex: string, bgHex: string): number {
  if (bgHex === 'transparent' || !fgHex || !bgHex) return 10;
  try {
    const lum1 = getLuminance(fgHex);
    const lum2 = getLuminance(bgHex);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  } catch (e) {
    return 10;
  }
}

export interface QRScannabilityReport {
  isOptimal: boolean;
  warnings: string[];
  contrastRatio: number;
}

/**
 * Validates scannability safety rules so design customization never breaks physical scanning
 */
export function checkQRScannability(config: QRConfig): QRScannabilityReport {
  const warnings: string[] = [];
  const contrast = calculateContrastRatio(config.fgColor, config.isTransparentBg ? '#ffffff' : config.bgColor);

  if (contrast < 3.0) {
    warnings.push(`Low color contrast (${contrast.toFixed(1)}:1). Scanners require at least 3.5:1 contrast between foreground and background.`);
  }

  const hasLogo = Boolean(config.customLogoUrl || config.logoPreset);
  if (hasLogo && (config.errorCorrectionLevel === 'L' || config.errorCorrectionLevel === 'M')) {
    warnings.push(`Center logo is active with Level ${config.errorCorrectionLevel} error correction. We strongly recommend Level 'H' (30% recovery) to ensure 100% reliable scanning.`);
  }

  if (hasLogo && config.logoSizePercent > 28) {
    warnings.push(`Logo size is ${config.logoSizePercent}%. Sizing larger than 26% risks obscuring QR timing patterns.`);
  }

  return {
    isOptimal: warnings.length === 0,
    warnings,
    contrastRatio: Number(contrast.toFixed(1)),
  };
}
