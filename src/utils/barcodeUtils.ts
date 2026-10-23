/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BarcodeFormat } from '../types';

export interface BarcodeFormatMeta {
  id: BarcodeFormat;
  name: string;
  category: 'Retail' | 'Publishing' | 'Logistics & Warehousing' | 'Specialty';
  description: string;
  allowedChars: string;
  expectedLength: string;
  checkDigitRule: 'Calculated & Verified (Mod-10)' | 'Calculated & Verified (Mod-11)' | 'Automatic / Internal' | 'No Checksum';
  sample: string;
  sampleLabel: string;
}

export const GS1_ISBN_STANDARDS_NOTICE = 
  'Official Identifier Notice: UPC, EAN, and ISBN are globally regulated trade item identifiers managed by GS1 and the International ISBN Agency. Generating a syntactically valid barcode for testing or internal logistics does not register or assign an official GTIN/UPC/ISBN prefix. Commercial retail items sold through major retail chains require official prefix licenses from GS1 or your national ISBN agency.';

export const BARCODE_FORMATS: BarcodeFormatMeta[] = [
  {
    id: 'UPC',
    name: 'UPC-A (Universal Product Code)',
    category: 'Retail',
    description: '12-digit standard retail barcode for North America (USA & Canada). Includes 11 data digits + 1 check digit.',
    allowedChars: '0-9 only',
    expectedLength: '12 digits (or 11 digits with auto check digit)',
    checkDigitRule: 'Calculated & Verified (Mod-10)',
    sample: '012345678905',
    sampleLabel: 'Organic Fair-Trade Coffee 12oz',
  },
  {
    id: 'ISBN',
    name: 'ISBN / Bookland (Books & Audiobooks)',
    category: 'Publishing',
    description: 'International Standard Book Number for published books. Accepts ISBN-13 (starts with 978 or 979) or 10-digit legacy ISBNs.',
    allowedChars: '0-9 (ISBN-10 allows X as check digit)',
    expectedLength: '13 digits (or 10 digits auto-converted to ISBN-13)',
    checkDigitRule: 'Calculated & Verified (Mod-10)',
    sample: '9780306406157',
    sampleLabel: 'Clean Code: A Handbook of Agile Craft',
  },
  {
    id: 'EAN13',
    name: 'EAN-13 (International Article Number)',
    category: 'Retail',
    description: '13-digit global retail standard barcode used worldwide outside North America. Compatible with standard POS scanners.',
    allowedChars: '0-9 only',
    expectedLength: '13 digits (or 12 digits with auto check digit)',
    checkDigitRule: 'Calculated & Verified (Mod-10)',
    sample: '5901234123457',
    sampleLabel: 'European Artisan Olive Oil 500ml',
  },
  {
    id: 'EAN8',
    name: 'EAN-8 (Compact Retail)',
    category: 'Retail',
    description: 'Short 8-digit barcode designed for small consumer packages like cosmetics, chewing gum, and confectioneries.',
    allowedChars: '0-9 only',
    expectedLength: '8 digits (or 7 digits with auto check digit)',
    checkDigitRule: 'Calculated & Verified (Mod-10)',
    sample: '96385074',
    sampleLabel: 'Pocket Mint Candies 30g',
  },
  {
    id: 'UPCE',
    name: 'UPC-E (Zero-Suppressed UPC)',
    category: 'Retail',
    description: 'Compact 6 or 8-digit retail barcode using zero-suppression for smaller North American products.',
    allowedChars: '0-9 only',
    expectedLength: '6 or 8 digits',
    checkDigitRule: 'Automatic / Internal',
    sample: '01234565',
    sampleLabel: 'Travel Lip Balm 5g',
  },
  {
    id: 'CODE128',
    name: 'Code 128 (High-Density Universal)',
    category: 'Logistics & Warehousing',
    description: 'Universal high-density alphanumeric barcode. Supports all 128 ASCII characters, shipping labels, Amazon FNSKU, and serial numbers.',
    allowedChars: 'Full ASCII (Letters, Numbers, Symbols)',
    expectedLength: 'Variable (typically 6-30 characters)',
    checkDigitRule: 'Automatic / Internal',
    sample: 'AMZ-FNSKU-884920',
    sampleLabel: 'Amazon FNSKU Inventory Tracking',
  },
  {
    id: 'CODE39',
    name: 'Code 39 (Industrial & Government)',
    category: 'Logistics & Warehousing',
    description: 'Widely used in automotive, US Department of Defense, healthcare equipment, and internal asset tags.',
    allowedChars: 'A-Z, 0-9, -, ., $, /, +, %, space',
    expectedLength: 'Variable (typically 4-20 characters)',
    checkDigitRule: 'No Checksum',
    sample: 'ASSET-9042',
    sampleLabel: 'Lab Centrifuge Asset #9042',
  },
  {
    id: 'ITF14',
    name: 'ITF-14 / Interleaved 2 of 5',
    category: 'Logistics & Warehousing',
    description: 'Standard 14-digit shipping container barcode printed directly onto corrugated cardboard cartons and master cases.',
    allowedChars: '0-9 only (must be even number of digits)',
    expectedLength: '14 digits',
    checkDigitRule: 'Calculated & Verified (Mod-10)',
    sample: '10012345678902',
    sampleLabel: 'Master Case: 24x 500ml Bottles',
  },
  {
    id: 'codabar',
    name: 'Codabar (USD-4 / NW-7)',
    category: 'Specialty',
    description: 'Traditional barcode format used by blood banks, libraries, photo labs, and FedEx airbills. Starts and ends with A, B, C, or D.',
    allowedChars: '0-9, -, $, :, /, ., + and start/stop A, B, C, D',
    expectedLength: 'Variable',
    checkDigitRule: 'No Checksum',
    sample: 'A123456789B',
    sampleLabel: 'Library Archive Document #123456789',
  },
  {
    id: 'MSI',
    name: 'MSI Plessey',
    category: 'Specialty',
    description: 'Continuous barcode symbology used primarily for retail supermarket shelf tags and warehouse inventory.',
    allowedChars: '0-9 only',
    expectedLength: 'Variable digits',
    checkDigitRule: 'Calculated & Verified (Mod-10)',
    sample: '1234567',
    sampleLabel: 'Shelf Tag Shelf-Row-4',
  },
  {
    id: 'pharmacode',
    name: 'Pharmacode (One-Track)',
    category: 'Specialty',
    description: 'Standard binary barcode used exclusively in pharmaceutical packaging control to prevent package mix-ups.',
    allowedChars: 'Numbers between 3 and 131070',
    expectedLength: 'Single integer value 3..131070',
    checkDigitRule: 'No Checksum',
    sample: '12345',
    sampleLabel: 'Pharmaceutical Packaging Unit',
  },
];

