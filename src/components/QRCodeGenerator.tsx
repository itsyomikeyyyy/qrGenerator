/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useId } from 'react';
import QRCode from 'qrcode';
import { 
  QRConfig, 
  QRType, 
  QRErrorCorrection, 
  HistoryItem, 
  WiFiData, 
  VCardData, 
  EmailData, 
  EventData, 
  CryptoData,
  WhatsAppData,
  DeepLinkData 
} from '../types';
import { 
  buildWiFiPayload, 
  buildVCardPayload, 
  buildEmailPayload, 
  buildEventPayload, 
  buildCryptoPayload,
  buildWhatsAppPayload,
  buildDeepLinkPayload,
  checkQRScannability
} from '../utils/qrUtils';
import { 
  downloadSvg, 
  downloadRaster, 
  downloadPdf,
  copyToClipboard,
  sanitizeFilename 
} from '../utils/exportUtils';
import { logger } from '../utils/logger';
import { 
  Link2, 
  Type, 
  Wifi, 
  UserSquare2, 
  Mail, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  Coins, 
  Check, 
  Copy, 
  Download, 
  Printer, 
  Bookmark, 
  FileCode2, 
  Image as ImageIcon,
  Upload,
  Trash2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

interface QRCodeGeneratorProps {
  initialConfig?: Partial<QRConfig>;
  onSaveToHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
  onSendToLabelSheet: (item: { value: string; label: string; price?: string; isQr: boolean }) => void;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  initialConfig,
  onSaveToHistory,
  onSendToLabelSheet,
}) => {
  const [qrType, setQrType] = useState<QRType>('url');
  
  // Specific payload states
  const [urlValue, setUrlValue] = useState<string>('https://github.com');
  const [textValue, setTextValue] = useState<string>('Hello from OpenCode Studio!');
  const [wifiData, setWifiData] = useState<WiFiData>({
    ssid: 'Guest_HighSpeed_WiFi',
    password: 'WelcomeToStudio2026',
    encryption: 'WPA',
    hidden: false,
  });
  const [vcardData, setVcardData] = useState<VCardData>({
    firstName: 'Alex',
    lastName: 'Morgan',
    organization: 'Open Source Labs',
    title: 'Lead Architect',
    phone: '+1 (555) 234-5678',
    email: 'alex@example.org',
    url: 'https://example.org',
    address: '742 Evergreen Terrace, Springfield',
    note: 'Open source software enthusiast',
  });
  const [emailData, setEmailData] = useState<EmailData>({
    to: 'support@example.org',
    subject: 'Feedback on OpenCode Studio',
    body: 'Hi team, I really enjoy using the barcode and QR studio.',
  });
  const [phoneValue, setPhoneValue] = useState<string>('+15552345678');
  const [smsData, setSmsData] = useState<{ number: string; message: string }>({
    number: '+15552345678',
    message: 'Hello, I am interested in your services.',
  });
  const [geoData, setGeoData] = useState<{ lat: string; lng: string }>({
    lat: '37.7749',
    lng: '-122.4194',
  });
  const [eventData, setEventData] = useState<EventData>({
    title: 'Global Open Source Summit 2026',
    startDate: '2026-11-15T09:00',
    endDate: '2026-11-15T17:00',
    location: 'Convention Center, Main Hall',
    description: 'Annual gathering of open source creators and contributors.',
  });
  const [cryptoData, setCryptoData] = useState<CryptoData>({
    currency: 'bitcoin',
    address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    amount: '0.005',
    label: 'Open Source Contribution',
  });
  const [whatsappData, setWhatsappData] = useState<WhatsAppData>({
    phoneNumber: '+15552345678',
    message: 'Hello! I am reaching out regarding your product.',
  });
  const [deepLinkData, setDeepLinkData] = useState<DeepLinkData>({
    schemeOrUrl: 'slack://channel?team=T01234&id=C01234',
    appName: 'Slack Channel',
  });
  const [customFilename, setCustomFilename] = useState<string>('');

  // Visual Styling Configuration
  const [config, setConfig] = useState<QRConfig>({
    type: 'url',
    rawValue: 'https://github.com',
    size: 280,
    margin: 2,
    errorCorrectionLevel: 'H', // H enables clean logo insertion
    fgColor: '#0f172a',
    bgColor: '#ffffff',
    isTransparentBg: false,
    dotStyle: 'square',
    eyeStyle: 'square',
    frameStyle: 'none',
    frameLabel: 'SCAN ME',
    frameSubtext: 'Use your smartphone camera',
    logoPreset: undefined,
    customLogoUrl: undefined,
    logoSizePercent: 22,
  });

  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'frame'>('content');
  const [exportScale, setExportScale] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [svgString, setSvgString] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form input IDs
  const qrUrlInputId = useId();
  const textInputId = useId();
  const wifiSsidId = useId();
  const wifiPassId = useId();
  const wifiEncId = useId();
  const vcardFirstId = useId();
  const vcardLastId = useId();
  const vcardOrgId = useId();
  const vcardPhoneId = useId();
  const vcardEmailId = useId();
  const vcardUrlId = useId();
  const emailToId = useId();
  const emailSubId = useId();
  const emailBodyId = useId();
  const phoneInputId = useId();
  const smsNumberId = useId();
  const smsMsgId = useId();
  const geoLatId = useId();
  const geoLngId = useId();
  const eventTitleId = useId();
  const eventStartId = useId();
  const eventEndId = useId();
  const eventLocId = useId();
  const cryptoCurrId = useId();
  const cryptoAddrId = useId();
  const cryptoAmntId = useId();
  const errorCorrId = useId();
  const qrSizeId = useId();
  const qrMarginId = useId();
  const frameTextId = useId();
  const frameSubtextId = useId();

  // Compute Current Raw QR Payload based on selected Type
  const computePayload = (): string => {
    switch (qrType) {
      case 'url':
        return urlValue.trim().startsWith('http') ? urlValue.trim() : `https://${urlValue.trim()}`;
      case 'text':
        return textValue;
      case 'wifi':
        return buildWiFiPayload(wifiData);
      case 'vcard':
        return buildVCardPayload(vcardData);
      case 'whatsapp':
        return buildWhatsAppPayload(whatsappData);
      case 'deeplink':
        return buildDeepLinkPayload(deepLinkData);
      case 'email':
        return buildEmailPayload(emailData);
      case 'phone':
        return `tel:${phoneValue.replace(/\s+/g, '')}`;
      case 'sms':
        return `smsto:${smsData.number}:${smsData.message}`;
      case 'geo':
        return `geo:${geoData.lat},${geoData.lng}`;
      case 'event':
        return buildEventPayload(eventData);
      case 'crypto':
        return buildCryptoPayload(cryptoData);
      default:
        return urlValue;
    }
  };

  const payload = computePayload();
  const scannability = checkQRScannability(config);

  // Draw QR code onto canvas with optional center logo and dot style
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = async () => {
      try {
        // Generate SVG string for vector export
        const svg = await QRCode.toString(payload, {
          type: 'svg',
          errorCorrectionLevel: config.errorCorrectionLevel,
          margin: config.margin,
          color: {
            dark: config.fgColor,
            light: config.isTransparentBg ? '#00000000' : config.bgColor,
          },
          width: config.size,
        });
        setSvgString(svg);

        if (config.dotStyle === 'square') {
          // Standard crisp rendering
          await QRCode.toCanvas(canvas, payload, {
            width: config.size,
            margin: config.margin,
            errorCorrectionLevel: config.errorCorrectionLevel,
            color: {
              dark: config.fgColor,
              light: config.isTransparentBg ? '#00000000' : config.bgColor,
            },
          });
        } else {
          // Custom module rendering (dots or rounded)
          const qrData = QRCode.create(payload, {
            errorCorrectionLevel: config.errorCorrectionLevel,
          });
          const moduleCount = qrData.modules.size;
          const margin = config.margin;
          const totalModules = moduleCount + margin * 2;
          const cellSize = config.size / totalModules;

          canvas.width = config.size;
          canvas.height = config.size;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!config.isTransparentBg) {
              ctx.fillStyle = config.bgColor || '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.fillStyle = config.fgColor || '#0f172a';

            for (let r = 0; r < moduleCount; r++) {
              for (let c = 0; c < moduleCount; c++) {
                if (qrData.modules.get(r, c)) {
                  const x = (c + margin) * cellSize;
                  const y = (r + margin) * cellSize;

                  // Check if this module is part of the 3 corner finder patterns (7x7 corners)
                  const isFinder =
                    (r < 7 && c < 7) ||
                    (r < 7 && c >= moduleCount - 7) ||
                    (r >= moduleCount - 7 && c < 7);

                  if (isFinder) {
                    // Render finder pattern crisp for high scan reliability
                    ctx.fillRect(x, y, cellSize + 0.5, cellSize + 0.5);
                  } else if (config.dotStyle === 'dots') {
                    ctx.beginPath();
                    ctx.arc(
                      x + cellSize / 2,
                      y + cellSize / 2,
                      cellSize * 0.45,
                      0,
                      Math.PI * 2
                    );
                    ctx.fill();
                  } else if (config.dotStyle === 'rounded') {
                    ctx.beginPath();
                    ctx.roundRect(
                      x + 0.4,
                      y + 0.4,
                      cellSize - 0.8,
                      cellSize - 0.8,
                      cellSize * 0.35
                    );
                    ctx.fill();
                  } else {
                    ctx.fillRect(x, y, cellSize + 0.5, cellSize + 0.5);
                  }
                }
              }
            }
          }
        }

        // If logo is enabled, draw logo on top of canvas
        const logoUrl =
          config.customLogoUrl || (config.logoPreset ? getLogoPresetUrl(config.logoPreset) : null);
        if (logoUrl) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const logoSize = config.size * (config.logoSizePercent / 100);
              const x = (canvas.width - logoSize) / 2;
              const y = (canvas.height - logoSize) / 2;

              // Draw white circular or rounded backing badge behind logo so QR remains readable
              const badgePadding = 6;
              const badgeSize = logoSize + badgePadding * 2;
              const bx = (canvas.width - badgeSize) / 2;
              const by = (canvas.height - badgeSize) / 2;

              ctx.save();
              ctx.fillStyle = config.bgColor || '#ffffff';
              ctx.beginPath();
              ctx.roundRect(bx, by, badgeSize, badgeSize, 10);
              ctx.fill();
              ctx.strokeStyle = config.fgColor;
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Draw logo centered
              ctx.drawImage(img, x, y, logoSize, logoSize);
              ctx.restore();
            };
            img.src = logoUrl;
          }
        }
      } catch (err) {
        logger.error('QR code rendering failed:', err);
      }
    };

    render();
  }, [payload, config]);

  const getLogoPresetUrl = (preset: string): string => {
    const svgMap: Record<string, string> = {
      link: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${config.fgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
      wifi: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${config.fgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
      contact: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${config.fgColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
      github: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="${config.fgColor}"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`,
      star: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="${config.fgColor}" stroke="${config.fgColor}" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    };
    const svg = svgMap[preset] || svgMap.link;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setConfig((prev) => ({
          ...prev,
          customLogoUrl: reader.result as string,
          logoPreset: undefined,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getEffectiveFilename = () => {
    if (customFilename.trim()) {
      return customFilename.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    }
    return `qrcode_${qrType}_${Date.now()}`;
  };

  const handleDownloadSvg = () => {
    if (!svgString || isExporting) return;
    const safeName = sanitizeFilename(getEffectiveFilename(), 'qrcode');
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadRaster = async (format: 'png' | 'jpeg' | 'webp') => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await downloadRaster(
        canvasRef.current,
        getEffectiveFilename(),
        format,
        exportScale,
        config.isTransparentBg ? 'transparent' : config.bgColor
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await downloadPdf(canvasRef.current, getEffectiveFilename(), {
        title: config.frameLabel || `${qrType.toUpperCase()} QR Code`,
        subtext: config.frameSubtext,
        codeValue: qrType === 'url' ? urlValue : qrType === 'wifi' ? `Wi-Fi: ${wifiData.ssid}` : payload.slice(0, 36),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    const ok = await copyToClipboard(canvasRef.current);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToHistory = () => {
    const title = qrType === 'url' ? urlValue : qrType === 'wifi' ? `Wi-Fi: ${wifiData.ssid}` : `${qrType.toUpperCase()} QR Code`;
    let storedVal = payload;
    // Privacy safeguard: Never persist Wi-Fi passwords in plaintext to local history
    if (qrType === 'wifi') {
      storedVal = buildWiFiPayload({ ...wifiData, password: '••••••••' });
    }
    onSaveToHistory({
      type: 'qrcode',
      title,
      formatOrType: qrType,
      value: storedVal,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const typeTabs: { id: QRType; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'URL', icon: <Link2 className="w-3.5 h-3.5" /> },
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi className="w-3.5 h-3.5" /> },
    { id: 'vcard', label: 'vCard', icon: <UserSquare2 className="w-3.5 h-3.5" /> },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'deeplink', label: 'App Link', icon: <Link2 className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" /> },
    { id: 'phone', label: 'Phone', icon: <Phone className="w-3.5 h-3.5" /> },
    { id: 'sms', label: 'SMS', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'event', label: 'Event', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'geo', label: 'Map Geo', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'crypto', label: 'Crypto/UPI', icon: <Coins className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Editorial Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              QR Code Studio
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create customizable QR codes for URLs, Wi-Fi networks, contacts, and payments with embedded center logos and vector SVG export.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>High-Density Matrix</span>
            <span aria-hidden="true">·</span>
            <span>Error Correction H (30%)</span>
            <span aria-hidden="true">·</span>
            <span>No Expiry</span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Type Selector Tabs */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
              Select Data Payload Type
            </div>
            <div className="flex flex-wrap gap-1.5">
              {typeTabs.map((tab) => {
                const isActive = qrType === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setQrType(tab.id);
                      setConfig((prev) => ({ ...prev, type: tab.id }));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Payload Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            {qrType === 'url' && (
              <div>
                <label htmlFor={qrUrlInputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Website URL
                </label>
                <div className="relative">
                  <input
                    id={qrUrlInputId}
                    type="url"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="https://example.com/menu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Direct scans to landing pages, social profiles, restaurant menus, or PDF files.
                </p>
              </div>
            )}

            {qrType === 'wifi' && (
              <div className="space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Wi-Fi Network Configuration
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={wifiSsidId} className="block text-xs font-medium text-slate-700 mb-1">
                      Network Name (SSID)
                    </label>
                    <input
                      id={wifiSsidId}
                      type="text"
                      value={wifiData.ssid}
                      onChange={(e) => setWifiData((prev) => ({ ...prev, ssid: e.target.value }))}
                      placeholder="MyHome_5G"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor={wifiPassId} className="block text-xs font-medium text-slate-700 mb-1">
                      Password
                    </label>
                    <input
                      id={wifiPassId}
                      type="text"
                      value={wifiData.password}
                      onChange={(e) => setWifiData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Network Password"
                      disabled={wifiData.encryption === 'nopass'}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <div className="flex items-center gap-2">
                    <label htmlFor={wifiEncId} className="text-xs font-medium text-slate-700">Security:</label>
                    <select
                      id={wifiEncId}
                      value={wifiData.encryption}
                      onChange={(e) => setWifiData((prev) => ({ ...prev, encryption: e.target.value as 'WPA' | 'WEP' | 'nopass' }))}
                      className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                    >
                      <option value="WPA">WPA/WPA2/WPA3 (Standard)</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">No Password (Open)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wifiData.hidden}
                      onChange={(e) => setWifiData((prev) => ({ ...prev, hidden: e.target.checked }))}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    <span className="text-xs text-slate-700">Hidden Network</span>
                  </label>
                </div>
              </div>
            )}

            {qrType === 'vcard' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  vCard Digital Business Card
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={vcardFirstId} className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                    <input
                      id={vcardFirstId}
                      type="text"
                      value={vcardData.firstName}
                      onChange={(e) => setVcardData((prev) => ({ ...prev, firstName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor={vcardLastId} className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                    <input
                      id={vcardLastId}
                      type="text"
                      value={vcardData.lastName}
                      onChange={(e) => setVcardData((prev) => ({ ...prev, lastName: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor={vcardOrgId} className="block text-xs font-medium text-slate-700 mb-1">Company / Org</label>
                    <input
                      id={vcardOrgId}
                      type="text"
                      value={vcardData.organization}
                      onChange={(e) => setVcardData((prev) => ({ ...prev, organization: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor={vcardPhoneId} className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      id={vcardPhoneId}
                      type="tel"
                      value={vcardData.phone}
                      onChange={(e) => setVcardData((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor={vcardEmailId} className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                    <input
                      id={vcardEmailId}
                      type="email"
                      value={vcardData.email}
                      onChange={(e) => setVcardData((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor={vcardUrlId} className="block text-xs font-medium text-slate-700 mb-1">Website URL</label>
                    <input
                      id={vcardUrlId}
                      type="url"
                      value={vcardData.url}
                      onChange={(e) => setVcardData((prev) => ({ ...prev, url: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {qrType === 'whatsapp' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  WhatsApp Direct Chat Link
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone Number (with Country Code)
                  </label>
                  <input
                    type="tel"
                    value={whatsappData.phoneNumber}
                    onChange={(e) => setWhatsappData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Include country code without special characters (e.g. +1 for US/Canada, +44 for UK).
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pre-filled Message
                  </label>
                  <textarea
                    rows={3}
                    value={whatsappData.message}
                    onChange={(e) => setWhatsappData((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Hello! I would like more information..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>
            )}

            {qrType === 'deeplink' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Custom App Deep Link / URI Scheme
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    App URL / Custom Scheme
                  </label>
                  <input
                    type="text"
                    value={deepLinkData.schemeOrUrl}
                    onChange={(e) => setDeepLinkData((prev) => ({ ...prev, schemeOrUrl: e.target.value }))}
                    placeholder="slack://channel?team=T123&id=C456"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports native app schemes (e.g. slack://, spotify:, zoommtg://, or custom iOS/Android universal links).
                  </p>
                </div>
              </div>
            )}

            {qrType === 'text' && (
              <div>
                <label htmlFor={textInputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Plain Text Content
                </label>
                <textarea
                  id={textInputId}
                  rows={4}
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  placeholder="Enter any text, instructions, or keys..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            )}

            {qrType === 'email' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Email Message
                </div>
                <div>
                  <label htmlFor={emailToId} className="block text-xs font-medium text-slate-700 mb-1">Recipient Email</label>
                  <input
                    id={emailToId}
                    type="email"
                    value={emailData.to}
                    onChange={(e) => setEmailData((prev) => ({ ...prev, to: e.target.value }))}
                    placeholder="contact@company.org"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor={emailSubId} className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    id={emailSubId}
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData((prev) => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor={emailBodyId} className="block text-xs font-medium text-slate-700 mb-1">Message Body</label>
                  <textarea
                    id={emailBodyId}
                    rows={3}
                    value={emailData.body}
                    onChange={(e) => setEmailData((prev) => ({ ...prev, body: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {qrType === 'phone' && (
              <div>
                <label htmlFor={phoneInputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phone Number to Dial
                </label>
                <input
                  id={phoneInputId}
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            )}

            {qrType === 'sms' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  SMS Text Message
                </div>
                <div>
                  <label htmlFor={smsNumberId} className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    id={smsNumberId}
                    type="tel"
                    value={smsData.number}
                    onChange={(e) => setSmsData((prev) => ({ ...prev, number: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor={smsMsgId} className="block text-xs font-medium text-slate-700 mb-1">Preset Message</label>
                  <textarea
                    id={smsMsgId}
                    rows={3}
                    value={smsData.message}
                    onChange={(e) => setSmsData((prev) => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {qrType === 'geo' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Geographic Location (Map Pins)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={geoLatId} className="block text-xs font-medium text-slate-700 mb-1">Latitude</label>
                    <input
                      id={geoLatId}
                      type="text"
                      value={geoData.lat}
                      onChange={(e) => setGeoData((prev) => ({ ...prev, lat: e.target.value }))}
                      placeholder="37.7749"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor={geoLngId} className="block text-xs font-medium text-slate-700 mb-1">Longitude</label>
                    <input
                      id={geoLngId}
                      type="text"
                      value={geoData.lng}
                      onChange={(e) => setGeoData((prev) => ({ ...prev, lng: e.target.value }))}
                      placeholder="-122.4194"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {qrType === 'event' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Calendar Event (iCalendar / vEvent)
                </div>
                <div>
                  <label htmlFor={eventTitleId} className="block text-xs font-medium text-slate-700 mb-1">Event Title</label>
                  <input
                    id={eventTitleId}
                    type="text"
                    value={eventData.title}
                    onChange={(e) => setEventData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={eventStartId} className="block text-xs font-medium text-slate-700 mb-1">Start Time</label>
                    <input
                      id={eventStartId}
                      type="datetime-local"
                      value={eventData.startDate}
                      onChange={(e) => setEventData((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor={eventEndId} className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
                    <input
                      id={eventEndId}
                      type="datetime-local"
                      value={eventData.endDate}
                      onChange={(e) => setEventData((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={eventLocId} className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                  <input
                    id={eventLocId}
                    type="text"
                    value={eventData.location}
                    onChange={(e) => setEventData((prev) => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {qrType === 'crypto' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Crypto / UPI Payment Request
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={cryptoCurrId} className="block text-xs font-medium text-slate-700 mb-1">Currency / Protocol</label>
                    <select
                      id={cryptoCurrId}
                      value={cryptoData.currency}
                      onChange={(e) => setCryptoData((prev) => ({ ...prev, currency: e.target.value as 'bitcoin' | 'ethereum' | 'solana' | 'upi' }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900"
                    >
                      <option value="bitcoin">Bitcoin (BTC)</option>
                      <option value="ethereum">Ethereum (ETH)</option>
                      <option value="solana">Solana (SOL)</option>
                      <option value="upi">UPI (India / BHIM / GPay)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={cryptoAddrId} className="block text-xs font-medium text-slate-700 mb-1">
                      {cryptoData.currency === 'upi' ? 'UPI VPA Address (name@bank)' : 'Wallet Address'}
                    </label>
                    <input
                      id={cryptoAddrId}
                      type="text"
                      value={cryptoData.address}
                      onChange={(e) => setCryptoData((prev) => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor={cryptoAmntId} className="block text-xs font-medium text-slate-700 mb-1">Requested Amount (Optional)</label>
                  <input
                    id={cryptoAmntId}
                    type="text"
                    value={cryptoData.amount || ''}
                    onChange={(e) => setCryptoData((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 0.05 or 500"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Customization Options: Style & Logo & Frame */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'content'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 -mb-px'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Colors & Precision
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'style'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 -mb-px'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Center Logo / Brand Icon
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('frame')}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === 'frame'
                    ? 'bg-white text-slate-900 border-t border-x border-slate-200 -mb-px'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Banner Frame & CTA
              </button>
            </div>

            <div className="p-5">
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Foreground / QR Dark Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.fgColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, fgColor: e.target.value }))}
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.fgColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, fgColor: e.target.value }))}
                          className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, fgColor: '#0f172a' }))}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                        >
                          Reset Black
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Background Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.bgColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, bgColor: e.target.value, isTransparentBg: false }))}
                          className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={config.bgColor}
                          onChange={(e) => setConfig((prev) => ({ ...prev, bgColor: e.target.value }))}
                          className="w-24 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                        />
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer ml-1">
                          <input
                            type="checkbox"
                            checked={config.isTransparentBg}
                            onChange={(e) => setConfig((prev) => ({ ...prev, isTransparentBg: e.target.checked }))}
                            className="rounded border-slate-300 text-slate-900"
                          />
                          <span>Transparent</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label htmlFor={errorCorrId} className="block text-xs font-medium text-slate-700 mb-1">
                        Error Correction Level
                      </label>
                      <select
                        id={errorCorrId}
                        value={config.errorCorrectionLevel}
                        onChange={(e) => setConfig((prev) => ({ ...prev, errorCorrectionLevel: e.target.value as QRErrorCorrection }))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                      >
                        <option value="L">L — 7% Recovery</option>
                        <option value="M">M — 15% Recovery</option>
                        <option value="Q">Q — 25% Recovery</option>
                        <option value="H">H — 30% (Best for Logos)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                        <label htmlFor={qrSizeId}>Matrix Size</label>
                        <span className="font-mono text-slate-500">{config.size}px</span>
                      </div>
                      <input
                        id={qrSizeId}
                        type="range"
                        min={180}
                        max={480}
                        step={20}
                        value={config.size}
                        onChange={(e) => setConfig((prev) => ({ ...prev, size: Number(e.target.value) }))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                        <label htmlFor={qrMarginId}>Quiet Zone (Margin)</label>
                        <span className="font-mono text-slate-500">{config.margin} blocks</span>
                      </div>
                      <input
                        id={qrMarginId}
                        type="range"
                        min={0}
                        max={4}
                        step={1}
                        value={config.margin}
                        onChange={(e) => setConfig((prev) => ({ ...prev, margin: Number(e.target.value) }))}
                        className="w-full accent-slate-900 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Module Dot Style Selection */}
                  <div className="pt-3 border-t border-slate-100">
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      Module Dot / Pattern Style
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'square' as const, label: 'Classic Square', desc: 'Crisp industrial' },
                        { id: 'rounded' as const, label: 'Smooth Rounded', desc: 'Softened corners' },
                        { id: 'dots' as const, label: 'Circular Dots', desc: 'Modern dot matrix' },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, dotStyle: style.id }))}
                          className={`p-2.5 text-left rounded-lg border transition-all cursor-pointer ${
                            config.dotStyle === style.id
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{style.label}</div>
                          <div className={`text-[10px] mt-0.5 truncate ${config.dotStyle === style.id ? 'text-slate-300' : 'text-slate-500'}`}>
                            {style.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'style' && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-slate-700 mb-2">
                    Pick a Center Icon Preset or Upload Custom Logo:
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, logoPreset: undefined, customLogoUrl: undefined }))}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                        !config.logoPreset && !config.customLogoUrl
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      No Icon
                    </button>

                    {['link', 'wifi', 'contact', 'github', 'star'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, logoPreset: preset, customLogoUrl: undefined, errorCorrectionLevel: 'H' }))}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                          config.logoPreset === preset
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="capitalize">{preset}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleCustomLogoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Custom Brand Logo (PNG / SVG)</span>
                    </button>

                    {config.customLogoUrl && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <Check className="w-4 h-4" />
                        <span>Custom logo active</span>
                        <button
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, customLogoUrl: undefined }))}
                          className="p-1 hover:text-red-600 transition-colors cursor-pointer"
                          title="Remove custom logo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'frame' && (
                <div className="space-y-4">
                  <div className="text-xs font-medium text-slate-700 mb-2">
                    Frame Style Wrapper:
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'none' as const, label: 'Raw QR (No Frame)' },
                      { id: 'scan-me' as const, label: 'Scan Me Banner' },
                      { id: 'polaroid' as const, label: 'Polaroid Card' },
                      { id: 'badge' as const, label: 'Minimal Badge' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, frameStyle: f.id }))}
                        className={`px-3 py-2 text-xs rounded-lg border text-left font-medium transition-colors cursor-pointer ${
                          config.frameStyle === f.id
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {config.frameStyle !== 'none' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label htmlFor={frameTextId} className="block text-xs font-medium text-slate-700 mb-1">
                          Primary Frame Header Text
                        </label>
                        <input
                          id={frameTextId}
                          type="text"
                          value={config.frameLabel}
                          onChange={(e) => setConfig((prev) => ({ ...prev, frameLabel: e.target.value }))}
                          placeholder="SCAN ME"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label htmlFor={frameSubtextId} className="block text-xs font-medium text-slate-700 mb-1">
                          Secondary Subtitle / Instructions
                        </label>
                        <input
                          id={frameSubtextId}
                          type="text"
                          value={config.frameSubtext || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, frameSubtext: e.target.value }))}
                          placeholder="Use your smartphone camera"
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview & Multi-Format Export Options (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Preview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-4 pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Live QR Code Render
              </span>
              <span className="font-mono text-[11px]">
                Level {config.errorCorrectionLevel} · {config.size}px
              </span>
            </div>

            {/* Scannability Safety Warning Banner */}
            {!scannability.isOptimal && (
              <div className="w-full mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Scannability Warning ({scannability.contrastRatio}:1 Contrast)</span>
                </div>
                {scannability.warnings.map((w, idx) => (
                  <p key={idx} className="text-[11px] leading-relaxed text-amber-800 pl-5">
                    · {w}
                  </p>
                ))}
              </div>
            )}

            {/* Frame Wrapped Container */}
            <div className={`flex flex-col items-center transition-all animate-studio-fade-in ${
              config.frameStyle === 'polaroid' 
                ? 'bg-white p-5 rounded-xl shadow-sm border border-slate-200' 
                : config.frameStyle === 'scan-me'
                ? 'bg-slate-900 text-white p-4 rounded-2xl shadow-sm'
                : config.frameStyle === 'badge'
                ? 'bg-slate-50 p-4 rounded-xl border border-slate-200'
                : ''
            }`}>
              {/* Header on Frame */}
              {config.frameStyle === 'polaroid' && config.frameLabel && (
                <div className="text-center font-bold text-slate-900 text-sm mb-3">
                  {config.frameLabel}
                </div>
              )}

              {/* Canvas QR Element */}
              <div className="rounded-lg overflow-hidden flex items-center justify-center bg-white p-2">
                <canvas ref={canvasRef} className="max-w-full h-auto block" />
              </div>

              {/* Bottom Frame Elements */}
              {config.frameStyle === 'scan-me' && (
                <div className="mt-3 text-center">
                  <div className="text-xs font-bold tracking-widest uppercase">
                    {config.frameLabel || 'SCAN ME'}
                  </div>
                  {config.frameSubtext && (
                    <div className="text-[10px] text-slate-300 mt-0.5">
                      {config.frameSubtext}
                    </div>
                  )}
                </div>
              )}

              {config.frameStyle === 'polaroid' && config.frameSubtext && (
                <div className="mt-2 text-center text-xs text-slate-500">
                  {config.frameSubtext}
                </div>
              )}

              {config.frameStyle === 'badge' && config.frameLabel && (
                <div className="mt-2 text-center text-xs font-semibold text-slate-700">
                  {config.frameLabel}
                </div>
              )}
            </div>

            {/* Scale Selector for Raster exports */}
            <div className="w-full flex items-center justify-between mt-6 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-medium">Export Resolution:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setExportScale(1)}
                  className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    exportScale === 1 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  1x (Web)
                </button>
                <button
                  type="button"
                  onClick={() => setExportScale(2)}
                  className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    exportScale === 2 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  2x (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setExportScale(4)}
                  className={`px-2 py-0.5 rounded text-xs font-mono cursor-pointer ${
                    exportScale === 4 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  4x (300 DPI Print)
                </button>
              </div>
            </div>
          </div>

          {/* Export Action Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Export & Download Options
            </h2>

            {/* Custom Filename Field */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Custom Export Filename (Optional)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  placeholder={getEffectiveFilename()}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none"
                />
                <span className="text-xs text-slate-400 font-mono">.[ext]</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadSvg}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <FileCode2 className="w-4 h-4" />
                <span>Vector SVG</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadRaster('png')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <ImageIcon className="w-4 h-4" />
                <span>PNG ({exportScale * 150} DPI)</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs col-span-2 sm:col-span-1"
              >
                <Printer className="w-4 h-4" />
                <span>Print PDF</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadRaster('jpeg')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JPEG File</span>
              </button>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleDownloadRaster('webp')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer col-span-1 sm:col-span-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>WebP File</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Copy PNG to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Print single QR"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToHistory}
                className="flex items-center justify-center gap-1.5 px-2.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Save to favorites"
              >
                <Bookmark className={`w-3.5 h-3.5 ${savedSuccess ? 'text-emerald-600 fill-emerald-600' : ''}`} />
                <span>{savedSuccess ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            {/* Send to Multi-Label Sheet button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() =>
                  onSendToLabelSheet({
                    value: payload,
                    label: qrType === 'url' ? urlValue : qrType === 'wifi' ? `Wi-Fi: ${wifiData.ssid}` : 'QR Code',
                    price: undefined,
                    isQr: true,
                  })
                }
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Print as Label Sheet (QR Stickers)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
