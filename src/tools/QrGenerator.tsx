import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrGenerator() {
  const [text, setText] = useState('https://example.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text.trim()) return;
    QRCode.toCanvas(canvasRef.current, text, {
      width: 280,
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
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-qrcode mr-2" style={{ color: '#06b6d4' }}></i>
          QR Code Generator
        </h2>
        <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>Generate customizable QR codes from text or URLs</p>
      </div>

      {/* Layout — stacks on mobile, 2-col on lg */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Controls */}
        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="text-xs sm:text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Text or URL
            </label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Enter text or URL..."
              className="input-field text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Foreground Color
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-10 rounded cursor-pointer border flex-shrink-0"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  className="input-field flex-1 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Background Color
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-10 h-10 sm:w-12 sm:h-10 rounded cursor-pointer border flex-shrink-0"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="input-field flex-1 text-sm"
                />
              </div>
            </div>
          </div>

          <button onClick={downloadQr} disabled={!text.trim()} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50">
            <i className="fas fa-download"></i> Download PNG
          </button>
        </div>

        {/* QR Preview */}
        <div className="flex items-center justify-center">
          <div
            className="p-4 sm:p-6 rounded-xl w-full flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
          >
            {text.trim() ? (
              <canvas ref={canvasRef} className="rounded-lg max-w-full" style={{ maxWidth: '280px' }} />
            ) : (
              <div className="w-[280px] h-[280px] max-w-full flex items-center justify-center rounded-lg" style={{ background: bgColor }}>
                <p className="text-sm text-center px-4" style={{ color: fgColor, opacity: 0.5 }}>Enter text to generate QR</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
