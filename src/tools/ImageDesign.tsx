import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

// ── Image Converter ──
export const ImageConverter: React.FC = () => {
  const [image, setImage] = useState<{ url: string; name: string } | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);

  const handleFile = (fl: FileList) => {
    const f = fl[0]; if (!f || !f.type.startsWith('image/')) return;
    setImage({ url: URL.createObjectURL(f), name: f.name.replace(/\.[^.]+$/, '') });
  };

  const convert = () => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d')!.drawImage(img, 0, 0);
      const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      const a = document.createElement('a');
      a.href = c.toDataURL(mime, quality / 100);
      a.download = `${image.name}.${format}`;
      a.click();
    };
    img.src = image.url;
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-exchange-alt" title="Image Converter" description="Convert between JPG, PNG, WEBP" color="#8b5cf6" />
      {!image ? (
        <DropZone onFiles={handleFile} accept="image/*" icon="fa-image" title="Upload an image" subtitle="JPG, PNG, WEBP, GIF supported" />
      ) : (
        <div className="space-y-4">
          <img src={image.url} alt="" className="max-w-full max-h-64 rounded-lg border mx-auto" style={{ borderColor: 'var(--border-color)' }} />
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Output Format</label>
              <select value={format} onChange={e => setFormat(e.target.value as any)} className="input-field w-32">
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
            {format !== 'png' && (
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Quality: {quality}%</label>
                <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(+e.target.value)} className="w-full" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={convert} icon="fa-download">Convert & Download</Button>
            <Button variant="secondary" onClick={() => setImage(null)} icon="fa-redo">New Image</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Basic Video Editor (Trim, Crop, Aspect Ratio) ──
export const BasicEditor: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string } | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [aspectRatio, setAspectRatio] = useState('original');
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f || !f.type.startsWith('video/')) return;
    
    const url = URL.createObjectURL(f);
    setVideo({ url, name: f.name.replace(/\.[^.]+$/, '') });
    
    const tempVideo = document.createElement('video');
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      setDuration(tempVideo.duration);
      setStartTime(0);
      setEndTime(tempVideo.duration);
    };
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAspectRatioDimensions = (originalWidth: number, originalHeight: number) => {
    if (aspectRatio === 'original') {
      return { width: originalWidth, height: originalHeight };
    }
    
    const [w, h] = aspectRatio.split(':').map(Number);
    const ratio = w / h;
    
    if (originalWidth / originalHeight > ratio) {
      return { width: originalHeight * ratio, height: originalHeight };
    } else {
      return { width: originalWidth, height: originalWidth / ratio };
    }
  };

  const processVideo = async () => {
    if (!video || !videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    setProgress(0);

    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas dimensions based on aspect ratio
    const { width: canvasWidth, height: canvasHeight } = getAspectRatioDimensions(
      videoEl.videoWidth * (crop.width / 100),
      videoEl.videoHeight * (crop.height / 100)
    );
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Create a MediaRecorder to capture the canvas
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.name}-edited.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsProcessing(false);
      setProgress(100);
    };

    recorder.start();

    // Process video frame by frame
    videoEl.currentTime = startTime;
    videoEl.muted = true;

    const processFrame = () => {
      if (videoEl.currentTime >= endTime) {
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Draw cropped frame
      const sx = videoEl.videoWidth * (crop.x / 100);
      const sy = videoEl.videoHeight * (crop.y / 100);
      const sWidth = videoEl.videoWidth * (crop.width / 100);
      const sHeight = videoEl.videoHeight * (crop.height / 100);

      ctx.drawImage(videoEl, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

      // Update progress
      const progress = ((videoEl.currentTime - startTime) / (endTime - startTime)) * 100;
      setProgress(Math.min(progress, 100));

      requestAnimationFrame(processFrame);
    };

    videoEl.onseeked = () => {
      videoEl.play();
      processFrame();
    };
  };

  const reset = () => {
    setVideo(null);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setAspectRatio('original');
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
    setIsProcessing(false);
    setProgress(0);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-film" title="Basic Editor" description="Video trimmer, cropper, and aspect ratio changer" color="#8b5cf6" />
      
      {!video ? (
        <DropZone onFiles={handleFile} accept="video/*" icon="fa-video" title="Upload a video" subtitle="MP4, WEBM, MOV supported" />
      ) : (
        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={video.url}
              className="w-full max-h-96"
              controls
              onTimeUpdate={(e) => {
                const time = e.currentTarget.currentTime;
                if (time >= endTime) {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = startTime;
                }
              }}
            />
          </div>

          {/* Trim Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <i className="fas fa-cut" style={{ color: '#8b5cf6' }}></i>
              Trim Video
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Start Time: {formatTime(startTime)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStartTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  End Time: {formatTime(endTime)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEndTime(val);
                    if (videoRef.current) videoRef.current.currentTime = val;
                  }}
                  className="w-full"
                />
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Duration: {formatTime(endTime - startTime)}
            </p>
          </div>

          {/* Crop Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <i className="fas fa-crop-alt" style={{ color: '#8b5cf6' }}></i>
              Crop Video
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>X: {crop.x}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crop.x}
                  onChange={(e) => setCrop({ ...crop, x: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Y: {crop.y}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={crop.y}
                  onChange={(e) => setCrop({ ...crop, y: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Width: {crop.width}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={crop.width}
                  onChange={(e) => setCrop({ ...crop, width: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Height: {crop.height}%</label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={crop.height}
                  onChange={(e) => setCrop({ ...crop, height: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <i className="fas fa-expand" style={{ color: '#8b5cf6' }}></i>
              Aspect Ratio
            </h3>
            <div className="flex flex-wrap gap-2">
              {['original', '16:9', '4:3', '1:1', '9:16', '21:9'].map(ratio => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: aspectRatio === ratio ? '#8b5cf6' : 'var(--bg-tertiary)',
                    color: aspectRatio === ratio ? 'white' : 'var(--text-primary)',
                    border: `2px solid ${aspectRatio === ratio ? '#8b5cf6' : 'var(--border-color)'}`
                  }}
                >
                  {ratio === 'original' ? 'Original' : ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Processing video...</span>
                <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: 'var(--accent)' }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={processVideo}
              icon={isProcessing ? 'fa-spinner fa-spin' : 'fa-download'}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Export Video'}
            </Button>
            <Button variant="secondary" onClick={reset} icon="fa-redo">
              Upload New Video
            </Button>
          </div>

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};

// ── Advanced Image Cropper ──
export const ImageCropper: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [shape, setShape] = useState<'rect' | 'circle' | 'freehand'>('rect');
  const [ratio, setRatio] = useState('free');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [freehandPath, setFreehandPath] = useState<{ x: number; y: number }[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleFile = (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const maxW = 600;
      const scale = img.width > maxW ? maxW / img.width : 1;
      setImgDim({ w: img.width * scale, h: img.height * scale });
      setImage(url);
      setCrop({ x: 0, y: 0, w: img.width * scale, h: img.height * scale });
    };
    img.src = url;
  };

  useEffect(() => {
    if (!image || !overlayRef.current) return;
    const c = overlayRef.current;
    const ctx = c.getContext('2d')!;
    c.width = imgDim.w; c.height = imgDim.h;
    ctx.clearRect(0, 0, c.width, c.height);
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, c.width, c.height);
    // Clear crop area
    ctx.globalCompositeOperation = 'destination-out';
    if (shape === 'circle') {
      const cx = crop.x + crop.w / 2, cy = crop.y + crop.h / 2;
      const r = Math.min(crop.w, crop.h) / 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    } else if (shape === 'freehand' && freehandPath.length > 2) {
      ctx.beginPath();
      ctx.moveTo(freehandPath[0].x, freehandPath[0].y);
      freehandPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillRect(crop.x, crop.y, crop.w, crop.h);
    }
    ctx.globalCompositeOperation = 'source-over';
    // Border
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    if (shape === 'circle') {
      const cx = crop.x + crop.w / 2, cy = crop.y + crop.h / 2;
      const r = Math.min(crop.w, crop.h) / 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    } else if (shape === 'freehand' && freehandPath.length > 2) {
      ctx.beginPath();
      ctx.moveTo(freehandPath[0].x, freehandPath[0].y);
      freehandPath.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.stroke();
    } else {
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    }
  }, [image, crop, shape, freehandPath, imgDim]);

  const getPos = (e: React.MouseEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getPos(e);
    if (shape === 'freehand') {
      setDrawing(true);
      setFreehandPath([pos]);
    } else {
      setDragging(true);
      dragStart.current = pos;
      setCrop({ x: pos.x, y: pos.y, w: 0, h: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getPos(e);
    if (shape === 'freehand' && drawing) {
      setFreehandPath(prev => [...prev, pos]);
    } else if (dragging) {
      let w = pos.x - dragStart.current.x;
      let h = pos.y - dragStart.current.y;
      let x = dragStart.current.x, y = dragStart.current.y;
      if (w < 0) { x += w; w = -w; }
      if (h < 0) { y += h; h = -h; }
      if (ratio !== 'free') {
        const [rw, rh] = ratio.split(':').map(Number);
        h = w * (rh / rw);
      }
      setCrop({ x, y, w, h });
    }
  };

  const handleMouseUp = () => { setDragging(false); setDrawing(false); };

  const downloadCropped = () => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      const scale = imgDim.w / img.width;
      const c = document.createElement('canvas');
      if (shape === 'circle') {
        const size = Math.min(crop.w, crop.h) / scale;
        c.width = size; c.height = size;
        const ctx = c.getContext('2d')!;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, -(crop.x + crop.w / 2) / scale + size / 2, -(crop.y + crop.h / 2) / scale + size / 2);
      } else {
        c.width = crop.w / scale; c.height = crop.h / scale;
        c.getContext('2d')!.drawImage(img, crop.x / scale, crop.y / scale, c.width, c.height, 0, 0, c.width, c.height);
      }
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png'); a.download = 'cropped.png'; a.click();
    };
    img.src = image;
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-crop-alt" title="Advanced Image Cropper" description="Freehand, circle, square, ratio cropping" color="#8b5cf6" />
      {!image ? (
        <DropZone onFiles={handleFile} accept="image/*" icon="fa-image" title="Upload an image to crop" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1">
              {(['rect', 'circle', 'freehand'] as const).map(s => (
                <button key={s} onClick={() => { setShape(s); setFreehandPath([]); }}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium"
                  style={{ background: shape === s ? 'var(--accent)' : 'var(--bg-tertiary)', color: shape === s ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                  {s === 'rect' ? '▬ Rectangle' : s === 'circle' ? '● Circle' : '✎ Freehand'}
                </button>
              ))}
            </div>
            {shape === 'rect' && (
              <select value={ratio} onChange={e => setRatio(e.target.value)} className="input-field w-auto">
                <option value="free">Free</option>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
                <option value="3:2">3:2</option>
              </select>
            )}
          </div>
          <div className="relative inline-block border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
            <img src={image} alt="" style={{ width: imgDim.w, height: imgDim.h, display: 'block' }} />
            <canvas ref={overlayRef} className="absolute inset-0 cursor-crosshair"
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadCropped} icon="fa-download">Download Cropped</Button>
            <Button variant="secondary" onClick={() => { setImage(null); setFreehandPath([]); }} icon="fa-redo">New Image</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── EXIF/Metadata Viewer ──
export const ExifViewer: React.FC = () => {
  const [meta, setMeta] = useState<Record<string, string>>({});

  const handleFile = (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    const data: Record<string, string> = {
      'File Name': f.name,
      'File Size': `${(f.size / 1024).toFixed(2)} KB`,
      'MIME Type': f.type,
      'Last Modified': f.lastModified ? new Date(f.lastModified).toLocaleString() : 'N/A',
    };
    const img = new Image();
    img.onload = () => {
      data['Width'] = `${img.width} px`;
      data['Height'] = `${img.height} px`;
      data['Aspect Ratio'] = (img.width / img.height).toFixed(2);
      data['Megapixels'] = ((img.width * img.height) / 1000000).toFixed(2);
      setMeta(data);
    };
    img.src = URL.createObjectURL(f);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-info-circle" title="EXIF/Metadata Viewer" description="View image metadata and properties" color="#8b5cf6" />
      <DropZone onFiles={handleFile} accept="image/*" icon="fa-info-circle" title="Upload an image" subtitle="View file and image metadata" />
      {Object.keys(meta).length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(meta).map(([k, v]) => (
            <div key={k} className="p-3 rounded-lg flex justify-between" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span className="text-sm font-mono" style={{ color: 'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Photo Collage Maker ──
export const CollageMaker: React.FC = () => {
  const [images, setImages] = useState<Array<{ src: string; zoom: number; offsetX: number; offsetY: number }>>([]);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [layout, setLayout] = useState('grid-2x2');
  const [gap, setGap] = useState(8);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [borderRadius, setBorderRadius] = useState(0);
  const [shadow, setShadow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Aspect ratios
  const aspectRatios = [
    { label: '1:1 (Square)', value: '1:1', width: 1, height: 1 },
    { label: '16:9 (Landscape)', value: '16:9', width: 16, height: 9 },
    { label: '9:16 (Portrait)', value: '9:16', width: 9, height: 16 },
    { label: '4:3', value: '4:3', width: 4, height: 3 },
    { label: '3:4', value: '3:4', width: 3, height: 4 },
    { label: '3:2', value: '3:2', width: 3, height: 2 },
    { label: '2:3', value: '2:3', width: 2, height: 3 },
  ];

  // Layout presets
  const layouts = [
    { label: '2×2 Grid', value: 'grid-2x2', cols: 2, rows: 2 },
    { label: '3×3 Grid', value: 'grid-3x3', cols: 3, rows: 3 },
    { label: '2×3 Grid', value: 'grid-2x3', cols: 2, rows: 3 },
    { label: '3×2 Grid', value: 'grid-3x2', cols: 3, rows: 2 },
    { label: '1+2 Split', value: 'split-1-2', cols: 0, rows: 0, custom: true },
    { label: '2+1 Split', value: 'split-2-1', cols: 0, rows: 0, custom: true },
    { label: 'Featured Left', value: 'featured-left', cols: 0, rows: 0, custom: true },
    { label: 'Featured Right', value: 'featured-right', cols: 0, rows: 0, custom: true },
  ];

  const handleFiles = (fl: FileList) => {
    Array.from(fl).filter(f => f.type.startsWith('image/')).forEach(f => {
      const reader = new FileReader();
      reader.onload = e => {
        setImages(prev => [...prev, { 
          src: e.target?.result as string, 
          zoom: 1, 
          offsetX: 0, 
          offsetY: 0 
        }]);
      };
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    if (selectedImage === index) setSelectedImage(null);
  };

  const updateImage = (index: number, updates: Partial<typeof images[0]>) => {
    setImages(images.map((img, i) => i === index ? { ...img, ...updates } : img));
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    setImages(newImages);
  };

  const getCanvasDimensions = () => {
    const ratio = aspectRatios.find(r => r.value === aspectRatio)!;
    const baseSize = 800;
    const width = baseSize;
    const height = (baseSize * ratio.height) / ratio.width;
    return { width, height };
  };

  const drawCollage = useCallback(() => {
    if (!canvasRef.current || images.length === 0) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    const { width, height } = getCanvasDimensions();
    
    c.width = width;
    c.height = height;
    
    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const currentLayout = layouts.find(l => l.value === layout)!;
    const cellPositions: Array<{ x: number; y: number; w: number; h: number }> = [];

    // Calculate cell positions based on layout
    if (currentLayout.custom) {
      // Custom layouts
      if (layout === 'split-1-2') {
        const halfW = (width - gap * 3) / 2;
        const fullH = height - gap * 2;
        cellPositions.push({ x: gap, y: gap, w: halfW, h: fullH });
        const quarterH = (fullH - gap) / 2;
        cellPositions.push({ x: gap * 2 + halfW, y: gap, w: halfW, h: quarterH });
        cellPositions.push({ x: gap * 2 + halfW, y: gap * 2 + quarterH, w: halfW, h: quarterH });
      } else if (layout === 'split-2-1') {
        const halfW = (width - gap * 3) / 2;
        const fullH = height - gap * 2;
        const quarterH = (fullH - gap) / 2;
        cellPositions.push({ x: gap, y: gap, w: halfW, h: quarterH });
        cellPositions.push({ x: gap, y: gap * 2 + quarterH, w: halfW, h: quarterH });
        cellPositions.push({ x: gap * 2 + halfW, y: gap, w: halfW, h: fullH });
      } else if (layout === 'featured-left') {
        const largeW = (width - gap * 3) * 0.6;
        const smallW = width - gap * 3 - largeW;
        const fullH = height - gap * 2;
        cellPositions.push({ x: gap, y: gap, w: largeW, h: fullH });
        const thirdH = (fullH - gap * 2) / 3;
        for (let i = 0; i < 3; i++) {
          cellPositions.push({ 
            x: gap * 2 + largeW, 
            y: gap + i * (thirdH + gap), 
            w: smallW, 
            h: thirdH 
          });
        }
      } else if (layout === 'featured-right') {
        const largeW = (width - gap * 3) * 0.6;
        const smallW = width - gap * 3 - largeW;
        const fullH = height - gap * 2;
        const thirdH = (fullH - gap * 2) / 3;
        for (let i = 0; i < 3; i++) {
          cellPositions.push({ 
            x: gap, 
            y: gap + i * (thirdH + gap), 
            w: smallW, 
            h: thirdH 
          });
        }
        cellPositions.push({ x: gap * 2 + smallW, y: gap, w: largeW, h: fullH });
      }
    } else {
      // Grid layouts
      const cellW = (width - gap * (currentLayout.cols + 1)) / currentLayout.cols;
      const cellH = (height - gap * (currentLayout.rows + 1)) / currentLayout.rows;
      
      for (let i = 0; i < Math.min(images.length, currentLayout.cols * currentLayout.rows); i++) {
        const col = i % currentLayout.cols;
        const row = Math.floor(i / currentLayout.cols);
        cellPositions.push({
          x: gap + col * (cellW + gap),
          y: gap + row * (cellH + gap),
          w: cellW,
          h: cellH
        });
      }
    }

    // Draw images
    let loaded = 0;
    images.slice(0, cellPositions.length).forEach((imgData, i) => {
      const img = new Image();
      img.onload = () => {
        const pos = cellPositions[i];
        
        // Apply shadow if enabled
        if (shadow) {
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
        }

        // Apply border radius
        if (borderRadius > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pos.x, pos.y, pos.w, pos.h, borderRadius);
          ctx.clip();
        }

        // Calculate image dimensions with zoom and offset
        const scale = Math.max(pos.w / img.width, pos.h / img.height) * imgData.zoom;
        const w = img.width * scale;
        const h = img.height * scale;
        
        // Center the image with offset
        const x = pos.x + (pos.w - w) / 2 + imgData.offsetX;
        const y = pos.y + (pos.h - h) / 2 + imgData.offsetY;

        ctx.drawImage(img, x, y, w, h);

        if (borderRadius > 0) ctx.restore();
        if (shadow) ctx.restore();

        loaded++;
      };
      img.src = imgData.src;
    });
  }, [images, aspectRatio, layout, gap, bgColor, borderRadius, shadow]);

  useEffect(() => {
    drawCollage();
  }, [drawCollage]);

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = 'collage.png';
    a.click();
  };

  const handleImageClick = (index: number) => {
    setSelectedImage(selectedImage === index ? null : index);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-th" title="Photo Collage Maker" description="Create professional photo collages with custom layouts" color="#8b5cf6" />
      
      <DropZone onFiles={handleFiles} accept="image/*" multiple icon="fa-images" title="Add photos" subtitle="Select multiple images to get started" />
      
      {images.length > 0 && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Aspect Ratio */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-expand-arrows-alt mr-2"></i>
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 gap-2">
                {aspectRatios.map(ratio => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className="px-3 py-2 rounded text-xs font-medium transition-all"
                    style={{
                      background: aspectRatio === ratio.value ? '#8b5cf6' : 'var(--card-bg)',
                      color: aspectRatio === ratio.value ? 'white' : 'var(--text-primary)',
                      border: `1px solid ${aspectRatio === ratio.value ? '#8b5cf6' : 'var(--border-color)'}`
                    }}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Preset */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-th-large mr-2"></i>
                Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                {layouts.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setLayout(l.value)}
                    className="px-3 py-2 rounded text-xs font-medium transition-all"
                    style={{
                      background: layout === l.value ? '#8b5cf6' : 'var(--card-bg)',
                      color: layout === l.value ? 'white' : 'var(--text-primary)',
                      border: `1px solid ${layout === l.value ? '#8b5cf6' : 'var(--border-color)'}`
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Options */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <label className="text-sm font-medium block mb-3" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-palette mr-2"></i>
                Style
              </label>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Gap: {gap}px</label>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={gap}
                    onChange={e => setGap(+e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Border Radius: {borderRadius}px</label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={borderRadius}
                    onChange={e => setBorderRadius(+e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>Background Color</label>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={e => setBgColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer border"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shadow}
                    onChange={e => setShadow(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>Add Shadow</span>
                </label>
              </div>
            </div>

            {/* Image List */}
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-images mr-2"></i>
                Images ({images.length})
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer transition-all"
                    style={{
                      background: selectedImage === i ? 'rgba(139, 92, 246, 0.2)' : 'var(--card-bg)',
                      border: `1px solid ${selectedImage === i ? '#8b5cf6' : 'var(--border-color)'}`
                    }}
                    onClick={() => handleImageClick(i)}
                  >
                    <img src={img.src} alt="" className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        Image {i + 1}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Zoom: {(img.zoom * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveImage(i, i - 1); }}
                        className="p-1 rounded hover:bg-opacity-20"
                        style={{ color: 'var(--text-secondary)' }}
                        disabled={i === 0}
                      >
                        <i className="fas fa-arrow-up text-xs"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveImage(i, i + 1); }}
                        className="p-1 rounded hover:bg-opacity-20"
                        style={{ color: 'var(--text-secondary)' }}
                        disabled={i === images.length - 1}
                      >
                        <i className="fas fa-arrow-down text-xs"></i>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="p-1 rounded hover:bg-red-500 hover:text-white"
                        style={{ color: '#ef4444' }}
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Image Controls */}
            {selectedImage !== null && images[selectedImage] && (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)', border: '2px solid #8b5cf6' }}>
                <label className="text-sm font-medium block mb-3" style={{ color: 'var(--text-primary)' }}>
                  <i className="fas fa-crop-alt mr-2"></i>
                  Adjust Image {selectedImage + 1}
                </label>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Zoom: {(images[selectedImage].zoom * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={images[selectedImage].zoom}
                      onChange={e => updateImage(selectedImage, { zoom: +e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Horizontal Position
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={images[selectedImage].offsetX}
                      onChange={e => updateImage(selectedImage, { offsetX: +e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs block mb-1" style={{ color: 'var(--text-secondary)' }}>
                      Vertical Position
                    </label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={images[selectedImage].offsetY}
                      onChange={e => updateImage(selectedImage, { offsetY: +e.target.value })}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={() => updateImage(selectedImage, { zoom: 1, offsetX: 0, offsetY: 0 })}
                    className="w-full px-3 py-2 rounded text-sm"
                    style={{ background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    <i className="fas fa-undo mr-2"></i>
                    Reset Position
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preview and Canvas */}
          <div className="lg:col-span-2">
            <div className="sticky top-4">
              <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  <i className="fas fa-info-circle mr-1"></i>
                  Click on an image in the list to adjust its position and zoom
                </p>
              </div>
              
              <canvas
                ref={canvasRef}
                className="w-full rounded-lg border mx-auto"
                style={{ 
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
              />

              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={download} icon="fa-download">
                  Download Collage
                </Button>
                <Button variant="secondary" onClick={() => { setImages([]); setSelectedImage(null); }} icon="fa-trash">
                  Clear All
                </Button>
                <Button variant="secondary" onClick={() => setImages([])} icon="fa-plus">
                  Add More
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Favicon Generator ──
export const FaviconGenerator: React.FC = () => {
  const [text, setText] = useState('M');
  const [bgColor, setBgColor] = useState('#3b82f6');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(24);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    c.width = 64; c.height = 64;
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, 64, 64, 12);
    ctx.fill();
    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.slice(0, 2), 32, 34);
  }, [text, bgColor, textColor, fontSize]);

  const download = (size: number) => {
    if (!canvasRef.current) return;
    setSelectedSize(size);
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(canvasRef.current, 0, 0, size, size);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png'); a.download = `favicon-${size}.png`; a.click();
    // Reset selection after 1 second
    setTimeout(() => setSelectedSize(null), 1000);
  };

  const downloadAll = () => {
    if (!canvasRef.current) return;
    [16, 32, 48, 64, 128, 180].forEach((size, index) => {
      setTimeout(() => {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(canvasRef.current!, 0, 0, size, size);
        const a = document.createElement('a');
        a.href = c.toDataURL('image/png');
        a.download = `favicon-${size}.png`;
        a.click();
      }, index * 200);
    });
  };

  return (
    <div className="tool-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Text (1-2 chars)</label>
            <input 
              type="text" 
              maxLength={2} 
              value={text} 
              onChange={e => setText(e.target.value)} 
              className="input-field" 
              style={{ maxWidth: '120px' }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                <i className="fas fa-fill-drip mr-1"></i>Background
              </label>
              <div className="relative">
                <input 
                  type="color" 
                  value={bgColor} 
                  onChange={e => setBgColor(e.target.value)} 
                  className="w-full h-12 rounded-lg cursor-pointer border-2 hover:border-[var(--accent)] transition-colors" 
                  style={{ borderColor: 'var(--border-color)' }} 
                />
                <span className="absolute bottom-1 right-2 text-xs font-mono opacity-60 pointer-events-none" style={{ color: 'var(--text-primary)' }}>
                  {bgColor}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                <i className="fas fa-font mr-1"></i>Text Color
              </label>
              <div className="relative">
                <input 
                  type="color" 
                  value={textColor} 
                  onChange={e => setTextColor(e.target.value)} 
                  className="w-full h-12 rounded-lg cursor-pointer border-2 hover:border-[var(--accent)] transition-colors" 
                  style={{ borderColor: 'var(--border-color)' }} 
                />
                <span className="absolute bottom-1 right-2 text-xs font-mono opacity-60 pointer-events-none" style={{ color: 'var(--text-primary)' }}>
                  {textColor}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Font Size: {fontSize}px</label>
            <input type="range" min="12" max="48" value={fontSize} onChange={e => setFontSize(+e.target.value)} className="w-full" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <canvas ref={canvasRef} className="rounded-xl border-2 shadow-lg" style={{ borderColor: 'var(--border-color)', width: '128px', height: '128px', imageRendering: 'pixelated' }} />
          <div className="flex flex-wrap gap-2 justify-center">
            {[16, 32, 48, 64, 128, 180].map(s => (
              <button 
                key={s} 
                onClick={() => download(s)} 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 hover:shadow-md"
                style={{ 
                  background: selectedSize === s ? 'var(--accent)' : 'var(--bg-tertiary)', 
                  color: selectedSize === s ? 'white' : 'var(--text-primary)', 
                  border: `2px solid ${selectedSize === s ? 'var(--accent)' : 'var(--border-color)'}`,
                  boxShadow: selectedSize === s ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                <i className="fas fa-download mr-1 text-xs"></i>
                {s}×{s}
              </button>
            ))}
          </div>
          <button 
            onClick={downloadAll}
            className="btn-primary w-full mt-2"
            style={{ 
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            <i className="fas fa-file-archive mr-2"></i>
            Download All Sizes
          </button>
        </div>
      </div>
    </div>
  );
};
