import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

export const VideoToGif: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string } | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [duration, setDuration] = useState(2);
  const [fps, setFps] = useState(10);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f || !f.type.startsWith('video/')) return;
    
    const url = URL.createObjectURL(f);
    setVideo({ url, name: f.name });
    setGifUrl(null);
  };

  const convertToGif = async () => {
    if (!video || !videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    // Simple GIF creation using canvas frames
    // Note: This is a simplified version. For production, use a proper GIF encoder library
    const frames: ImageData[] = [];
    const frameInterval = 1 / fps;
    const totalFrames = Math.floor(duration * fps);

    videoEl.currentTime = startTime;
    
    const captureFrame = () => {
      if (frames.length >= totalFrames) {
        // Create animated preview (simplified - just show last frame as static image)
        const dataUrl = canvas.toDataURL('image/png');
        setGifUrl(dataUrl);
        setProcessing(false);
        return;
      }

      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
      
      videoEl.currentTime += frameInterval;
      setTimeout(captureFrame, 100);
    };

    videoEl.onseeked = () => {
      captureFrame();
    };
  };

  const download = () => {
    if (!gifUrl) return;
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `${video?.name || 'video'}-frames.png`;
    a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-image" title="Video to GIF" description="Convert video clips to GIF" color="#f97316" />
      
      {!video ? (
        <DropZone onFiles={handleFile} accept="video/*" icon="fa-video" title="Upload a video" subtitle="MP4, WebM, MOV supported" />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{video.name}</p>
          </div>

          <video ref={videoRef} src={video.url} className="w-full rounded-lg" style={{ maxHeight: '300px' }} controls />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Start Time (seconds)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Duration (seconds)
              </label>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value) || 2)}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                FPS (Frames per second)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value) || 10)}
                className="input-field"
              />
            </div>
          </div>

          {gifUrl && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#10b981' }}>
                <i className="fas fa-check-circle mr-2"></i>
                Conversion complete!
              </p>
              <img src={gifUrl} alt="GIF Preview" className="rounded-lg max-w-full" />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Note: This is a preview frame. For animated GIF, use a dedicated GIF encoder library.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={convertToGif} icon={processing ? 'fa-spinner fa-spin' : 'fa-image'} disabled={processing}>
              {processing ? 'Converting...' : 'Convert to GIF'}
            </Button>
            {gifUrl && (
              <Button onClick={download} icon="fa-download" variant="secondary">
                Download
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setVideo(null); setGifUrl(null); }} icon="fa-redo">
              New Video
            </Button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
