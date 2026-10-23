# OpenCode Studio — Free & Open-Source QR Code & Barcode Studio

A free, privacy-first, 100% client-side QR code and barcode studio designed for small businesses, developers, educators, retailers, inventory managers, and publishers.

Zero account registration, zero telemetry, zero server-side storage, and zero paid API dependencies.

---

## Features

### 1. Barcode Studio
- **Retail & Point-of-Sale**:
  - `UPC-A` (12 digits, North America)
  - `UPC-E` (zero-compressed 6-8 digits)
  - `EAN-13` (13 digits, international retail)
  - `EAN-8` (8 digits, compact retail items)
- **Book Publishing**:
  - `ISBN-13` (978/979 Bookland symbology)
  - `ISBN-10` (automatic conversion to official ISBN-13 format)
- **Logistics, Shipping & Warehousing**:
  - `Code 128` (full ASCII, dense alphanumeric)
  - `Code 39` (standard industrial tracking & asset management)
  - `ITF-14` / `ITF` (Interleaved 2 of 5, master carton shipping)
  - `Codabar` (blood banks, libraries, photo labs)
  - `MSI` / `Pharmacode`
- **Algorithmic Check Digit Engine**:
  - Live Modulo-10 (weights 3, 1) and Modulo-11 calculation.
  - Actionable feedback with one-click automatic check-digit repair (`Auto-Fix`).
- **Commercial Identification Notice**:
  - Prominent advisory explaining that generating a barcode assigns no legal license or GS1/ISBN registration without proper authority filing.

### 2. QR Code Studio
- **12 Dedicated Payloads**:
  - Website / URL
  - Plain Text
  - Wi-Fi Network (`WPA/WPA2/WPA3/WEP/None`, hidden SSID, special character escaping)
  - vCard 3.0 (`N`, `FN`, `ORG`, `TITLE`, `TEL`, `EMAIL`, `URL`, `ADR`)
  - WhatsApp Direct Chat (`https://wa.me/...`)
  - Email (mailto with subject and body)
  - Phone (`tel:`)
  - SMS (`smsto:`)
  - Geolocation Map Coordinates (`geo:lat,lng`)
  - Calendar Event (`VEVENT` with start/end time and location)
  - Deep Link (custom schemas e.g. `myapp://`, `spotify:`, `tg:`)
  - Crypto / UPI Payment payload
- **Visual Customization & Dot Styling**:
  - Dot styles: `Square`, `Rounded`, `Circles / Dots` (with preserved finder pattern eyes).
  - Center Logo Upload & Built-in Brand Badges (Globe, Wi-Fi, WhatsApp, Card, Map).
  - Protective white backing badge behind logos to prevent data clobbering.
  - Foreground & background colors (with transparent background option).
  - Error correction levels: `L` (~7%), `M` (~15%), `Q` (~25%), `H` (~30%).
  - Live WCAG contrast ratio scoring with scannability safety alerts.

### 3. High-Quality Vector & Raster Exports
- **Vector SVG**: Pixel-crisp vector markup without raster distortion at any print size.
- **High-DPI PNG**: 1x, 2x (Retina), and 4x (Ultra HD 300+ DPI print) raster rendering.
- **Printable PDF**: Single-click PDF generation via `jsPDF`.
- **JPEG & WebP**: For web publishing and compressed file archives.
- **Copy to Clipboard**: Instant PNG image clipboard copy for pasting into Photoshop, Word, or Slack.
- **Custom Filename Input**: Direct control over exported file naming.

### 4. Printable Avery Label Sheets
- Generates formatted multi-label peel-and-stick grid sheets:
  - **Avery 5160 / 8160** (30 labels per letter sheet, 2.625" × 1")
  - **Avery 5163 / 8163** (10 labels per letter sheet, 4" × 2" with barcode + human-readable text)
  - **European A4 24-up** (70mm × 36mm grid)
- Browser-native print styles (`@media print`) and PDF download.

### 5. High-Volume Batch Generator
- Paste newline-delimited values or upload `.csv` files.
- Row-by-row validation with individual status badges.
- Single-item vector SVG downloads.
- **One-Click ZIP Bundle**: Packages all generated SVG barcodes alongside an automatically generated `batch_manifest.csv` audit sheet.
- Standalone CSV manifest export.

### 6. Interactive Scanner & Decoder
- Scan from file upload or live camera feed.
- Uses native high-speed hardware-accelerated `BarcodeDetector` with canvas fallback.
- Detects format and decoded payload with a 1-click **Open in Studio** button to re-edit or re-style existing codes.

### 7. Privacy & Security
- **100% Client-Side**: No code or user input is sent to any server.
- **Sensitive Credential Protection**: Wi-Fi passwords are automatically masked before storing in local browser history.
- **Full User Control**: Opt out of history recording at any time; 1-click history wipe.

---

## Tech Stack & Architecture

- **Framework**: React 19 + TypeScript (Strict Mode)
- **Styling**: Tailwind CSS v4 + Plus Jakarta Sans + JetBrains Mono
- **Rendering Libraries**:
  - `qrcode` for QR matrix generation, vector SVG path construction, and custom canvas drawing.
  - `jsbarcode` for GS1/UPC/EAN/Code 128 rendering with canvas-to-SVG extraction.
  - `jspdf` for vector/high-DPI PDF document export.
  - `jszip` for client-side batch archive packaging.
- **Icons**: Lucide React

---

## Local Development & Testing

### Installation

```bash
# Clone the repository
git clone https://github.com/itsyomikeyyyy/qrGenerator.git
cd qrGenerator

# Install dependencies
npm install

# Start Vite development server (Port 3000)
npm run dev
```

### Running Automated Tests

The application includes an automated test suite verifying UPC/EAN check digit algorithms, ISBN-10 to ISBN-13 conversion, Code 39/ITF validation, Wi-Fi escaping, vCard 3.0 formatting, and contrast calculations:

```bash
npm test
```

### Full Quality Check (Test, Lint & Build)

```bash
npm run check
```

### Building for Production

```bash
npm run build
```

---

## Standards Notice

- UPC, EAN, and ISBN are standardized international trade identifiers. Generating a syntactically valid barcode with this open-source utility does not officially license, register, or assign product ownership.
- Official retail identifiers must be obtained through [GS1](https://www.gs1.org/) or authorized national ISBN agencies (such as Bowker in the United States).

---

## License

Released under the [MIT License](LICENSE). Free for personal, educational, commercial, and open-source use.