/**
 * Calculates UPC-A check digit (12th digit given 11 digits)
 */
export function calculateUpcACheckDigit(elevenDigits: string): number {
  const digits = elevenDigits.replace(/\D/g, '');
  if (digits.length < 11) return -1;
  const d = digits.slice(0, 11).split('').map(Number);
  
  // Sum of odd-indexed positions (1st, 3rd, 5th, 7th, 9th, 11th -> index 0,2,4,6,8,10) * 3
  const oddSum = (d[0] + d[2] + d[4] + d[6] + d[8] + d[10]) * 3;
  // Sum of even-indexed positions (2nd, 4th, 6th, 8th, 10th -> index 1,3,5,7,9)
  const evenSum = d[1] + d[3] + d[5] + d[7] + d[9];
  const total = oddSum + evenSum;
  const rem = total % 10;
  return rem === 0 ? 0 : 10 - rem;
}

/**
 * Calculates EAN-13 check digit (13th digit given 12 digits)
 */
export function calculateEan13CheckDigit(twelveDigits: string): number {
  const digits = twelveDigits.replace(/\D/g, '');
  if (digits.length < 12) return -1;
  const d = digits.slice(0, 12).split('').map(Number);
  
  // Odd positions * 1, Even positions * 3 (1-indexed)
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += i % 2 === 0 ? d[i] : d[i] * 3;
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
}

/**
 * Calculates EAN-8 check digit (8th digit given 7 digits)
 */
export function calculateEan8CheckDigit(sevenDigits: string): number {
  const digits = sevenDigits.replace(/\D/g, '');
  if (digits.length < 7) return -1;
  const d = digits.slice(0, 7).split('').map(Number);
  
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += i % 2 === 0 ? d[i] * 3 : d[i];
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
}

/**
 * Calculates ISBN-10 check digit (given 9 digits)
 */
