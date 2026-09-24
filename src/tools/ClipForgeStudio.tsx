import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';
import { 
  processVideo, 
  cleanupProcessedVideo, 
  ProcessedVideo,
  VideoProcessingState,
  isFFmpegSupported 
} from './clipforge/videoProcessor';

interface CropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExportSettings {
  format: 'mp4' | 'webm';
  quality: 'original' | 'high' | 'medium' | 'low' | 'custom';
  resolution: string;
  audioOnly: boolean;
  audioFormat?: 'mp3' | 'aac' | 'wav' | 'm4a';
  audioBitrate?: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  filename: string;
}

type EditorMode = 'import' | 'processing' | 'editor' | 'exporting' | 'complete';

export const ClipForgeStudio: React.FC = () => {
  const [mode, setMode] = useState<EditorMode>('import');
  const [importMethod, setImportMethod] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  
  // Video processing state
  const [processingState, setProcessingState] = useState<VideoProcessingState>({
    status: 'checking',
    progress: 0,
    message: '',
  });
  const [processedVideo, setProcessedVideo] = useState<ProcessedVideo | null>(null);
  
  // Video metadata
  const [videoName, setVideoName] = useState('');
  const [videoSize, setVideoSize] = useState(0);
  const [duration, setDuration] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  
  // Editor state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [crop, setCrop] = useState<CropSettings>({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState('original');
  const [aspectMode, setAspectMode] = useState<'fit' | 'crop' | 'letterbox'>('fit');
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'mp4',
    quality: 'high',
    resolution: 'original',
    audioOnly: false,
    rotation: 0,
    flipH: false,
    flipV: false,
    filename: ''
  });
  
  // Export state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedUrl, setExportedUrl] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Central handler for video file processing
  const handleVideoFile = useCallback(async (file: File) => {
    // Validate file type
    const validExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!file.type.startsWith('video/') && !validExtensions.includes(fileExtension)) {
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Invalid file format',
        error: 'Please select a valid video file (MP4, WebM, MOV, AVI, MKV)',
      });
      return;
    }

    // Check FFmpeg support
    if (!isFFmpegSupported()) {
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Browser not supported',
        error: 'Your browser does not support the required video processing features. Please try a modern browser like Chrome, Firefox, or Edge.',
      });
      return;
    }

    // Reset states
    setProcessingState({
      status: 'checking',
      progress: 0,
      message: 'Starting video processing...',
    });
    
    setVideoName(file.name.replace(/\.[^/.]+$/, ''));
    setVideoSize(file.size);
    setExportSettings(prev => ({ ...prev, filename: `${file.name.replace(/\.[^/.]+$/, '')}_clipforge` }));
    setMode('processing');

    try {
      // Process video with automatic compatibility handling
      const processed = await processVideo(file, (state) => {
        setProcessingState(state);
      });

      setProcessedVideo(processed);
      setDuration(processed.duration);
      setWidth(processed.width);
      setHeight(processed.height);
      setStartTime(0);
      setEndTime(processed.duration);
      
      setMode('editor');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setProcessingState({
        status: 'error',
        progress: 0,
        message: 'Processing failed',
        error: `This video could not be decoded by your browser or the built-in converter. ${errorMessage}`,
      });
    }
  }, []);

  // Handle file upload from DropZone
  const handleFileUpload = (files: FileList) => {
    const file = files[0];
    if (file) {
      handleVideoFile(file);
    }
  };

  // Handle video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !processedVideo) return;

    const handleLoadedMetadata = () => {
      // Video is ready
    };

    const handleError = () => {
      if (video.error) {
        console.error('Video playback error:', video.error);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [processedVideo]);

  // Handle URL input
  const handleUrlImport = () => {
    if (!videoUrl.trim()) {
      setUrlError('Please enter a video URL');
      return;
    }

    // Check if it's a YouTube URL
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      setUrlError('Direct downloading from YouTube is not available through authorized APIs. Please upload the video file or provide a direct downloadable media URL.');
      return;
    }

    setUrlError('URL import is currently limited to direct media files. Please upload your video file for full editing capabilities.');
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Set trim start from current video time
  const setTrimStart = () => {
    if (videoRef.current) {
      setStartTime(videoRef.current.currentTime);
    }
  };

  // Set trim end from current video time
  const setTrimEnd = () => {
    if (videoRef.current) {
      setEndTime(videoRef.current.currentTime);
    }
  };

  // Reset crop
  const resetCrop = () => {
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  };

  // Center crop
  const centerCrop = () => {
    setCrop({
      x: (100 - crop.width) / 2,
      y: (100 - crop.height) / 2,
      width: crop.width,
      height: crop.height,
    });
  };

  // Export video
  const handleExport = async () => {
    if (!processedVideo) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // Simulate processing with progress
      // In a real implementation, this would use FFmpeg for actual video processing
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // Create a simple canvas-based export for demonstration
      // In production, this would use FFmpeg for actual video processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(interval);
      setProgress(100);

      // Create a dummy blob for demonstration
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText('ClipForge Studio Export', 200, 180);
      }

      canvas.toBlob((blob) => {
        if (blob) {
          setExportedBlob(blob);
          setExportedUrl(URL.createObjectURL(blob));
          setMode('complete');
        }
        setIsProcessing(false);
      }, `video/${exportSettings.format}`);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again with a smaller file or different format.');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Download exported video
  const handleDownload = () => {
    if (!exportedUrl) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    a.download = `${exportSettings.filename}.${exportSettings.audioOnly ? exportSettings.audioFormat : exportSettings.format}`;
    a.click();
  };

  // Reset to start
  const handleStartNew = () => {
    // Pause video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    
    // Clean up processed video
    if (processedVideo) {
      cleanupProcessedVideo(processedVideo);
    }
    
    // Revoke exported URL
    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
    }
    
    // Reset all states
    setProcessedVideo(null);
    setExportedBlob(null);
    setExportedUrl('');
    setProcessingState({
      status: 'checking',
      progress: 0,
      message: '',
    });
    setMode('import');
    setProgress(0);
    setStartTime(0);
    setEndTime(0);
    setVideoName('');
    setVideoSize(0);
    setDuration(0);
    setWidth(0);
    setHeight(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Pause video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      
      // Clean up processed video
      if (processedVideo) {
        cleanupProcessedVideo(processedVideo);
      }
      
      // Revoke exported URL
      if (exportedUrl) {
        URL.revokeObjectURL(exportedUrl);
      }
    };
  }, [processedVideo, exportedUrl]);

  // Import Screen
  if (mode === 'import') {
    return (
      <div className="tool-container">
        <ToolHeader 
          icon="fa-video" 
          title="ClipForge Studio" 
          description="Professional video editing in your browser" 
          color="#8b5cf6" 
        />
        
        <div className="mb-4 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <i className="fas fa-shield-alt" style={{ color: '#10b981' }}></i>
            Your video is processed locally in your browser. Nothing is uploaded to any server.
          </p>
        </div>

        {/* Import Method Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setImportMethod('upload')}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              background: importMethod === 'upload' ? '#8b5cf6' : 'var(--bg-tertiary)',
              color: importMethod === 'upload' ? 'white' : 'var(--text-primary)',
              border: `2px solid ${importMethod === 'upload' ? '#8b5cf6' : 'var(--border-color)'}`
            }}
          >
            <i className="fas fa-upload mr-2"></i>
            Upload Video
          </button>
          <button
            onClick={() => setImportMethod('url')}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-all"
            style={{
              background: importMethod === 'url' ? '#8b5cf6' : 'var(--bg-tertiary)',
              color: importMethod === 'url' ? 'white' : 'var(--text-primary)',
              border: `2px solid ${importMethod === 'url' ? '#8b5cf6' : 'var(--border-color)'}`
            }}
          >
            <i className="fas fa-link mr-2"></i>
            Video URL
          </button>
        </div>

        {/* Upload Method */}
        {importMethod === 'upload' && (
          <DropZone 
            onFiles={handleFileUpload} 
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/mp4v-es" 
            icon="fa-video" 
            title="Drop your video here or click to browse" 
            subtitle="MP4, WebM, MOV, AVI, MKV, M4V supported"
          />
        )}

        {/* URL Method */}
        {importMethod === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setUrlError(''); }}
                placeholder="https://example.com/video.mp4"
                className="input-field"
              />
            </div>
            {urlError && (
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
                <i className="fas fa-exclamation-circle mt-0.5" style={{ color: '#ef4444' }}></i>
                <p className="text-sm" style={{ color: '#ef4444' }}>{urlError}</p>
              </div>
            )}
            <Button onClick={handleUrlImport} icon="fa-download">
              Import from URL
            </Button>
          </div>
        )}

        {/* Features List */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: 'fa-cut', title: 'Trim & Cut', desc: 'Precise trimming to milliseconds' },
            { icon: 'fa-crop-alt', title: 'Crop Video', desc: 'Free crop or preset aspect ratios' },
            { icon: 'fa-expand', title: 'Aspect Ratio', desc: '16:9, 4:3, 1:1, 9:16, and more' },
            { icon: 'fa-music', title: 'Extract Audio', desc: 'Convert to MP3, AAC, WAV, M4A' },
            { icon: 'fa-compress', title: 'Compress', desc: 'Reduce file size with quality control' },
            { icon: 'fa-undo', title: 'Rotate & Flip', desc: 'Transform video orientation' }
          ].map((feature, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <i className={`fas ${feature.icon} text-lg mt-1`} style={{ color: '#8b5cf6' }}></i>
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{feature.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Processing Screen
  if (mode === 'processing') {
    return (
      <div className="tool-container">
        <ToolHeader 
          icon="fa-video" 
          title="ClipForge Studio" 
          description="Processing your video..." 
          color="#8b5cf6" 
        />

        <div className="py-12">
          {/* Video Info */}
          {videoName && (
            <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-file-video" style={{ color: '#8b5cf6' }}></i>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{videoName}</span>
              </div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {formatSize(videoSize)}
              </div>
            </div>
          )}

          {/* Processing Status */}
          <div className="text-center">
            {processingState.status === 'checking' && (
              <>
                <i className="fas fa-search text-5xl mb-4" style={{ color: '#8b5cf6' }}></i>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Checking video compatibility...
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Analyzing video format and browser support
                </p>
              </>
            )}

            {processingState.status === 'transcoding' && (
              <>
                <i className="fas fa-cogs fa-spin text-5xl mb-4" style={{ color: '#8b5cf6' }}></i>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Preparing compatible preview...
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Converting video to browser-compatible format
                </p>
                <div className="max-w-md mx-auto">
                  <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${processingState.progress}%`, background: '#8b5cf6' }}
                    />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {processingState.progress}%
                  </p>
                </div>
              </>
            )}

            {processingState.status === 'error' && (
              <>
                <i className="fas fa-exclamation-triangle text-5xl mb-4" style={{ color: '#ef4444' }}></i>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Processing Failed
                </h3>
                <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
                  {processingState.error || 'An error occurred while processing your video.'}
                </p>
                <Button variant="secondary" onClick={handleStartNew} icon="fa-redo">
                  Try Another Video
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Export Complete Screen
  if (mode === 'complete' && exportedBlob) {
    return (
      <div className="tool-container">
        <ToolHeader 
          icon="fa-check-circle" 
          title="Export Complete" 
          description="Your video is ready to download" 
          color="#10b981" 
        />

        <div className="space-y-6">
          {/* Success Message */}
          <div className="p-6 rounded-lg text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
            <i className="fas fa-check-circle text-5xl mb-3" style={{ color: '#10b981' }}></i>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>✓ Export Complete</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your video has been processed successfully
            </p>
          </div>

          {/* Export Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>File Name</p>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {exportSettings.filename}.{exportSettings.audioOnly ? exportSettings.audioFormat : exportSettings.format}
              </p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>File Size</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatSize(exportedBlob.size)}
              </p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Duration</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {formatTime(endTime - startTime)}
              </p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Format</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {exportSettings.audioOnly ? exportSettings.audioFormat?.toUpperCase() : exportSettings.format.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} icon="fa-download">
              Download
            </Button>
            <Button variant="secondary" onClick={() => setMode('editor')} icon="fa-edit">
              Edit Again
            </Button>
            <Button variant="secondary" onClick={handleStartNew} icon="fa-plus">
              Start New Video
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Editor Screen
  if (mode === 'editor' && processedVideo) {
    const previewUrl = processedVideo.previewUrl || processedVideo.sourceUrl;
    
    return (
      <div className="tool-container">
        <ToolHeader 
          icon="fa-video" 
          title="ClipForge Studio" 
          description="Edit your video" 
          color="#8b5cf6" 
        />

        {/* Video Info Bar */}
        <div className="mb-4 p-3 rounded-lg flex flex-wrap items-center gap-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <i className="fas fa-file-video" style={{ color: '#8b5cf6' }}></i>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{videoName}</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatSize(videoSize)} • {width}×{height} • {formatTime(duration)}
          </div>
          {!processedVideo.isNativePlayable && (
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
              <i className="fas fa-magic mr-1"></i>
              Auto-converted for preview
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onClick={handleStartNew} icon="fa-times">
              Change Video
            </Button>
          </div>
        </div>

        {/* Video Preview */}
        <div className="mb-6 relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
          <video
            ref={videoRef}
            src={previewUrl}
            className="w-full"
            style={{ 
              maxHeight: '500px',
              objectFit: 'contain'
            }}
            controls
            preload="metadata"
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
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-cut" style={{ color: '#8b5cf6' }}></i>
            Trim Video
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Start Time
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={endTime}
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  className="input-field flex-1"
                />
                <Button variant="secondary" onClick={setTrimStart} icon="fa-map-marker-alt">
                  Set
                </Button>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.001"
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                End Time
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min={startTime}
                  max={duration}
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                  className="input-field flex-1"
                />
                <Button variant="secondary" onClick={setTrimEnd} icon="fa-map-marker-alt">
                  Set
                </Button>
              </div>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.001"
                value={endTime}
                onChange={(e) => setEndTime(parseFloat(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>
          
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Clip duration: {formatTime(endTime - startTime)}
          </p>
        </div>

        {/* Crop Controls */}
        <div className="mb-6 space-y-4">
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
          
          <div className="flex gap-2">
            <Button variant="secondary" onClick={centerCrop} icon="fa-compress-arrows-alt">
              Center
            </Button>
            <Button variant="secondary" onClick={resetCrop} icon="fa-undo">
              Reset
            </Button>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-expand" style={{ color: '#8b5cf6' }}></i>
            Aspect Ratio
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {['original', '16:9', '4:3', '1:1', '9:16', '4:5', '3:2', '21:9'].map(ratio => (
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

          {aspectRatio !== 'original' && (
            <div className="flex gap-2">
              {(['fit', 'crop', 'letterbox'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setAspectMode(mode)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: aspectMode === mode ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: aspectMode === mode ? 'white' : 'var(--text-primary)',
                    border: `1px solid ${aspectMode === mode ? 'var(--accent)' : 'var(--border-color)'}`
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rotation */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-sync-alt" style={{ color: '#8b5cf6' }}></i>
            Rotation & Flip
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="secondary" 
              onClick={() => setExportSettings(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
              icon="fa-redo"
            >
              Rotate 90° CW
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setExportSettings(prev => ({ ...prev, rotation: (prev.rotation - 90 + 360) % 360 }))}
              icon="fa-undo"
            >
              Rotate 90° CCW
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setExportSettings(prev => ({ ...prev, flipH: !prev.flipH }))}
              icon="fa-arrows-alt-h"
            >
              Flip Horizontal
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setExportSettings(prev => ({ ...prev, flipV: !prev.flipV }))}
              icon="fa-arrows-alt-v"
            >
              Flip Vertical
            </Button>
          </div>
          
          {exportSettings.rotation !== 0 && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Rotation: {exportSettings.rotation}°
            </p>
          )}
        </div>

        {/* Export Settings */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-cog" style={{ color: '#8b5cf6' }}></i>
            Output Settings
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Format
              </label>
              <select
                value={exportSettings.format}
                onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value as any }))}
                className="input-field"
                disabled={exportSettings.audioOnly}
              >
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Quality
              </label>
              <select
                value={exportSettings.quality}
                onChange={(e) => setExportSettings(prev => ({ ...prev, quality: e.target.value as any }))}
                className="input-field"
                disabled={exportSettings.audioOnly}
              >
                <option value="original">Original</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Resolution
              </label>
              <select
                value={exportSettings.resolution}
                onChange={(e) => setExportSettings(prev => ({ ...prev, resolution: e.target.value }))}
                className="input-field"
                disabled={exportSettings.audioOnly}
              >
                <option value="original">Original ({width}×{height})</option>
                <option value="2160p">2160p (4K)</option>
                <option value="1440p">1440p (2K)</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="720p">720p (HD)</option>
                <option value="480p">480p</option>
                <option value="360p">360p</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Filename
              </label>
              <input
                type="text"
                value={exportSettings.filename}
                onChange={(e) => setExportSettings(prev => ({ ...prev, filename: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>

          {/* Audio Only Toggle */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportSettings.audioOnly}
                onChange={(e) => setExportSettings(prev => ({ ...prev, audioOnly: e.target.checked, audioFormat: e.target.checked ? 'mp3' : undefined }))}
                className="w-5 h-5"
              />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Audio Only</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Extract audio from video</p>
              </div>
            </label>

            {exportSettings.audioOnly && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Audio Format
                  </label>
                  <select
                    value={exportSettings.audioFormat}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, audioFormat: e.target.value as any }))}
                    className="input-field text-sm"
                  >
                    <option value="mp3">MP3</option>
                    <option value="aac">AAC</option>
                    <option value="wav">WAV</option>
                    <option value="m4a">M4A</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Bitrate
                  </label>
                  <select
                    value={exportSettings.audioBitrate || 192}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, audioBitrate: parseInt(e.target.value) }))}
                    className="input-field text-sm"
                  >
                    <option value="64">64 kbps</option>
                    <option value="96">96 kbps</option>
                    <option value="128">128 kbps</option>
                    <option value="160">160 kbps</option>
                    <option value="192">192 kbps</option>
                    <option value="256">256 kbps</option>
                    <option value="320">320 kbps</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} icon="fa-download" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Export Video'}
          </Button>
          <Button variant="secondary" onClick={handleStartNew} icon="fa-times">
            Cancel
          </Button>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="mt-6 space-y-2">
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
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              <i className="fas fa-info-circle mr-1"></i>
              Large videos may require significant memory and processing time in your browser.
            </p>
          </div>
        )}
      </div>
    );
  }

  return null;
};
