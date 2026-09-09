import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrGenerator() {
  const [text, setText] = useState('https://example.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text.trim()) {
      return;
    }
    QRCode.toCanvas(canvasRef.current, text, {
      width: 300,
      margin: 2,
      color: {
        dark: fgColor,
        light: bgColor
      }
    }, (error: Error | null | undefined) => {
      if (error) console.error(error);
    });
  }, [text, fgColor, bgColor]);

  const downloadQr = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `qrcode.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="tool-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-qrcode mr-2" style={{ color: '#06b6d4' }}></i>
          QR Code Generator
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Generate customizable QR codes from text or URLs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Text or URL
            </label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter text or URL..."
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Foreground Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  className="input-field flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Background Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer border"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="input-field flex-1"
                />
              </div>
            </div>
          </div>

          <button onClick={downloadQr} disabled={!text.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <i className="fas fa-download"></i> Download PNG
          </button>
        </div>

        {/* QR Preview */}
        <div className="flex items-center justify-center">
          <div
            className="p-6 rounded-xl"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
          >
            {text.trim() ? (
              <canvas ref={canvasRef} className="rounded-lg" />
            ) : (
              <div className="w-[300px] h-[300px] flex items-center justify-center rounded-lg" style={{ background: bgColor }}>
                <p style={{ color: fgColor, opacity: 0.5 }}>Enter text to generate QR</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
