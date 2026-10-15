import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

interface ThumbnailData {
  dataUrl: string;
  timestamp: number;
}

export const VideoThumbnailExtractor: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string; duration: number } | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailData[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Advanced settings
  const [extractionMode, setExtractionMode] = useState<'uniform' | 'interval' | 'custom'>('uniform');
  const [numThumbnails, setNumThumbnails] = useState(12);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [imageQuality, setImageQuality] = useState(90);
  const [imageFormat, setImageFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f || !f.type.startsWith('video/')) return;
    
    const url = URL.createObjectURL(f);
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.onloadedmetadata = () => {
      setVideo({ url, name: f.name, duration: tempVideo.duration });
      setEndTime(tempVideo.duration);
      setThumbnails([]);
      URL.revokeObjectURL(tempVideo.src);
    };
    tempVideo.src = url;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const extractThumbnails = async () => {
    if (!video || !videoRef.current || !canvasRef.current) return;
    
    setProcessing(true);
    setProgress(0);
    const videoEl = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    // Set canvas size
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;

    const thumbs: ThumbnailData[] = [];
    const duration = video.duration;
    const effectiveStart = Math.max(0, startTime);
    const effectiveEnd = Math.min(duration, endTime);
    const effectiveDuration = effectiveEnd - effectiveStart;

    let timePoints: number[] = [];

    // Calculate time points based on extraction mode
    if (extractionMode === 'uniform') {
      const interval = effectiveDuration / numThumbnails;
      for (let i = 0; i < numThumbnails; i++) {
        timePoints.push(effectiveStart + i * interval);
      }
    } else if (extractionMode === 'interval') {
      let currentTime = effectiveStart;
      while (currentTime < effectiveEnd) {
        timePoints.push(currentTime);
        currentTime += intervalSeconds;
      }
    } else if (extractionMode === 'custom') {
      const interval = effectiveDuration / numThumbnails;
      for (let i = 0; i < numThumbnails; i++) {
        timePoints.push(effectiveStart + i * interval);
      }
    }

    // Extract thumbnails
    for (let i = 0; i < timePoints.length; i++) {
      const time = timePoints[i];
      videoEl.currentTime = time;
      
      await new Promise<void>(resolve => {
        videoEl.onseeked = () => {
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          
          let mimeType = 'image/jpeg';
          let quality = imageQuality / 100;
          
          if (imageFormat === 'png') {
            mimeType = 'image/png';
            quality = 1;
          } else if (imageFormat === 'webp') {
            mimeType = 'image/webp';
          }
          
          thumbs.push({
            dataUrl: canvas.toDataURL(mimeType, quality),
            timestamp: time
          });
          
          setProgress(((i + 1) / timePoints.length) * 100);
          resolve();
        };
      });
    }

    setThumbnails(thumbs);
    setProcessing(false);
  };

  const download = (thumb: ThumbnailData, index: number) => {
    const a = document.createElement('a');
    a.href = thumb.dataUrl;
    const extension = imageFormat === 'png' ? 'png' : imageFormat === 'webp' ? 'webp' : 'jpg';
    a.download = `thumbnail-${index + 1}-${formatTime(thumb.timestamp).replace(/:/g, '-')}.${extension}`;
    a.click();
  };

  const downloadAll = () => {
    thumbnails.forEach((thumb, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = thumb.dataUrl;
        const extension = imageFormat === 'png' ? 'png' : imageFormat === 'webp' ? 'webp' : 'jpg';
        a.download = `thumbnail-${i + 1}-${formatTime(thumb.timestamp).replace(/:/g, '-')}.${extension}`;
        a.click();
      }, i * 200);
    });
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-image" title="Video Thumbnail Extractor" description="Extract thumbnails from video with advanced settings" color="#f97316" />
      
      {!video ? (
        <DropZone onFiles={handleFile} accept="video/*" icon="fa-video" title="Upload a video" subtitle="MP4, WebM, MOV supported" />
      ) : (
        <div className="space-y-6">
          {/* Video Info */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{video.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Duration: {formatTime(video.duration)}
            </p>
          </div>

          {/* Video Preview */}
          <video ref={videoRef} src={video.url} className="w-full rounded-lg" style={{ maxHeight: '300px' }} controls />

          {/* Advanced Settings */}
          <div className="p-4 rounded-lg space-y-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              <i className="fas fa-cog mr-2" style={{ color: '#f97316' }}></i>
              Extraction Settings
            </h3>

            {/* Extraction Mode */}
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Extraction Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setExtractionMode('uniform')}
                  className="px-3 py-2 rounded text-xs font-medium transition-all"
                  style={{
                    background: extractionMode === 'uniform' ? '#f97316' : 'var(--card-bg)',
                    color: extractionMode === 'uniform' ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${extractionMode === 'uniform' ? '#f97316' : 'var(--border-color)'}`
                  }}
                >
                  <i className="fas fa-th mr-1"></i>
                  Uniform
                </button>
                <button
                  onClick={() => setExtractionMode('interval')}
                  className="px-3 py-2 rounded text-xs font-medium transition-all"
                  style={{
                    background: extractionMode === 'interval' ? '#f97316' : 'var(--card-bg)',
                    color: extractionMode === 'interval' ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${extractionMode === 'interval' ? '#f97316' : 'var(--border-color)'}`
                  }}
                >
                  <i className="fas fa-clock mr-1"></i>
                  Interval
                </button>
                <button
                  onClick={() => setExtractionMode('custom')}
                  className="px-3 py-2 rounded text-xs font-medium transition-all"
                  style={{
                    background: extractionMode === 'custom' ? '#f97316' : 'var(--card-bg)',
                    color: extractionMode === 'custom' ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${extractionMode === 'custom' ? '#f97316' : 'var(--border-color)'}`
                  }}
                >
                  <i className="fas fa-sliders-h mr-1"></i>
                  Custom
                </button>
              </div>
            </div>

            {/* Mode-specific settings */}
            {extractionMode === 'uniform' && (
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Number of Thumbnails: {numThumbnails}
                </label>
                <input
                  type="range"
                  min="4"
                  max="50"
                  value={numThumbnails}
                  onChange={(e) => setNumThumbnails(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Evenly distributed across the video
                </p>
              </div>
            )}

            {extractionMode === 'interval' && (
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Interval: Every {intervalSeconds} seconds
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {[5, 10, 15, 30, 60].map(sec => (
                    <button
                      key={sec}
                      onClick={() => setIntervalSeconds(sec)}
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        background: intervalSeconds === sec ? '#f97316' : 'var(--card-bg)',
                        color: intervalSeconds === sec ? 'white' : 'var(--text-primary)',
                        border: `1px solid ${intervalSeconds === sec ? '#f97316' : 'var(--border-color)'}`
                      }}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            )}

            {extractionMode === 'custom' && (
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Number of Thumbnails: {numThumbnails}
                </label>
                <input
                  type="range"
                  min="4"
                  max="100"
                  value={numThumbnails}
                  onChange={(e) => setNumThumbnails(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Start Time (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max={video.duration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  End Time (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max={video.duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || video.duration)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            {/* Image Format */}
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Image Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['jpeg', 'png', 'webp'] as const).map(format => (
                  <button
                    key={format}
                    onClick={() => setImageFormat(format)}
                    className="px-3 py-2 rounded text-xs font-medium transition-all"
                    style={{
                      background: imageFormat === format ? '#f97316' : 'var(--card-bg)',
                      color: imageFormat === format ? 'white' : 'var(--text-primary)',
                      border: `1px solid ${imageFormat === format ? '#f97316' : 'var(--border-color)'}`
                    }}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Quality */}
            {imageFormat !== 'png' && (
              <div>
                <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Image Quality: {imageQuality}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={imageQuality}
                  onChange={(e) => setImageQuality(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {processing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Extracting thumbnails...</span>
                <span className="text-sm font-medium" style={{ color: '#f97316' }}>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: '#f97316' }}
                />
              </div>
            </div>
          )}

          {/* Extracted Thumbnails */}
          {thumbnails.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Extracted Thumbnails ({thumbnails.length})
                </p>
                <Button onClick={downloadAll} icon="fa-download" variant="secondary">
                  Download All
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {thumbnails.map((thumb, i) => (
                  <div key={i} className="relative group">
                    <img 
                      src={thumb.dataUrl} 
                      alt={`Thumbnail ${i + 1}`} 
                      className="w-full rounded-lg border" 
                      style={{ borderColor: 'var(--border-color)' }} 
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg">
                      {formatTime(thumb.timestamp)}
                    </div>
                    <button
                      onClick={() => download(thumb, i)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black bg-opacity-50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-download text-sm"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={extractThumbnails} icon={processing ? 'fa-spinner fa-spin' : 'fa-image'} disabled={processing}>
              {processing ? 'Extracting...' : 'Extract Thumbnails'}
            </Button>
            {thumbnails.length > 0 && (
              <Button onClick={() => setThumbnails([])} icon="fa-trash" variant="secondary">
                Clear Thumbnails
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
