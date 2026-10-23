/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GeneratorMode = 'barcode' | 'qrcode' | 'batch' | 'labels' | 'scan';

export type BarcodeFormat =
  | 'UPC'        // UPC-A (12 digits)
  | 'UPCE'       // UPC-E (6 or 8 digits)
  | 'EAN13'      // EAN-13 (13 digits)
  | 'EAN8'       // EAN-8 (8 digits)
  | 'ISBN'       // ISBN-10 or ISBN-13 (Bookland EAN)
  | 'CODE128'    // Code 128 (all 128 ASCII characters)
  | 'CODE39'     // Code 39 (alphanumeric uppercase)
  | 'ITF14'      // ITF-14 / Interleaved 2 of 5
  | 'MSI'        // MSI Plessey
  | 'pharmacode' // Pharmacode
  | 'codabar';   // Codabar

export interface BarcodeConfig {
  format: BarcodeFormat;
  value: string;
  width: number;       // scale (1 to 4)
  height: number;      // height in px (30 to 160)
  displayValue: boolean;
  font: string;
  fontSize: number;
  textMargin: number;
  textAlign: 'left' | 'center' | 'right';
  background: string;
  lineColor: string;
  margin: number;
  topLabel?: string;   // Optional product title above barcode
  priceLabel?: string; // Optional price tag below
}

export type QRType =
  | 'url'
  | 'text'
  | 'wifi'
  | 'vcard'
  | 'whatsapp'
  | 'email'
  | 'phone'
  | 'sms'
  | 'geo'
  | 'event'
  | 'crypto'
  | 'deeplink';

export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QRConfig {
  type: QRType;
  rawValue: string;
  size: number;
  margin: number;
  errorCorrectionLevel: QRErrorCorrection;
  fgColor: string;
  bgColor: string;
  isTransparentBg: boolean;
  dotStyle: 'square' | 'rounded' | 'dots';
  eyeStyle: 'square' | 'rounded' | 'circle';
  frameStyle: 'none' | 'scan-me' | 'polaroid' | 'card' | 'badge';
  frameLabel: string;
  frameSubtext?: string;
  logoPreset?: string;
  customLogoUrl?: string;
  logoSizePercent: number; // 15 to 30
}

export interface WhatsAppData {
  phoneNumber: string;
  message: string;
}

export interface DeepLinkData {
  schemeOrUrl: string;
  appName?: string;
}

export interface WiFiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  url: string;
  address: string;
  note: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export interface EventData {
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
}

export interface CryptoData {
  currency: 'bitcoin' | 'ethereum' | 'solana' | 'upi';
  address: string;
  amount?: string;
  label?: string;
}

export interface HistoryItem {
  id: string;
  type: 'barcode' | 'qrcode';
  title: string;
  formatOrType: string;
  value: string;
  createdAt: number;
  isFavorite?: boolean;
}

export interface BatchItem {
  id: string;
  value: string;
  label?: string;
  status: 'valid' | 'invalid' | 'pending';
  error?: string;
}
