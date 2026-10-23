# Contributing to OpenCode Studio

Thank you for your interest in contributing to OpenCode Studio! We welcome community contributions from developers, designers, barcode standard specialists, and documentation authors.

## Code of Conduct

Please maintain a welcoming, respectful, and constructive environment for all participants regardless of background or level of experience.

## Principles

1. **100% Client-Side Integrity**: No code or user data should ever be sent to external servers or cloud APIs without explicit user consent.
2. **Barcode Standards Precision**: Check-digit algorithms and character validations must adhere to published standards (GS1, ISO/IEC 15420, ISO/IEC 15417, Bowker ISBN, etc.).
3. **Anti-Slop Clean Design**: Clean, functional interfaces without decorative fake progress indicators or artificial delays.

## Development Setup

```bash
# Clone repository
git clone https://github.com/itsyomikeyyyy/qrGenerator.git
cd qrGenerator

# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Run the test suite
npm test
```

## Adding a New Barcode Format or QR Preset

1. **Validation & Calculation**: Add format rules and check-digit logic in `src/utils/barcodeUtils.ts` or payload construction in `src/utils/qrUtils.ts`.
2. **Automated Tests**: Add test cases to `src/test/runTests.ts` covering valid inputs, invalid inputs, edge cases, and auto-fix logic. Run `npm test`.
3. **UI Integration**: Update format dropdowns and input presets in `BarcodeGenerator.tsx` or `QRCodeGenerator.tsx`.
4. **Verification**: Run `npm run lint` and `npm run build` to verify clean compilation.

## Pull Request Guidelines

- Ensure `npm test` passes 100% of test cases.
- Avoid introducing heavy dependencies.
- Include a concise description of the bug fix or feature.
