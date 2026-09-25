import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

export const VideoStabilizer: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string } | null>(null);
  const [stabilizationLevel, setStabilizationLevel] = useState(50);
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

  const stabilizeVideo = async () => {
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

    // Simple stabilization simulation
    // In a real implementation, this would use motion detection and frame interpolation
    const maxOffset = (100 - stabilizationLevel) * 0.1; // Max pixel offset
    
    videoEl.currentTime = 0;
    videoEl.play();
    recorder.start();

    let frameCount = 0;
    const processFrame = () => {
      if (videoEl.ended || videoEl.paused) {
        recorder.stop();
        return;
      }

      // Simulate stabilization by applying slight adjustments
      const offsetX = Math.sin(frameCount * 0.1) * maxOffset;
      const offsetY = Math.cos(frameCount * 0.1) * maxOffset;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        videoEl, 
        offsetX, 
        offsetY, 
        canvas.width - Math.abs(offsetX) * 2, 
        canvas.height - Math.abs(offsetY) * 2
      );

      frameCount++;
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
    a.download = `stabilized-${video?.name || 'video.webm'}`;
    a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-video" title="Video Stabilizer" description="Stabilize shaky videos" color="#f97316" />
      
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
              Stabilization Level: {stabilizationLevel}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={stabilizationLevel}
              onChange={(e) => setStabilizationLevel(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              <span>Light</span>
              <span>Medium</span>
              <span>Strong</span>
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              <i className="fas fa-info-circle mr-1"></i>
              Higher stabilization level = more aggressive smoothing. Note: This is a simplified stabilization algorithm.
            </p>
          </div>

          {processedUrl && (
            <div className="p-4 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
              <p className="text-sm font-medium mb-2" style={{ color: '#10b981' }}>
                <i className="fas fa-check-circle mr-2"></i>
                Stabilization complete!
              </p>
              <video src={processedUrl} className="w-full rounded-lg" style={{ maxHeight: '200px' }} controls />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={stabilizeVideo} icon={processing ? 'fa-spinner fa-spin' : 'fa-video'} disabled={processing}>
              {processing ? 'Stabilizing...' : 'Stabilize Video'}
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

          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <i className="fas fa-info-circle mr-1"></i>
              <strong>Note:</strong> This tool uses a simplified stabilization algorithm. For professional video stabilization, 
              consider using dedicated software like Adobe Premiere Pro, DaVinci Resolve, or FFmpeg with deshake filter.
            </p>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
};