export function calculateIsbn10CheckDigit(nineDigits: string): string {
  const digits = nineDigits.replace(/\D/g, '');
  if (digits.length < 9) return '';
  const d = digits.slice(0, 9).split('').map(Number);
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += d[i] * (10 - i);
  }
  const rem = sum % 11;
  const check = (11 - rem) % 11;
  return check === 10 ? 'X' : String(check);
}

/**
 * Converts a 10-digit ISBN to standard 13-digit Bookland EAN
 */
export function convertIsbn10ToIsbn13(isbn10: string): string {
  const clean = isbn10.replace(/[^0-9X]/gi, '').toUpperCase();
  const first9 = clean.slice(0, 9);
  if (first9.length !== 9) return isbn10;
  const pre12 = '978' + first9;
  const check = calculateEan13CheckDigit(pre12);
  return pre12 + check;
}

/**
 * Formats ISBN-13 with standard Bookland hyphens (978-X-XXX-XXXXX-X or similar)
 */
export function formatIsbnDisplay(rawIsbn: string): string {
  const clean = rawIsbn.replace(/\D/g, '');
  if (clean.length === 13) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 7)}-${clean.slice(7, 12)}-${clean.slice(12)}`;
  }
  return rawIsbn;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  message?: string;
  suggestedFix?: string;
  canAutoFix?: boolean;
}

/**
 * Validates barcode value and provides intelligent checksum correction suggestions
 */
export function validateBarcode(format: BarcodeFormat, value: string): BarcodeValidationResult {
  if (!value || value.trim().length === 0) {
    return { isValid: false, message: 'Please enter a barcode value.' };
  }

  const cleanVal = value.trim();

  switch (format) {
    case 'UPC': {
      const digits = cleanVal.replace(/\D/g, '');
      if (!/^\d+$/.test(cleanVal)) {
        return { isValid: false, message: 'UPC-A must contain numbers only.' };
      }
      if (digits.length === 11) {
        const check = calculateUpcACheckDigit(digits);
        return {
          isValid: false,
          message: 'UPC-A is missing the 12th check digit.',
          suggestedFix: digits + check,
          canAutoFix: true,
        };
      }
      if (digits.length === 12) {
        const expectedCheck = calculateUpcACheckDigit(digits.slice(0, 11));
        const actualCheck = Number(digits[11]);
        if (expectedCheck !== actualCheck) {
          return {
            isValid: false,
            message: `Invalid check digit: expected ${expectedCheck}, got ${actualCheck}.`,
            suggestedFix: digits.slice(0, 11) + expectedCheck,
            canAutoFix: true,
          };
        }
        return { isValid: true };
      }
      return { isValid: false, message: `UPC-A requires 12 digits (currently ${digits.length}).` };
    }

    case 'ISBN': {
      const cleanUpper = cleanVal.replace(/[-\s]/g, '').toUpperCase();
      // Check if it's 10 digits
      if (cleanUpper.length === 10) {
        const isbn13 = convertIsbn10ToIsbn13(cleanUpper);
        return {
          isValid: true,
          message: 'ISBN-10 detected (will render as standard ISBN-13 Bookland EAN).',
          suggestedFix: isbn13,
          canAutoFix: true,
        };
      }
      const digits = cleanUpper.replace(/\D/g, '');
      if (digits.length === 12 && (digits.startsWith('978') || digits.startsWith('979'))) {
        const check = calculateEan13CheckDigit(digits);
        return {
          isValid: false,
          message: 'ISBN-13 is missing the 13th check digit.',
          suggestedFix: digits + check,
          canAutoFix: true,
        };
      }
      if (digits.length === 13) {
        if (!digits.startsWith('978') && !digits.startsWith('979')) {
          return { isValid: false, message: 'ISBN-13 must start with 978 or 979.' };
        }
        const expectedCheck = calculateEan13CheckDigit(digits.slice(0, 12));
        const actualCheck = Number(digits[12]);
        if (expectedCheck !== actualCheck) {
          return {
            isValid: false,
            message: `Invalid check digit: expected ${expectedCheck}, got ${actualCheck}.`,
            suggestedFix: digits.slice(0, 12) + expectedCheck,
            canAutoFix: true,
          };
        }
        return { isValid: true };
      }
      return { isValid: false, message: `ISBN requires 13 digits (starts with 978/979) or 10 digits.` };
    }

    case 'EAN13': {
      const digits = cleanVal.replace(/\D/g, '');
      if (!/^\d+$/.test(cleanVal)) {
        return { isValid: false, message: 'EAN-13 must contain numbers only.' };
      }
      if (digits.length === 12) {
        const check = calculateEan13CheckDigit(digits);
        return {
          isValid: false,
          message: 'EAN-13 is missing the 13th check digit.',
          suggestedFix: digits + check,
          canAutoFix: true,
        };
      }
      if (digits.length === 13) {
        const expectedCheck = calculateEan13CheckDigit(digits.slice(0, 12));
        const actualCheck = Number(digits[12]);
        if (expectedCheck !== actualCheck) {
          return {
            isValid: false,
            message: `Invalid check digit: expected ${expectedCheck}, got ${actualCheck}.`,
            suggestedFix: digits.slice(0, 12) + expectedCheck,
            canAutoFix: true,
          };
        }
        return { isValid: true };
      }
      return { isValid: false, message: `EAN-13 requires 13 digits (currently ${digits.length}).` };
    }

    case 'EAN8': {
      const digits = cleanVal.replace(/\D/g, '');
      if (!/^\d+$/.test(cleanVal)) {
        return { isValid: false, message: 'EAN-8 must contain numbers only.' };
      }
      if (digits.length === 7) {
        const check = calculateEan8CheckDigit(digits);
        return {
          isValid: false,
          message: 'EAN-8 is missing the 8th check digit.',
          suggestedFix: digits + check,
          canAutoFix: true,
        };
      }
      if (digits.length === 8) {
        const expectedCheck = calculateEan8CheckDigit(digits.slice(0, 7));
        const actualCheck = Number(digits[7]);
        if (expectedCheck !== actualCheck) {
          return {
            isValid: false,
            message: `Invalid check digit: expected ${expectedCheck}, got ${actualCheck}.`,
            suggestedFix: digits.slice(0, 7) + expectedCheck,
            canAutoFix: true,
          };
        }
        return { isValid: true };
      }
      return { isValid: false, message: `EAN-8 requires 8 digits (currently ${digits.length}).` };
    }

    case 'UPCE': {
      const digits = cleanVal.replace(/\D/g, '');
      if (!/^\d+$/.test(cleanVal)) {
        return { isValid: false, message: 'UPC-E must contain numbers only.' };
      }
      if (digits.length !== 6 && digits.length !== 8) {
        return { isValid: false, message: 'UPC-E requires 6 or 8 digits.' };
      }
      return { isValid: true };
    }

    case 'CODE39': {
      // Code 39 allowed: 0-9, A-Z, -, ., $, /, +, %, and space
      const upper = cleanVal.toUpperCase();
      if (!/^[0-9A-Z\-. $/+%]+$/.test(upper)) {
        return { isValid: false, message: 'Code 39 only allows uppercase letters, digits, and - . $ / + % [space].' };
      }
      return { isValid: true };
    }

    case 'ITF14': {
      const digits = cleanVal.replace(/\D/g, '');
      if (!/^\d+$/.test(cleanVal)) {
        return { isValid: false, message: 'ITF-14 must contain numbers only.' };
      }
      if (digits.length % 2 !== 0) {
        return { isValid: false, message: 'ITF requires an even number of digits (e.g. 14 digits).' };
      }
      return { isValid: true };
    }

    case 'codabar': {
      if (!/^[A-D][0-9\-$:/.+]+[A-D]$/i.test(cleanVal)) {
        return {
          isValid: false,
          message: 'Codabar must start and end with A, B, C, or D (e.g. A123456789B).',
          suggestedFix: `A${cleanVal.replace(/[^0-9]/g, '') || '12345'}B`,
          canAutoFix: true,
        };
      }
      return { isValid: true };
    }

    case 'pharmacode': {
      const num = Number(cleanVal);
      if (isNaN(num) || num < 3 || num > 131070 || !Number.isInteger(num)) {
        return { isValid: false, message: 'Pharmacode must be an integer between 3 and 131,070.' };
      }
      return { isValid: true };
    }

    case 'MSI': {
      if (!/^\d+$/.test(cleanVal)) {
        return { isValid: false, message: 'MSI requires digits only.' };
      }
      return { isValid: true };
    }

    case 'CODE128':
    default:
      // Code 128 accepts all ASCII characters
      if (cleanVal.length === 0) {
        return { isValid: false, message: 'Value cannot be empty.' };
      }
      return { isValid: true };
  }
}
