import React, { useState, useRef, useEffect } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';

// ── Audio Trimmer ──
export const AudioTrimmer: React.FC = () => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const handleFile = async (fl: FileList) => {
    const f = fl[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    const arrayBuffer = await f.arrayBuffer();
    const ctx = new AudioContext();
    audioContextRef.current = ctx;
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    setAudioBuffer(buffer);
    setDuration(buffer.duration);
    setStartTime(0);
    setEndTime(buffer.duration);
  };

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 200;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j] || 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y1 = (1 + min) * canvas.height / 2;
      const y2 = (1 + max) * canvas.height / 2;
      ctx.moveTo(i, y1);
      ctx.lineTo(i, y2);
    }
    ctx.stroke();

    const startX = (startTime / duration) * canvas.width;
    const endX = (endTime / duration) * canvas.width;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(startX, 0, endX - startX, canvas.height);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, canvas.height);
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, canvas.height);
    ctx.stroke();
  }, [audioBuffer, startTime, endTime, duration]);

  const playPreview = () => {
    if (!audioBuffer || !audioContextRef.current) return;
    if (sourceRef.current) sourceRef.current.stop();
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start(0, startTime, endTime - startTime);
    sourceRef.current = source;
    setPlaying(true);
    source.onended = () => setPlaying(false);
  };

  const exportAudio = () => {
    if (!audioBuffer) return;
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(startTime * sampleRate);
    const endSample = Math.floor(endTime * sampleRate);
    const length = endSample - startSample;
    const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, length, sampleRate);
    const buffer = offlineCtx.createBuffer(audioBuffer.numberOfChannels, length, sampleRate);
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        outputData[i] = inputData[startSample + i];
      }
    }
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    offlineCtx.startRendering().then(renderedBuffer => {
      const wav = audioBufferToWav(renderedBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'trimmed.wav';
      a.click();
    });
  };

  const audioBufferToWav = (buffer: AudioBuffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1;
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = buffer.length * blockAlign;
    const headerSize = 44;
    const arrayBuffer = new ArrayBuffer(headerSize + dataSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    return arrayBuffer;
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-scissors" title="Audio Trimmer" description="Trim and cut audio files" color="#10b981" />
      {!audioBuffer ? (
        <DropZone onFiles={handleFile} accept="audio/*" icon="fa-music" title="Upload audio file" subtitle="MP3, WAV, OGG supported" />
      ) : (
        <div className="space-y-4">
          <canvas ref={canvasRef} className="w-full rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Start: {startTime.toFixed(2)}s</label>
              <input type="range" min="0" max={duration} step="0.01" value={startTime} onChange={e => setStartTime(+e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>End: {endTime.toFixed(2)}s</label>
              <input type="range" min="0" max={duration} step="0.01" value={endTime} onChange={e => setEndTime(+e.target.value)} className="w-full" />
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Duration: {(endTime - startTime).toFixed(2)}s</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={playPreview} icon={playing ? 'fa-spinner fa-spin' : 'fa-play'} disabled={playing}>{playing ? 'Playing...' : 'Preview'}</Button>
            <Button onClick={exportAudio} icon="fa-download" variant="secondary">Export WAV</Button>
            <Button onClick={() => { setAudioBuffer(null); setAudioUrl(null); }} icon="fa-redo" variant="secondary">New Audio</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Webcam & Mic Inspector ──
export const WebcamMicInspector: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMic, setSelectedMic] = useState('');
  const [resolution, setResolution] = useState('');
  const [fps, setFps] = useState(0);
  const [volume, setVolume] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startDevices = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      
      // Ensure video element is ready and set srcObject
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(err => console.error('Video play failed:', err));
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      setCameras(devices.filter(d => d.kind === 'videoinput'));
      setMicrophones(devices.filter(d => d.kind === 'audioinput'));

      const track = mediaStream.getVideoTracks()[0];
      const settings = track.getSettings();
      setResolution(`${settings.width}x${settings.height}`);
      setFps(settings.frameRate || 0);

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const updateVolume = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b) / data.length;
        setVolume(avg);
        requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (err) {
      alert('Failed to access devices. Please grant permissions.');
    }
  };

  const stopDevices = () => {
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear video srcObject
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDevices();
    };
  }, []);

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-video" title="Webcam & Mic Inspector" description="Test camera and microphone" color="#10b981" />
      {!stream ? (
        <Button onClick={startDevices} icon="fa-play">Start Devices</Button>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Camera</label>
              <select value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)} className="input-field">
                {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0, 8)}`}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Microphone</label>
              <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)} className="input-field">
                {microphones.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || `Mic ${m.deviceId.slice(0, 8)}`}</option>)}
              </select>
            </div>
          </div>
          <video ref={videoRef} autoPlay muted playsInline className="w-full rounded-lg border" style={{ borderColor: 'var(--border-color)' }} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Resolution</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{resolution}</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Frame Rate</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{fps} FPS</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Mic Volume</p>
              <div className="w-full h-3 rounded-full overflow-hidden mt-2" style={{ background: 'var(--border-color)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, volume * 2)}%`, background: volume > 50 ? '#ef4444' : '#10b981' }} />
              </div>
            </div>
          </div>
          <Button onClick={stopDevices} icon="fa-stop" variant="secondary">Stop Devices</Button>
        </div>
      )}
    </div>
  );
};

// ── Keyboard Tester ──
export const KeyboardTester: React.FC = () => {
  const [pressed, setPressed] = useState<Set<string>>(new Set());
  const [tested, setTested] = useState<Set<string>>(new Set());
  const [maxRollover, setMaxRollover] = useState(0);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const code = e.code;
      setPressed(prev => {
        const next = new Set(prev);
        next.add(code);
        if (next.size > maxRollover) setMaxRollover(next.size);
        return next;
      });
      setTested(prev => new Set(prev).add(code));
      setHistory(prev => [code, ...prev].slice(0, 20));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      setPressed(prev => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [maxRollover]);

  const reset = () => {
    setPressed(new Set());
    setTested(new Set());
    setMaxRollover(0);
    setHistory([]);
  };

  const keys = [
    ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
    ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
    ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
    ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
    ['ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ControlRight'],
    ['PrintScreen', 'ScrollLock', 'Pause', 'Insert', 'Home', 'PageUp', 'Delete', 'End', 'PageDown', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']
  ];

  const getKeyStyle = (code: string) => {
    if (pressed.has(code)) return { background: '#ef4444', color: 'white' };
    if (tested.has(code)) return { background: '#10b981', color: 'white' };
    return { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' };
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-keyboard" title="Keyboard Tester" description="Test keyboard keys and rollover" color="#10b981" />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keys Pressed</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{pressed.size}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Max Rollover</p>
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{maxRollover}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Keys Tested</p>
          <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{tested.size}</p>
        </div>
      </div>
      <div className="space-y-1 mb-4 overflow-x-auto">
        {keys.map((row, i) => (
          <div key={i} className="flex gap-1 justify-center">
            {row.map(code => (
              <div key={code} className="px-2 py-1.5 rounded text-xs font-mono min-w-[40px] text-center" style={getKeyStyle(code)}>
                {code.replace('Key', '').replace('Digit', '').replace('Arrow', '→').slice(0, 6)}
              </div>
            ))}
          </div>
        ))}
      </div>
      {history.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Key History</p>
          <div className="flex flex-wrap gap-1">
            {history.map((code, i) => (
              <span key={i} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{code}</span>
            ))}
          </div>
        </div>
      )}
      <Button onClick={reset} icon="fa-redo" variant="secondary">Reset</Button>
    </div>
  );
};
