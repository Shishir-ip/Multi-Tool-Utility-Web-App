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
  const [images, setImages] = useState<string[]>([]);
  const [cols, setCols] = useState(3);
  const [gap, setGap] = useState(4);
  const [bgColor, setBgColor] = useState('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFiles = (fl: FileList) => {
    Array.from(fl).filter(f => f.type.startsWith('image/')).forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setImages(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  useEffect(() => {
    if (!canvasRef.current || images.length === 0) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    const size = 600;
    c.width = size; c.height = size;
    ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size);
    const rows = Math.ceil(images.length / cols);
    const cellW = (size - gap * (cols + 1)) / cols;
    const cellH = (size - gap * (rows + 1)) / rows;
    let loaded = 0;
    images.forEach((src, i) => {
      const img = new Image();
      img.onload = () => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = gap + col * (cellW + gap), y = gap + row * (cellH + gap);
        const scale = Math.max(cellW / img.width, cellH / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, x + (cellW - w) / 2, y + (cellH - h) / 2, w, h);
        loaded++;
        if (loaded === images.length) {}
      };
      img.src = src;
    });
  }, [images, cols, gap, bgColor]);

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png'); a.download = 'collage.png'; a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-th" title="Photo Collage Maker" description="Create photo collages from images" color="#8b5cf6" />
      <DropZone onFiles={handleFiles} accept="image/*" multiple icon="fa-images" title="Add photos" subtitle="Select multiple images" />
      {images.length > 0 && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Columns</label>
              <input type="number" min="1" max="6" value={cols} onChange={e => setCols(+e.target.value)} className="input-field w-20" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Gap (px)</label>
              <input type="number" min="0" max="20" value={gap} onChange={e => setGap(+e.target.value)} className="input-field w-20" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Background</label>
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer border" style={{ borderColor: 'var(--border-color)' }} />
            </div>
          </div>
          <canvas ref={canvasRef} className="max-w-full rounded-lg border mx-auto" style={{ borderColor: 'var(--border-color)' }} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={download} icon="fa-download">Download Collage</Button>
            <Button variant="secondary" onClick={() => setImages([])} icon="fa-trash">Clear All</Button>
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
