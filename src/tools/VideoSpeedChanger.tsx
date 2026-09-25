import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

export const VideoSpeedChanger: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string } | null>(null);
  const [speed, setSpeed] = useState(1);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f || !f.type.startsWith('video/')) return;
    
    const url = URL.createObjectURL(f);
    setVideo({ url, name: f.name });
    setProcessedUrl(null);
  };

  const changeSpeed = async () => {
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
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setProcessedUrl(url);
      setProcessing(false);
      stream.getTracks().forEach(track => track.stop());
    };

    // Record video with speed change
    videoEl.currentTime = 0;
    videoEl.playbackRate = speed;
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

    videoEl.onended = () => {
      recorder.stop();
    };
  };

  const download = () => {
    if (!processedUrl) return;
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = `speed-${speed}x-${video?.name || 'video.webm'}`;
    a.click();
  };

  const speedPresets = [
    { label: '0.25x', value: 0.25 },
    { label: '0.5x', value: 0.5 },
    { label: '0.75x', value: 0.75 },
    { label: '1x (Normal)', value: 1 },
    { label: '1.25x', value: 1.25 },
    { label: '1.5x', value: 1.5 },
    { label: '2x', value: 2 },
    { label: '4x', value: 4 }
  ];

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-tachometer-alt" title="Video Speed Changer" description="Change video playback speed" color="#f97316" />
      
      {!video ? (
        <DropZone onFiles={handleFile} accept="video/*" icon="fa-video" title="Upload a video" subtitle="MP4, WebM, MOV supported" />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{video.name}</p>
          </div>

          <video ref={videoRef} src={video.url} className="w-full rounded-lg" style={{ maxHeight: '300px' }} controls />

          <div>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Speed: {speed}x
            </label>
            <input
              type="range"
              min="0.25"
              max="4"
              step="0.25"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {speedPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setSpeed(preset.value)}
                  className="px-3 py-1 rounded text-sm"
                  style={{
                    background: speed === preset.value ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: speed === preset.value ? 'white' : 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              {speed < 1 ? 'Slower than normal' : speed > 1 ? 'Faster than normal' : 'Normal speed'}
            </p>
          </div>

          {processedUrl && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
              <p className="text-sm font-medium" style={{ color: '#10b981' }}>
                <i className="fas fa-check-circle mr-2"></i>
                Speed change complete!
              </p>
              <video src={processedUrl} className="w-full rounded-lg mt-2" style={{ maxHeight: '200px' }} controls />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={changeSpeed} icon={processing ? 'fa-spinner fa-spin' : 'fa-tachometer-alt'} disabled={processing}>
              {processing ? 'Processing...' : 'Change Speed'}
            </Button>
            {processedUrl && (
              <Button onClick={download} icon="fa-download" variant="secondary">
                Download
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setVideo(null); setProcessedUrl(null); }} icon="fa-redo">
              New Video
            </Button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
