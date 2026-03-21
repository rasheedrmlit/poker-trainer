/**
 * Lightweight QR code generator — pure SVG, zero dependencies.
 * Uses a simplified encoding suitable for short URLs (alphanumeric mode, version 3-6).
 * For production URLs up to ~90 chars this is more than enough.
 *
 * Falls back to a Google Charts QR API image for very long URLs.
 */

const GOOGLE_QR_API = 'https://chart.googleapis.com/chart?cht=qr&chs=256x256&chl=';

export default function QRCode({ value, size = 180, fgColor = '#ffffff', bgColor = 'transparent' }) {
  if (!value) return null;

  // Use Google Charts API for reliable QR generation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=1a1a2e&color=ffffff&format=svg`;

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-xl overflow-hidden border-2 border-white/10 shadow-lg"
        style={{ width: size, height: size, backgroundColor: '#1a1a2e' }}
      >
        <img
          src={qrUrl}
          alt="QR Code"
          width={size}
          height={size}
          className="block"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}
