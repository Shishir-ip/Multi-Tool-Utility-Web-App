import React, { useState, useRef, useEffect } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

// ── Meme Generator ──
export const MemeGenerator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [topText, setTopText] = useState('TOP TEXT');
  const [bottomText, setBottomText] = useState('BOTTOM TEXT');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [uppercase, setUppercase] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = textColor;

      const drawText = (text: string, y: number) => {
        const displayText = uppercase ? text.toUpperCase() : text;
        const words = displayText.split(' ');
        let lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > canvas.width * 0.9 && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        });
        if (currentLine) lines.push(currentLine);

        lines.forEach((line, i) => {
          const lineY = y + i * fontSize * 1.2;
          ctx.strokeText(line, canvas.width / 2, lineY);
          ctx.fillText(line, canvas.width / 2, lineY);
        });
      };

      drawText(topText, fontSize + 20);
      drawText(bottomText, canvas.height - fontSize - 20);
    };
    img.src = image;
  }, [image, topText, bottomText, fontSize, textColor, strokeColor, strokeWidth, uppercase]);

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = 'meme.png';
    a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-face-laugh" title="Meme Generator" description="Create memes with custom text" color="#8b5cf6" />
      {!image ? (
        <DropZone onFiles={handleFile} accept="image/*" icon="fa-image" title="Upload an image" subtitle="Start with any image" />
      ) : (
        <div className="space-y-4">
          <canvas ref={canvasRef} className="max-w-full rounded-lg border mx-auto" style={{ borderColor: 'var(--border-color)' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Top Text</label>
              <input value={topText} onChange={e => setTopText(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Bottom Text</label>
              <input value={bottomText} onChange={e => setBottomText(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Font Size: {fontSize}px</label>
              <input type="range" min="20" max="100" value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Text Color</label>
              <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border" style={{ borderColor: 'var(--border-color)' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Stroke Color</label>
              <input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border" style={{ borderColor: 'var(--border-color)' }} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Stroke: {strokeWidth}px</label>
              <input type="range" min="0" max="10" value={strokeWidth} onChange={e => setStrokeWidth(+e.target.value)} className="w-full" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} />
            UPPERCASE
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={download} icon="fa-download">Download Meme</Button>
            <Button variant="secondary" onClick={() => setImage(null)} icon="fa-redo">New Image</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Batch Photo Watermarker ──
export const BatchWatermarker: React.FC = () => {
  const [images, setImages] = useState<{ name: string; url: string; processed?: string }[]>([]);
  const [type, setType] = useState<'text' | 'logo'>('text');
  const [text, setText] = useState('© Watermark');
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState('center');
  const [logo, setLogo] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFiles = (fl: FileList) => {
    const newImages = Array.from(fl).filter(f => f.type.startsWith('image/')).slice(0, 20).map(f => ({
      name: f.name,
      url: URL.createObjectURL(f)
    }));
    setImages(newImages);
  };

  const handleLogo = (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = e => setLogo(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const processImages = async () => {
    setProcessing(true);
    const processed = await Promise.all(images.map(async img => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const image = new Image();
      await new Promise(resolve => { image.onload = resolve; image.src = img.url; });
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0);

      ctx.globalAlpha = opacity;
      if (type === 'text') {
        ctx.font = `bold ${Math.max(20, canvas.width / 20)}px Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        const metrics = ctx.measureText(text);
        let x = canvas.width / 2, y = canvas.height / 2;
        if (position === 'top-left') { x = metrics.width / 2 + 20; y = 50; }
        else if (position === 'top-right') { x = canvas.width - metrics.width / 2 - 20; y = 50; }
        else if (position === 'bottom-left') { x = metrics.width / 2 + 20; y = canvas.height - 30; }
        else if (position === 'bottom-right') { x = canvas.width - metrics.width / 2 - 20; y = canvas.height - 30; }
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      } else if (logo) {
        const logoImg = new Image();
        await new Promise(resolve => { logoImg.onload = resolve; logoImg.src = logo; });
        const scale = Math.min(canvas.width, canvas.height) / 5;
        const lw = logoImg.width * (scale / logoImg.height);
        let x = (canvas.width - lw) / 2, y = (canvas.height - scale) / 2;
        if (position === 'top-left') { x = 20; y = 20; }
        else if (position === 'top-right') { x = canvas.width - lw - 20; y = 20; }
        else if (position === 'bottom-left') { x = 20; y = canvas.height - scale - 20; }
        else if (position === 'bottom-right') { x = canvas.width - lw - 20; y = canvas.height - scale - 20; }
        ctx.drawImage(logoImg, x, y, lw, scale);
      }
      ctx.globalAlpha = 1;
      return { ...img, processed: canvas.toDataURL('image/png') };
    }));
    setImages(processed);
    setProcessing(false);
  };

  const downloadAll = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    images.forEach(img => {
      if (img.processed) {
        const base64 = img.processed.split(',')[1];
        zip.file(img.name, base64, { base64: true });
      }
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'watermarked-images.zip';
    a.click();
  };

  const removeImage = (i: number) => setImages(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-stamp" title="Batch Photo Watermarker" description="Add watermarks to multiple images" color="#8b5cf6" />
      <DropZone onFiles={handleFiles} accept="image/*" multiple icon="fa-images" title="Upload images" subtitle="Up to 20 images" />
      {images.length > 0 && (
        <div className="space-y-4 mt-4">
          <div className="flex gap-2">
            <button onClick={() => setType('text')} className="px-4 py-2 rounded-lg text-sm" style={{ background: type === 'text' ? 'var(--accent)' : 'var(--bg-tertiary)', color: type === 'text' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Text</button>
            <button onClick={() => setType('logo')} className="px-4 py-2 rounded-lg text-sm" style={{ background: type === 'logo' ? 'var(--accent)' : 'var(--bg-tertiary)', color: type === 'logo' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Logo</button>
          </div>
          {type === 'text' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Watermark Text</label><input value={text} onChange={e => setText(e.target.value)} className="input-field" /></div>
              <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Opacity: {Math.round(opacity * 100)}%</label><input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(+e.target.value)} className="w-full" /></div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Logo Image</label>
              <DropZone onFiles={handleLogo} accept="image/*" icon="fa-image" title="Upload logo" subtitle="PNG with transparency" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>Position</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map(p => (
                <button key={p} onClick={() => setPosition(p)} className="px-3 py-2 rounded-lg text-xs capitalize" style={{ background: position === p ? 'var(--accent)' : 'var(--bg-tertiary)', color: position === p ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{p.replace('-', ' ')}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-64 overflow-auto">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.processed || img.url} alt={img.name} className="w-full h-24 object-cover rounded border" style={{ borderColor: 'var(--border-color)' }} />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs"><i className="fas fa-times"></i></button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={processImages} icon={processing ? 'fa-spinner fa-spin' : 'fa-stamp'} disabled={processing}>{processing ? 'Processing...' : 'Apply Watermark'}</Button>
            {images.some(i => i.processed) && <Button onClick={downloadAll} icon="fa-download" variant="secondary">Download All as ZIP</Button>}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Target File Size Compressor ──
export const TargetCompressor: React.FC = () => {
  const [image, setImage] = useState<{ url: string; size: number } | null>(null);
  const [targetSize, setTargetSize] = useState(100);
  const [result, setResult] = useState<{ url: string; size: number; quality: number } | null>(null);
  const [compressing, setCompressing] = useState(false);

  const handleFile = (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    setImage({ url: URL.createObjectURL(f), size: f.size });
    setResult(null);
  };

  const compress = async () => {
    if (!image) return;
    setCompressing(true);
    const img = new Image();
    await new Promise(resolve => { img.onload = resolve; img.src = image.url; });

    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    let low = 0.01, high = 0.95, bestQuality = 0.5, bestData = '';
    while (low <= high) {
      const mid = (low + high) / 2;
      const dataUrl = canvas.toDataURL('image/jpeg', mid);
      const size = (dataUrl.length * 0.75) / 1024;
      if (size <= targetSize) {
        bestQuality = mid;
        bestData = dataUrl;
        low = mid + 0.01;
      } else {
        high = mid - 0.01;
      }
    }

    if (!bestData) {
      canvas = document.createElement('canvas');
      ctx = canvas.getContext('2d')!;
      const scale = Math.sqrt(targetSize / (image.size / 1024));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      bestData = canvas.toDataURL('image/jpeg', 0.5);
    }

    const size = (bestData.length * 0.75) / 1024;
    setResult({ url: bestData, size, quality: bestQuality });
    setCompressing(false);
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = 'compressed.jpg';
    a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-bullseye" title="Target File Size Compressor" description="Compress images to target file size" color="#8b5cf6" />
      {!image ? (
        <DropZone onFiles={handleFile} accept="image/*" icon="fa-image" title="Upload an image" />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Original Size: <strong>{(image.size / 1024).toFixed(1)} KB</strong></p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Target Size (KB)</label>
            <input type="number" value={targetSize} onChange={e => setTargetSize(+e.target.value)} className="input-field" />
          </div>
          {result && (
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Compressed: <strong>{result.size.toFixed(1)} KB</strong> (Quality: {Math.round(result.quality * 100)}%)
                {result.size <= targetSize && <span className="ml-2 text-green-500">✓ Target Met</span>}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={compress} icon={compressing ? 'fa-spinner fa-spin' : 'fa-compress'} disabled={compressing}>{compressing ? 'Compressing...' : 'Compress'}</Button>
            {result && <Button onClick={download} icon="fa-download" variant="secondary">Download</Button>}
            <Button variant="secondary" onClick={() => { setImage(null); setResult(null); }} icon="fa-redo">New Image</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Image Anonymizer ──
export const ImageAnonymizer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'blur' | 'pixelate'>('blur');
  const [shape, setShape] = useState<'rect' | 'ellipse'>('rect');
  const [radius, setRadius] = useState(20);
  const [masks, setMasks] = useState<{ x: number; y: number; w: number; h: number }[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    setImage(URL.createObjectURL(f));
    setMasks([]);
  };

  useEffect(() => {
    if (!image || !canvasRef.current || !overlayRef.current) return;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const ctx = canvas.getContext('2d')!;
    const octx = overlay.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      overlay.width = img.width;
      overlay.height = img.height;
      ctx.drawImage(img, 0, 0);
      octx.clearRect(0, 0, overlay.width, overlay.height);
      masks.forEach(mask => {
        octx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        if (shape === 'ellipse') {
          octx.beginPath();
          octx.ellipse(mask.x + mask.w / 2, mask.y + mask.h / 2, mask.w / 2, mask.h / 2, 0, 0, Math.PI * 2);
          octx.fill();
        } else {
          octx.fillRect(mask.x, mask.y, mask.w, mask.h);
        }
      });
    };
    img.src = image;
  }, [image, masks, shape]);

  const getPos = (e: React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    const scaleX = overlayRef.current!.width / rect.width;
    const scaleY = overlayRef.current!.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDrawing(true);
    setStart(getPos(e));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!drawing) return;
    const end = getPos(e);
    const mask = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(end.x - start.x), h: Math.abs(end.y - start.y) };
    if (mask.w > 5 && mask.h > 5) setMasks(prev => [...prev, mask]);
    setDrawing(false);
  };

  const applyMasks = () => {
    if (!canvasRef.current || !image) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      masks.forEach(mask => {
        const imageData = ctx.getImageData(mask.x, mask.y, mask.w, mask.h);
        if (mode === 'blur') {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = mask.w / radius;
          tempCanvas.height = mask.h / radius;
          const tctx = tempCanvas.getContext('2d')!;
          tctx.drawImage(canvas, mask.x, mask.y, mask.w, mask.h, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, mask.x, mask.y, mask.w, mask.h);
          ctx.imageSmoothingEnabled = true;
        } else {
          const pixelSize = radius;
          for (let y = 0; y < mask.h; y += pixelSize) {
            for (let x = 0; x < mask.w; x += pixelSize) {
              const i = (y * mask.w + x) * 4;
              const r = imageData.data[i], g = imageData.data[i + 1], b = imageData.data[i + 2];
              ctx.fillStyle = `rgb(${r},${g},${b})`;
              ctx.fillRect(mask.x + x, mask.y + y, pixelSize, pixelSize);
            }
          }
        }
      });
    };
    img.src = image;
  };

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = 'anonymized.png';
    a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-user-secret" title="Image Anonymizer" description="Blur or pixelate sensitive areas" color="#8b5cf6" />
      {!image ? (
        <DropZone onFiles={handleFile} accept="image/*" icon="fa-image" title="Upload an image" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1">
              <button onClick={() => setMode('blur')} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm" style={{ background: mode === 'blur' ? 'var(--accent)' : 'var(--bg-tertiary)', color: mode === 'blur' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Blur</button>
              <button onClick={() => setMode('pixelate')} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm" style={{ background: mode === 'pixelate' ? 'var(--accent)' : 'var(--bg-tertiary)', color: mode === 'pixelate' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Pixelate</button>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShape('rect')} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm" style={{ background: shape === 'rect' ? 'var(--accent)' : 'var(--bg-tertiary)', color: shape === 'rect' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Rectangle</button>
              <button onClick={() => setShape('ellipse')} className="px-3 py-1.5 rounded-lg text-xs sm:text-sm" style={{ background: shape === 'ellipse' ? 'var(--accent)' : 'var(--bg-tertiary)', color: shape === 'ellipse' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Ellipse</button>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Strength: {radius}</label>
              <input type="range" min="5" max="50" value={radius} onChange={e => setRadius(+e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="relative inline-block border rounded-lg overflow-hidden cursor-crosshair" style={{ borderColor: 'var(--border-color)' }}>
            <canvas ref={canvasRef} className="max-w-full" />
            <canvas ref={overlayRef} className="absolute inset-0" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={applyMasks} icon="fa-check">Apply Masks</Button>
            <Button onClick={() => setMasks([])} icon="fa-undo" variant="secondary">Undo Last</Button>
            <Button onClick={() => setMasks([])} icon="fa-trash" variant="secondary">Clear All</Button>
            <Button onClick={download} icon="fa-download" variant="secondary">Download</Button>
            <Button onClick={() => setImage(null)} icon="fa-redo" variant="secondary">New Image</Button>
          </div>
        </div>
      )}
    </div>
  );
};
