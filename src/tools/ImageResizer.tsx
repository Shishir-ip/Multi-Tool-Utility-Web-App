import { useState, useRef, useCallback, useEffect } from 'react';

export default function ImageResizer() {
  const [image, setImage] = useState<{ file: File; url: string; width: number; height: number } | null>(null);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [lockRatio, setLockRatio] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('png');
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage({ file, url, width: img.width, height: img.height });
      setTargetWidth(img.width);
      setTargetHeight(img.height);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = targetWidth || 1;
    canvas.height = targetHeight || 1;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = image.url;
  }, [image, targetWidth, targetHeight]);

  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (lockRatio && image) {
      const ratio = image.height / image.width;
      setTargetHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (lockRatio && image) {
      const ratio = image.width / image.height;
      setTargetWidth(Math.round(val * ratio));
    }
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `resized-${targetWidth}x${targetHeight}.${outputFormat}`;
    link.href = canvasRef.current.toDataURL(`image/${outputFormat}`, 0.92);
    link.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const originalSize = image ? (image.file.size / 1024).toFixed(1) : '0';
  const targetSize = canvasRef.current ? ((canvasRef.current.toDataURL(outputFormat === 'png' ? 'image/png' : 'image/jpeg', 0.92).length * 0.75) / 1024).toFixed(1) : '0';

  return (
    <div className="tool-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-expand mr-2" style={{ color: 'var(--accent)' }}></i>
          Image Resizer
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Resize images with precision and aspect ratio control</p>
      </div>

      {!image ? (
        <div
          className={`drop-zone ${dragActive ? 'active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <i className="fas fa-image text-4xl mb-3" style={{ color: 'var(--accent)' }}></i>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Drop an image here or click to upload</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Supports JPG, PNG, WEBP, GIF</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>ORIGINAL</h3>
              <p style={{ color: 'var(--text-primary)' }}>{image.width} × {image.height} px</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{originalSize} KB</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <h3 className="font-semibold mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>TARGET</h3>
              <p style={{ color: 'var(--text-primary)' }}>{targetWidth} × {targetHeight} px</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>~{targetSize} KB</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Width (px)</label>
              <input type="number" value={targetWidth} onChange={e => handleWidthChange(Number(e.target.value))} className="input-field w-32" />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <button onClick={() => setLockRatio(!lockRatio)} className="p-2 rounded-lg" style={{ background: lockRatio ? 'var(--accent)' : 'var(--bg-tertiary)', color: 'white' }}>
                <i className={`fas ${lockRatio ? 'fa-lock' : 'fa-lock-open'}`}></i>
              </button>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Lock Ratio</span>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Height (px)</label>
              <input type="number" value={targetHeight} onChange={e => handleHeightChange(Number(e.target.value))} className="input-field w-32" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Format</label>
              <select value={outputFormat} onChange={e => setOutputFormat(e.target.value as 'png' | 'jpeg')} className="input-field w-28">
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Original</p>
              <img src={image.url} alt="Original" className="max-w-full max-h-64 rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Preview</p>
              <canvas ref={canvasRef} className="max-w-full max-h-64 rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={downloadImage} className="btn-primary flex items-center gap-2">
              <i className="fas fa-download"></i> Download Resized Image
            </button>
            <button onClick={() => { setImage(null); URL.revokeObjectURL(image.url); }} className="btn-secondary">
              <i className="fas fa-redo mr-1"></i> New Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
