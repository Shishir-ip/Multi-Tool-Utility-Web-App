import React, { useState, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export const SubtitleEditor: React.FC = () => {
  const [video, setVideo] = useState<{ url: string; name: string } | null>(null);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(2);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFile = (fl: FileList) => {
    const f = fl[0];
    if (!f || !f.type.startsWith('video/')) return;
    
    const url = URL.createObjectURL(f);
    setVideo({ url, name: f.name });
    setSubtitles([]);
  };

  const addSubtitle = () => {
    if (!currentText.trim()) return;
    
    const newSubtitle: Subtitle = {
      id: Date.now(),
      startTime,
      endTime,
      text: currentText
    };
    
    setSubtitles([...subtitles, newSubtitle].sort((a, b) => a.startTime - b.startTime));
    setCurrentText('');
    setStartTime(endTime);
    setEndTime(endTime + 2);
  };

  const removeSubtitle = (id: number) => {
    setSubtitles(subtitles.filter(s => s.id !== id));
  };

  const updateSubtitle = (id: number, field: keyof Subtitle, value: any) => {
    setSubtitles(subtitles.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const exportSRT = () => {
    let srt = '';
    subtitles.forEach((sub, i) => {
      srt += `${i + 1}\n`;
      srt += `${formatTime(sub.startTime).replace('.', ',')} --> ${formatTime(sub.endTime).replace('.', ',')}\n`;
      srt += `${sub.text}\n\n`;
    });

    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${video?.name || 'video'}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCurrentSubtitle = () => {
    if (!videoRef.current) return null;
    const currentTime = videoRef.current.currentTime;
    return subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-closed-captioning" title="Subtitle Editor" description="Create and edit subtitles" color="#f97316" />
      
      {!video ? (
        <DropZone onFiles={handleFile} accept="video/*" icon="fa-video" title="Upload a video" subtitle="MP4, WebM, MOV supported" />
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{video.name}</p>
          </div>

          <div className="relative">
            <video 
              ref={videoRef} 
              src={video.url} 
              className="w-full rounded-lg" 
              style={{ maxHeight: '300px' }} 
              controls 
              onTimeUpdate={() => {}}
            />
            {showSubtitles && getCurrentSubtitle() && (
              <div 
                className="absolute bottom-12 left-0 right-0 text-center px-4"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '8px',
                  fontSize: '18px'
                }}
              >
                {getCurrentSubtitle()?.text}
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Add Subtitle</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Text
                </label>
                <input
                  type="text"
                  value={currentText}
                  onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Enter subtitle text..."
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
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
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
                    End Time (seconds)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                    className="input-field"
                  />
                </div>
              </div>
              <Button onClick={addSubtitle} icon="fa-plus" variant="secondary">
                Add Subtitle
              </Button>
            </div>
          </div>

          {subtitles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Subtitles ({subtitles.length})
                </h3>
                <div className="flex gap-2">
                  <Button onClick={() => setShowSubtitles(!showSubtitles)} icon={showSubtitles ? 'fa-eye' : 'fa-eye-slash'} variant="secondary">
                    {showSubtitles ? 'Hide' : 'Show'} Preview
                  </Button>
                  <Button onClick={exportSRT} icon="fa-download" variant="secondary">
                    Export SRT
                  </Button>
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {subtitles.map((sub) => (
                  <div key={sub.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={sub.text}
                          onChange={(e) => updateSubtitle(sub.id, 'text', e.target.value)}
                          className="input-field text-sm mb-2"
                        />
                        <div className="flex gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                          <span>{formatTime(sub.startTime)} → {formatTime(sub.endTime)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSubtitle(sub.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button variant="secondary" onClick={() => { setVideo(null); setSubtitles([]); }} icon="fa-redo">
            New Video
          </Button>
        </div>
      )}
    </div>
  );
};
