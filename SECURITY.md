# Security & Privacy Policy

OpenCode Studio takes user security and data privacy seriously.

## Privacy Architecture

- **100% Client-Side Execution**: All barcode and QR code calculations, canvas rendering, vector SVG serialization, PDF layout, and ZIP compression occur exclusively in the user's web browser memory.
- **Zero Remote Telemetry**: The application does not send payload strings, URLs, contacts, or network credentials to any third-party analytics or server endpoints.
- **Sensitive Payload Masking**: Wi-Fi passwords and sensitive credentials are masked before storing in local browser history (`localStorage`).
- **History Retention Opt-Out**: Users can disable local history recording at any time or clear all stored items with a single click.

## Security Considerations

- **Filename Sanitization**: Export utilities automatically strip directory traversal patterns (`../`) and illegal operating system characters to prevent file-write vulnerabilities.
- **Input Sanitization**: SVG and DOM generation avoids `eval` and unescaped HTML injection.
- **Safe CSV Parsing**: The batch engine uses an RFC-4180-compliant state parser to safely handle escaped quotes, commas, and multiline entries without arbitrary script execution.

## Reporting a Vulnerability

If you discover a security vulnerability within OpenCode Studio, please do not file a public issue. Instead, submit a security advisory report to:

- Email: `security@opencodestudio.org`

We will review, verify, and resolve verified vulnerabilities promptly.
