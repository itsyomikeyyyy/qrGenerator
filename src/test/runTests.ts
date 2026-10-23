/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculateUpcACheckDigit,
  calculateEan13CheckDigit,
  calculateEan8CheckDigit,
  calculateIsbn10CheckDigit,
  convertIsbn10ToIsbn13,
  validateBarcode,
} from '../utils/barcodeUtils';
import {
  buildWiFiPayload,
  buildVCardPayload,
  buildWhatsAppPayload,
  buildDeepLinkPayload,
  calculateContrastRatio,
  checkQRScannability,
} from '../utils/qrUtils';
import { QRConfig } from '../types';
import { sanitizeFilename } from '../utils/exportUtils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function runAllTests() {
  console.log('--- Running OpenCode Studio Automated Test Suite ---\n');

  // Test 1: UPC-A check digit calculation & validation
  console.log('Group 1: UPC-A Retail Validation');
  const upcCheck = calculateUpcACheckDigit('01234567890');
  assert(upcCheck === 5, 'UPC-A check digit for 01234567890 should be 5');

  const validUpc = validateBarcode('UPC', '012345678905');
  assert(validUpc.isValid === true, '012345678905 should be recognized as a valid UPC-A');

  const invalidUpcCheck = validateBarcode('UPC', '012345678909');
  assert(
    invalidUpcCheck.isValid === false && invalidUpcCheck.suggestedFix === '012345678905',
    'Invalid UPC check digit should suggest correct check digit 5'
  );

  const missingUpcDigit = validateBarcode('UPC', '01234567890');
  assert(
    missingUpcDigit.isValid === false && missingUpcDigit.canAutoFix === true,
    '11-digit UPC should trigger canAutoFix with 12th digit'
  );

  // Test 2: EAN-13 & EAN-8 Global Retail
  console.log('\nGroup 2: EAN-13 & EAN-8 Validation');
  const ean13Check = calculateEan13CheckDigit('590123412345');
  assert(ean13Check === 7, 'EAN-13 check digit for 590123412345 should be 7');

  const validEan13 = validateBarcode('EAN13', '5901234123457');
  assert(validEan13.isValid === true, '5901234123457 should be valid EAN-13');

  const ean8Check = calculateEan8CheckDigit('9638507');
  assert(ean8Check === 4, 'EAN-8 check digit for 9638507 should be 4');

  const validEan8 = validateBarcode('EAN8', '96385074');
  assert(validEan8.isValid === true, '96385074 should be valid EAN-8');

  // Test 3: ISBN-10 to ISBN-13 Conversion & Bookland
  console.log('\nGroup 3: ISBN Bookland Symbology');
  const isbn10Check = calculateIsbn10CheckDigit('030640615');
  assert(isbn10Check === '2', 'ISBN-10 check digit for 030640615 should be 2');

  const convertedIsbn = convertIsbn10ToIsbn13('0306406152');
  assert(
    convertedIsbn === '9780306406157',
    'ISBN-10 0306406152 should convert to ISBN-13 9780306406157'
  );

  const validIsbn13 = validateBarcode('ISBN', '9780306406157');
  assert(validIsbn13.isValid === true, '9780306406157 should be recognized as a valid ISBN-13');

  const invalidIsbnPrefix = validateBarcode('ISBN', '1230306406157');
  assert(
    invalidIsbnPrefix.isValid === false,
    'ISBN-13 not starting with 978 or 979 should be rejected'
  );

  // Test 4: Industrial Standards (Code 39, Code 128, ITF-14)
  console.log('\nGroup 4: Logistics & Industrial Barcodes');
  const validCode39 = validateBarcode('CODE39', 'ASSET-9042');
  assert(validCode39.isValid === true, 'ASSET-9042 is valid Code 39');

  const invalidCode39 = validateBarcode('CODE39', 'asset#lowercase');
  assert(invalidCode39.isValid === false, 'Code 39 rejects lowercase and # symbol');

  const validItf = validateBarcode('ITF14', '10012345678902');
  assert(validItf.isValid === true, '14-digit ITF should be valid');

  const oddItf = validateBarcode('ITF14', '1001234567890');
  assert(oddItf.isValid === false, 'ITF with odd number of digits must be rejected');

  // Test 5: QR Code Payload Builders
  console.log('\nGroup 5: QR Code Payload Encoding');
  const wifiPayload = buildWiFiPayload({
    ssid: 'StudioNet;5G',
    password: 'secret:password',
    encryption: 'WPA',
    hidden: true,
  });
  assert(
    wifiPayload.includes('S:StudioNet\\;5G;') && wifiPayload.includes('H:true;;'),
    'Wi-Fi payload correctly escapes semicolons and sets hidden attribute'
  );

  const vcard = buildVCardPayload({
    firstName: 'Linus',
    lastName: 'Torvalds',
    organization: 'Linux Foundation',
    title: 'Creator',
    phone: '+15551234567',
    email: 'linus@example.org',
    url: 'https://kernel.org',
    address: 'Portland, OR',
    note: 'Git & Linux kernel author',
  });
  assert(
    vcard.startsWith('BEGIN:VCARD') && vcard.endsWith('END:VCARD') && vcard.includes('FN:Linus Torvalds'),
    'vCard conforms to vCard 3.0 specification'
  );

  const whatsapp = buildWhatsAppPayload({
    phoneNumber: '+1 (555) 019-2834',
    message: 'Hello there!',
  });
  assert(
    whatsapp === 'https://wa.me/15550192834?text=Hello%20there!',
    'WhatsApp link strips phone decoration and encodes message URI'
  );

  // Test 6: Scannability & Contrast Evaluation
  console.log('\nGroup 6: QR Scannability & Contrast Ratios');
  const highContrast = calculateContrastRatio('#000000', '#ffffff');
  assert(highContrast >= 20, 'Black on white contrast ratio should be ~21:1');

  const lowContrast = calculateContrastRatio('#888888', '#999999');
  assert(lowContrast < 3, 'Gray on gray contrast should be detected as low (<3:1)');

  const mockQrConfig: QRConfig = {
    type: 'url',
    rawValue: 'https://example.com',
    size: 280,
    margin: 2,
    errorCorrectionLevel: 'L',
    fgColor: '#000000',
    bgColor: '#ffffff',
    isTransparentBg: false,
    dotStyle: 'square',
    eyeStyle: 'square',
    frameStyle: 'none',
    frameLabel: '',
    logoPreset: 'github',
    logoSizePercent: 24,
  };
  const scannabilityCheck = checkQRScannability(mockQrConfig);
  assert(
    scannabilityCheck.warnings.length > 0,
    'Scannability checker should flag active logo with Level L error correction'
  );

  // Test 7: Filename Sanitization & Path Traversal Security
  console.log('\nGroup 7: Filename Sanitization & Security');

  assert(
    !sanitizeFilename('../../etc/passwd').includes('/') && !sanitizeFilename('../../etc/passwd').includes('..'),
    'Path traversal characters ../ must be stripped or neutralized'
  );
  assert(
    sanitizeFilename('product:code?*<tag>|name.png').includes('_') && !sanitizeFilename('product:code?*<tag>|name.png').includes('<'),
    'Reserved filesystem and XML characters must be sanitized'
  );
  assert(
    sanitizeFilename('', 'fallback-name') === 'fallback-name',
    'Empty or whitespace filenames should revert to safe default'
  );

  // Test 8: RFC-4180 CSV Batch Parsing
  console.log('\nGroup 8: RFC-4180 CSV Batch Parsing');
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
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

  const simpleCsv = parseCsvLine('012345678905, Dark Roast Coffee');
  assert(
    simpleCsv[0] === '012345678905' && simpleCsv[1] === 'Dark Roast Coffee',
    'Simple comma separated values parse into code and label'
  );

  const quotedCsv = parseCsvLine('"049000000443", "Cola Drink, 12 Fl Oz (Pack of 6)"');
  assert(
    quotedCsv[0] === '049000000443' && quotedCsv[1] === 'Cola Drink, 12 Fl Oz (Pack of 6)',
    'Quoted fields with internal commas must not be split prematurely'
  );

  const escapedQuotesCsv = parseCsvLine('"011110417004", "Organic ""Grade A"" Butter"');
  assert(
    escapedQuotesCsv[1] === 'Organic "Grade A" Butter',
    'Double escaped quotes inside quoted fields must resolve to single quote'
  );

  // Test 9: Symbology Edge Cases (Code 128, Codabar)
  console.log('\nGroup 9: Symbology Character Sets & Lengths');
  const validCode128 = validateBarcode('CODE128', 'INV-2026-XYZ#99');
  assert(validCode128.isValid === true, 'Code 128 supports full ASCII string with hyphens and hashes');

  const validCodabar = validateBarcode('codabar', 'A123456789B');
  assert(validCodabar.isValid === true, 'Codabar starting with A and ending with B is valid');

  const invalidCodabar = validateBarcode('codabar', '123456789');
  assert(invalidCodabar.isValid === false, 'Codabar missing start/stop characters should be rejected');

  // Test 10: Deep Link & Geo Payloads
  console.log('\nGroup 10: Extended QR Payloads');
  const deepLink = buildDeepLinkPayload({ schemeOrUrl: '  spotify:track:4cOdK2wGLETKBW3PvgPWqT  ' });
  assert(deepLink === 'spotify:track:4cOdK2wGLETKBW3PvgPWqT', 'Deep link payload trims extraneous whitespace');

  const emptyFilename = sanitizeFilename('', 'fallback-name');
  assert(emptyFilename === 'fallback-name', 'Sanitizing empty string returns safe fallback name');

  console.log(`\n=========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`=========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
