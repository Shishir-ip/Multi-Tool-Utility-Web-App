import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

export const VideoCompressor: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string; size: number } | null>(null);
  const [quality, setQuality] = useState(70);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f || !f.type.startsWith('video/')) return;
    
    const url = URL.createObjectURL(f);
    setVideo({ url, name: f.name, size: f.size });
    setCompressedUrl(null);
  };

  const compressVideo = async () => {
    if (!video || !videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    // Create MediaRecorder
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: quality * 10000 // Quality affects bitrate
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setCompressedUrl(url);
      setCompressedSize(blob.size);
      setProcessing(false);
      stream.getTracks().forEach(track => track.stop());
    };

    // Record video
    videoEl.currentTime = 0;
    videoEl.play();
    recorder.start();

    const processFrame = () => {
      if (videoEl.ended || videoEl.paused) {
        recorder.stop();
        return;
      }
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(processFrame);
    };

    videoEl.onplay = () => {
      processFrame();
    };
  };

  const download = () => {
    if (!compressedUrl) return;
    const a = document.createElement('a');
    a.href = compressedUrl;
    a.download = `compressed-${video?.name || 'video.webm'}`;
    a.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-compress" title="Video Compressor" description="Compress video file size" color="#f97316" />
      
      {!video ? (
        <DropZone onFiles={handleFile} accept="video/*" icon="fa-video" title="Upload a video" subtitle="MP4, WebM, MOV supported" />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{video.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Original size: {formatSize(video.size)}</p>
          </div>

          <video ref={videoRef} src={video.url} className="w-full rounded-lg" style={{ maxHeight: '300px' }} controls />

          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Quality: {quality}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Lower quality = smaller file size
            </p>
          </div>

          {compressedUrl && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
              <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                <i className="fas fa-check-circle mr-2"></i>
                Compression complete!
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Compressed size: {formatSize(compressedSize)} ({((1 - compressedSize / video.size) * 100).toFixed(1)}% reduction)
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={compressVideo} icon={processing ? 'fa-spinner fa-spin' : 'fa-compress'} disabled={processing}>
              {processing ? 'Compressing...' : 'Compress Video'}
            </Button>
            {compressedUrl && (
              <Button onClick={download} icon="fa-download" variant="secondary">
                Download
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setVideo(null); setCompressedUrl(null); }} icon="fa-redo">
              New Video
            </Button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
