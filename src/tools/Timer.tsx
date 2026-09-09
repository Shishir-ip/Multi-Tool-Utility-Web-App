import { useState, useRef, useCallback, useEffect } from 'react';

export default function Timer() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [running, setRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const endTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    if (running) return;
    if (remaining === 0) {
      const total = (hours * 3600 + minutes * 60 + seconds) * 1000;
      if (total === 0) return;
      setTotalDuration(total);
      setRemaining(total);
      endTimeRef.current = Date.now() + total;
    } else {
      endTimeRef.current = Date.now() + remaining;
    }
    setRunning(true);
    intervalRef.current = window.setInterval(() => {
      const left = endTimeRef.current - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        playAlert();
      } else {
        setRemaining(left);
      }
    }, 50);
  }, [running, remaining, hours, minutes, seconds]);

  const pause = useCallback(() => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setRemaining(0);
    setTotalDuration(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const playAlert = () => {
    try {
      const ctx = new AudioContext();
      const playBeep = (time: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time);
        osc.stop(time + 0.3);
      };
      playBeep(ctx.currentTime);
      playBeep(ctx.currentTime + 0.4);
      playBeep(ctx.currentTime + 0.8);
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const displayTime = remaining > 0 ? remaining : (hours * 3600 + minutes * 60 + seconds) * 1000;
  const displayHours = Math.floor(displayTime / 3600000);
  const displayMinutes = Math.floor((displayTime % 3600000) / 60000);
  const displaySeconds = Math.floor((displayTime % 60000) / 1000);

  const progress = totalDuration > 0 ? (totalDuration - remaining) / totalDuration : 0;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - (remaining > 0 ? remaining / totalDuration : 1));

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[80vh] px-4 ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{ background: '#000000' }}
    >
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleFullscreen}
          className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
      </div>

      {/* Progress Ring + Time — responsive SVG */}
      <div className="relative mb-6 sm:mb-8 w-full flex items-center justify-center">
        <svg width="280" height="280" viewBox="0 0 320 320" className="progress-ring max-w-full" style={{ maxWidth: '280px' }}>
          <circle
            cx="160" cy="160" r="140"
            fill="none"
            stroke="#222222"
            strokeWidth="8"
          />
          <circle
            cx="160" cy="160" r="140"
            fill="none"
            stroke={remaining === 0 && running === false && totalDuration > 0 ? '#ef4444' : '#3b82f6'}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="font-mono font-bold text-center px-2"
            style={{
              fontSize: isFullscreen ? 'min(8vw, 4rem)' : 'clamp(1.8rem, 5vw, 3.5rem)',
              color: remaining === 0 && totalDuration > 0 && !running ? '#ef4444' : '#ffffff',
              wordBreak: 'keep-all'
            }}
          >
            {displayHours.toString().padStart(2, '0')}:
            {displayMinutes.toString().padStart(2, '0')}:
            {displaySeconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Input Controls — responsive */}
      {!running && remaining === 0 && (
        <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8">
          <div className="text-center">
            <label className="text-[10px] sm:text-xs block mb-1" style={{ color: '#888' }}>Hours</label>
            <input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={e => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 sm:w-20 text-center py-2 sm:py-3 rounded-lg font-mono text-base sm:text-xl"
              style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333' }}
            />
          </div>
          <div className="text-center">
            <label className="text-[10px] sm:text-xs block mb-1" style={{ color: '#888' }}>Minutes</label>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={e => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 sm:w-20 text-center py-2 sm:py-3 rounded-lg font-mono text-base sm:text-xl"
              style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333' }}
            />
          </div>
          <div className="text-center">
            <label className="text-[10px] sm:text-xs block mb-1" style={{ color: '#888' }}>Seconds</label>
            <input
              type="number"
              min="0"
              max="59"
              value={seconds}
              onChange={e => setSeconds(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-16 sm:w-20 text-center py-2 sm:py-3 rounded-lg font-mono text-base sm:text-xl"
              style={{ background: '#1a1a1a', color: '#fff', border: '1px solid #333' }}
            />
          </div>
        </div>
      )}

      {/* Controls — wraps on mobile */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
        {!running ? (
          <button
            onClick={start}
            className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg transition-all hover:scale-105"
            style={{ background: '#10b981', color: '#ffffff' }}
          >
            <i className="fas fa-play mr-1 sm:mr-2"></i> {remaining > 0 ? 'Resume' : 'Start'}
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg transition-all hover:scale-105"
            style={{ background: '#f59e0b', color: '#ffffff' }}
          >
            <i className="fas fa-pause mr-1 sm:mr-2"></i> Pause
          </button>
        )}
        <button
          onClick={reset}
          className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg transition-all hover:scale-105"
          style={{ background: '#333333', color: '#ffffff', border: '1px solid #555' }}
        >
          <i className="fas fa-redo mr-1 sm:mr-2"></i> Reset
        </button>
      </div>
    </div>
  );
}
