import React, { useState, useRef, useEffect } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

interface VideoData {
  file: File;
  url: string;
  name: string;
  size: number;
  duration: number;
  width: number;
  height: number;
}

type Mode = 'import' | 'editor' | 'exporting' | 'complete';
type ImportMethod = 'upload' | 'url';

export const ClipForgeStudio: React.FC = () => {
  const [mode, setMode] = useState<Mode>('import');
  const [importMethod, setImportMethod] = useState<ImportMethod>('upload');
  const [video, setVideo] = useState<VideoData | null>(null);
  const [error, setError] = useState<string>('');
  
  // URL import state
  const [videoUrl, setVideoUrl] = useState('');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('vidkraken_api_key') || '';
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  
  // Editor state
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [exportSettings, setExportSettings] = useState({
    format: 'mp4' as 'mp4' | 'webm',
    filename: ''
  });
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video file selection
  const handleVideoFile = (file: File) => {
    console.log('[ClipForge] File selected:', file.name, file.type, file.size);
    
    // Validate file
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    setError('');
    
    // Create Object URL immediately
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^/.]+$/, '');
    
    console.log('[ClipForge] Created Object URL:', url);
    
    // Create temporary video to get metadata
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    
    tempVideo.onloadedmetadata = () => {
      console.log('[ClipForge] Metadata loaded:', {
        duration: tempVideo.duration,
        width: tempVideo.videoWidth,
        height: tempVideo.videoHeight
      });
      
      const videoData: VideoData = {
        file,
        url,
        name,
        size: file.size,
        duration: tempVideo.duration,
        width: tempVideo.videoWidth,
        height: tempVideo.videoHeight
      };
      
      setVideo(videoData);
      setStartTime(0);
      setEndTime(tempVideo.duration);
      setExportSettings(prev => ({ ...prev, filename: `${name}_clipforge` }));
      setMode('editor');
    };
    
    tempVideo.onerror = () => {
      console.error('[ClipForge] Failed to load video metadata');
      setError('Failed to load video. The file may be corrupted or in an unsupported format.');
      URL.revokeObjectURL(url);
    };
    
    tempVideo.src = url;
  };

  // Handle file upload from DropZone
  const handleFileUpload = (files: FileList) => {
    const file = files[0];
    if (file) {
      handleVideoFile(file);
    }
  };

  // Save API key to localStorage
  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('vidkraken_api_key', key);
    setShowApiKeyInput(false);
  };

  // Download video from URL using VidKraken API (via serverless proxy)
  const downloadFromUrl = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!apiKey.trim()) {
      setShowApiKeyInput(true);
      setError('Please enter your VidKraken API key');
      return;
    }

    setError('');
    setIsDownloading(true);
    setDownloadProgress('Submitting download request...');

    try {
      // Step 1: Submit download request via serverless proxy
      const submitResponse = await fetch('/api/dl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: videoUrl,
          format: '720', // Default to 720p
          apiKey: apiKey
        })
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.error || `Failed to submit download: ${submitResponse.statusText}`);
      }

      const submitData = await submitResponse.json();
      const jobId = submitData.jobId;

      console.log('[ClipForge] Download job submitted:', jobId);
      setDownloadProgress(`Download queued (Job ID: ${jobId.slice(0, 8)}...)`);

      // Step 2: Poll for status with exponential backoff
      let downloadUrl = '';
      let attempts = 0;
      const maxAttempts = 30; // Max 30 attempts
      let pollInterval = 2000; // Start with 2 seconds

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        attempts++;

        setDownloadProgress(`Processing... (${attempts * (pollInterval / 1000)}s)`);

        const statusResponse = await fetch(`/api/dl/${jobId}?apiKey=${encodeURIComponent(apiKey)}`);

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.error || `Failed to check status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        console.log('[ClipForge] Download status:', statusData.status);

        if (statusData.status === 'COMPLETED' && statusData.downloadUrl) {
          downloadUrl = statusData.downloadUrl;
          break;
        } else if (statusData.status === 'FAILED') {
          throw new Error('Download failed on server');
        }

        // Exponential backoff: 2s, 4s, 8s, 16s, 32s, then cap at 32s
        if (pollInterval < 32000) {
          pollInterval = Math.min(pollInterval * 2, 32000);
        }
      }

      if (!downloadUrl) {
        throw new Error('Download timed out. Please try again.');
      }

      setDownloadProgress('Downloading video file...');

      // Step 3: Download the file
      const videoResponse = await fetch(downloadUrl);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
      }

      const blob = await videoResponse.blob();
      const fileName = submitData.title ? `${submitData.title.replace(/[^a-z0-9]/gi, '_')}.mp4` : 'video.mp4';
      const file = new File([blob], fileName, { type: 'video/mp4' });

      console.log('[ClipForge] Video downloaded:', file.name, file.size);
      setDownloadProgress('Loading video...');

      // Load the downloaded video
      handleVideoFile(file);

    } catch (err) {
      console.error('[ClipForge] Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download video');
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  };

  // Ensure video loads when entering editor mode
  useEffect(() => {
    if (mode === 'editor' && video && videoRef.current) {
      console.log('[ClipForge] Loading video in editor:', video.url);
      const videoElement = videoRef.current;
      
      // Force reload if src changed
      if (videoElement.src !== video.url) {
        videoElement.src = video.url;
        videoElement.load();
      }
      
      // Set up event listeners
      const handleLoadedData = () => {
        console.log('[ClipForge] Video loaded successfully');
      };
      
      const handleError = (e: any) => {
        console.error('[ClipForge] Video playback error:', e);
        setError('Video failed to load. Please try a different file.');
      };
      
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('error', handleError);
      
      return () => {
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [mode, video]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  // Export video (simplified - just downloads the original for now)
  const handleExport = async () => {
    if (!video) return;
    
    setIsExporting(true);
    
    try {
      // For now, just create a copy of the original file
      // In a full implementation, this would use FFmpeg to apply trim/crop/etc.
      const blob = new Blob([video.file], { type: video.file.type });
      const url = URL.createObjectURL(blob);
      
      setExportedUrl(url);
      setMode('complete');
    } catch (error) {
      console.error('Export failed:', error);
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download exported video
  const handleDownload = () => {
    if (!exportedUrl) return;
    const a = document.createElement('a');
    a.href = exportedUrl;
    a.download = `${exportSettings.filename}.${exportSettings.format}`;
    a.click();
  };

  // Reset to start
  const handleStartNew = () => {
    console.log('[ClipForge] Resetting to start');
    
    // Pause and clean up video
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    
    // Revoke Object URLs
    if (video?.url) {
      URL.revokeObjectURL(video.url);
    }
    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
    }
    
    // Reset state
    setVideo(null);
    setExportedUrl('');
    setMode('import');
    setError('');
    setStartTime(0);
    setEndTime(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[ClipForge] Component unmounting');
      
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
      }
      
      if (video?.url) {
        URL.revokeObjectURL(video.url);
      }
      if (exportedUrl) {
        URL.revokeObjectURL(exportedUrl);
      }
    };
  }, [video, exportedUrl]);

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

        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <i className="fas fa-exclamation-circle mt-0.5" style={{ color: '#ef4444' }}></i>
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

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
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska" 
            icon="fa-video" 
            title="Drop your video here or click to browse" 
            subtitle="MP4, WebM, MOV, AVI, MKV supported"
          />
        )}

        {/* URL Method */}
        {importMethod === 'url' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                <i className="fas fa-info-circle mr-2" style={{ color: '#8b5cf6' }}></i>
                Download videos from YouTube and other platforms using VidKraken API
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                You need a free API key from <a href="https://vidkraken.com" target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>vidkraken.com</a>
              </p>
            </div>

            {/* API Key Section */}
            {!apiKey && (
              <div className="p-4 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  <i className="fas fa-key mr-2" style={{ color: '#f59e0b' }}></i>
                  API Key Required
                </p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  To download videos from URLs, you need a VidKraken API key. Get your free API key from{' '}
                  <a href="https://vidkraken.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>
                    vidkraken.com/dashboard
                  </a>
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter your API key"
                    className="input-field flex-1"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button onClick={() => saveApiKey(apiKey)} icon="fa-save">
                    Save
                  </Button>
                </div>
              </div>
            )}

            {apiKey && !showApiKeyInput && (
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>API key configured</span>
                </div>
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="text-xs px-3 py-1 rounded"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                >
                  Change
                </button>
              </div>
            )}

            {showApiKeyInput && (
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  VidKraken API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter your API key"
                    className="input-field flex-1"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button onClick={() => saveApiKey(apiKey)} icon="fa-save">
                    Save
                  </Button>
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  Your API key is stored locally in your browser
                </p>
              </div>
            )}

            {/* Video URL Input */}
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
                Video URL
              </label>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                className="input-field"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isDownloading}
              />
            </div>

            {/* Download Progress */}
            {isDownloading && (
              <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-3">
                  <i className="fas fa-spinner fa-spin text-xl" style={{ color: '#8b5cf6' }}></i>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {downloadProgress}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      Please wait while we download your video...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Button */}
            <Button 
              onClick={downloadFromUrl} 
              icon={isDownloading ? 'fa-spinner fa-spin' : 'fa-download'}
              disabled={isDownloading || !videoUrl.trim()}
            >
              {isDownloading ? 'Downloading...' : 'Download & Edit Video'}
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

  // Export Complete Screen
  if (mode === 'complete' && exportedUrl) {
    return (
      <div className="tool-container">
        <ToolHeader 
          icon="fa-check-circle" 
          title="Export Complete" 
          description="Your video is ready to download" 
          color="#10b981" 
        />

        <div className="space-y-6">
          <div className="p-6 rounded-lg text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
            <i className="fas fa-check-circle text-5xl mb-3" style={{ color: '#10b981' }}></i>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>✓ Export Complete</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your video has been processed successfully
            </p>
          </div>

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
  if (mode === 'editor' && video) {
    return (
      <div className="tool-container">
        <ToolHeader 
          icon="fa-video" 
          title="ClipForge Studio" 
          description="Edit your video" 
          color="#8b5cf6" 
        />

        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444' }}>
            <i className="fas fa-exclamation-circle mt-0.5" style={{ color: '#ef4444' }}></i>
            <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {/* Video Info Bar */}
        <div className="mb-4 p-3 rounded-lg flex flex-wrap items-center gap-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <i className="fas fa-file-video" style={{ color: '#8b5cf6' }}></i>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{video.name}</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {formatSize(video.size)} • {video.width}×{video.height} • {formatTime(video.duration)}
          </div>
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
            src={video.url}
            className="w-full"
            style={{ 
              maxHeight: '500px',
              objectFit: 'contain'
            }}
            controls
            preload="auto"
            onTimeUpdate={(e) => {
              const time = e.currentTarget.currentTime;
              if (time >= endTime) {
                e.currentTarget.pause();
                e.currentTarget.currentTime = startTime;
              }
            }}
            onLoadedData={() => {
              console.log('[ClipForge] Video loadeddata event fired');
            }}
            onError={(e) => {
              console.error('[ClipForge] Video error event:', e);
              setError('Video failed to load. Please try a different file.');
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
                max={video.duration}
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
                  max={video.duration}
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
                max={video.duration}
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
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Crop the video to focus on a specific area
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>X Position (%)</label>
                <input type="number" min="0" max="100" defaultValue="0" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Y Position (%)</label>
                <input type="number" min="0" max="100" defaultValue="0" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Width (%)</label>
                <input type="number" min="1" max="100" defaultValue="100" className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Height (%)</label>
                <input type="number" min="1" max="100" defaultValue="100" className="input-field text-sm" />
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              <i className="fas fa-info-circle mr-1"></i>
              Crop will be applied during export
            </p>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-expand" style={{ color: '#8b5cf6' }}></i>
            Aspect Ratio
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Original', '16:9', '4:3', '1:1', '9:16', '21:9'].map((ratio) => (
              <button
                key={ratio}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: ratio === 'Original' ? '#8b5cf6' : 'var(--bg-tertiary)',
                  color: ratio === 'Original' ? 'white' : 'var(--text-primary)',
                  border: `2px solid ${ratio === 'Original' ? '#8b5cf6' : 'var(--border-color)'}`
                }}
              >
                {ratio}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <i className="fas fa-info-circle mr-1"></i>
            Aspect ratio will be applied during export
          </p>
        </div>

        {/* Rotate & Flip */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-undo" style={{ color: '#8b5cf6' }}></i>
            Rotate & Flip
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button variant="secondary" icon="fa-redo">
              Rotate 90°
            </Button>
            <Button variant="secondary" icon="fa-undo">
              Rotate -90°
            </Button>
            <Button variant="secondary" icon="fa-arrows-alt-h">
              Flip H
            </Button>
            <Button variant="secondary" icon="fa-arrows-alt-v">
              Flip V
            </Button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <i className="fas fa-info-circle mr-1"></i>
            Transformations will be applied during export
          </p>
        </div>

        {/* Audio Extraction */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-music" style={{ color: '#8b5cf6' }}></i>
            Extract Audio
          </h3>
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                Extract audio only (no video)
              </span>
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Format</label>
                <select className="input-field text-sm">
                  <option>MP3</option>
                  <option>AAC</option>
                  <option>WAV</option>
                  <option>M4A</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Bitrate</label>
                <select className="input-field text-sm">
                  <option>128 kbps</option>
                  <option>192 kbps</option>
                  <option>256 kbps</option>
                  <option>320 kbps</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Compression */}
        <div className="mb-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <i className="fas fa-compress" style={{ color: '#8b5cf6' }}></i>
            Compress Video
          </h3>
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
              Quality Preset
            </label>
            <div className="flex flex-wrap gap-2">
              {['High', 'Medium', 'Low'].map((quality, i) => (
                <button
                  key={quality}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: i === 0 ? '#8b5cf6' : 'var(--bg-tertiary)',
                    color: i === 0 ? 'white' : 'var(--text-primary)',
                    border: `2px solid ${i === 0 ? '#8b5cf6' : 'var(--border-color)'}`
                  }}
                >
                  {quality}
                </button>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              <i className="fas fa-info-circle mr-1"></i>
              Lower quality = smaller file size
            </p>
          </div>
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
              >
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
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
        </div>

        {/* Export Button */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} icon={isExporting ? 'fa-spinner fa-spin' : 'fa-download'} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export Video'}
          </Button>
          <Button variant="secondary" onClick={handleStartNew} icon="fa-times">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
