import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

export const VideoThumbnailExtractor: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string } | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f || !f.type.startsWith('video/')) return;
    
    const url = URL.createObjectURL(f);
    setVideo({ url, name: f.name });
    setThumbnails([]);
  };

  const extractThumbnails = async () => {
    if (!video || !videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    const thumbs: string[] = [];
    const duration = videoEl.duration;
    const numThumbnails = 8;
    const interval = duration / numThumbnails;

    for (let i = 0; i < numThumbnails; i++) {
      const time = i * interval;
      videoEl.currentTime = time;
      
      await new Promise(resolve => {
        videoEl.onseeked = () => {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          thumbs.push(canvas.toDataURL('image/jpeg', 0.8));
          resolve(null);
        };
      });
    }

    setThumbnails(thumbs);
    setProcessing(false);
  };

  const download = (dataUrl: string, index: number) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `thumbnail-${index + 1}.jpg`;
    a.click();
  };

  const downloadAll = () => {
    thumbnails.forEach((thumb, i) => {
      setTimeout(() => download(thumb, i), i * 200);
    });
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-image" title="Video Thumbnail Extractor" description="Extract thumbnails from video" color="#f97316" />
      
      {!video ? (
        <DropZone onFiles={handleFile} accept="video/*" icon="fa-video" title="Upload a video" subtitle="MP4, WebM, MOV supported" />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{video.name}</p>
          </div>

          <video ref={videoRef} src={video.url} className="w-full rounded-lg" style={{ maxHeight: '300px' }} controls />

          {thumbnails.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Extracted Thumbnails ({thumbnails.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {thumbnails.map((thumb, i) => (
                  <div key={i} className="relative group">
                    <img src={thumb} alt={`Thumbnail ${i + 1}`} className="w-full rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />
                    <button
                      onClick={() => download(thumb, i)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-download text-sm"></i>
                    </button>
                    <p className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                      Thumbnail {i + 1}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={extractThumbnails} icon={processing ? 'fa-spinner fa-spin' : 'fa-image'} disabled={processing}>
              {processing ? 'Extracting...' : 'Extract Thumbnails'}
            </Button>
            {thumbnails.length > 0 && (
              <Button onClick={downloadAll} icon="fa-download" variant="secondary">
                Download All
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setVideo(null); setThumbnails([]); }} icon="fa-redo">
              New Video
            </Button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
