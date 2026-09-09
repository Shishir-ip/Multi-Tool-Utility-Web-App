import { useState, useRef, useCallback } from 'react';

interface Lap {
  id: number;
  time: number;
  split: number;
}

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedRef = useRef<number>(0);

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    startTimeRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      setElapsed(accumulatedRef.current + (Date.now() - startTimeRef.current));
    }, 10);
  }, [running]);

  const pause = useCallback(() => {
    if (!running) return;
    setRunning(false);
    accumulatedRef.current += Date.now() - startTimeRef.current;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [running]);

  const reset = useCallback(() => {
    setRunning(false);
    setElapsed(0);
    setLaps([]);
    accumulatedRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const lap = useCallback(() => {
    const lastLapTime = laps.length > 0 ? laps[0].time : 0;
    const split = elapsed - lastLapTime;
    setLaps(prev => [{ id: prev.length + 1, time: elapsed, split }, ...prev]);
  }, [elapsed, laps]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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

      {/* Time Display */}
      <div
        className="font-mono font-bold tracking-tight mb-6 sm:mb-8 text-center px-2"
        style={{
          fontSize: isFullscreen ? 'min(15vw, 12rem)' : 'clamp(2.5rem, 10vw, 8rem)',
          color: '#ffffff',
          textShadow: '0 0 30px rgba(255, 255, 255, 0.08)',
          wordBreak: 'keep-all',
          overflowWrap: 'normal'
        }}
      >
        {formatTime(elapsed)}
      </div>

      {/* Controls — wraps on mobile */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 px-2">
        {!running ? (
          <button
            onClick={start}
            className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg transition-all hover:scale-105"
            style={{ background: '#10b981', color: '#ffffff' }}
          >
            <i className="fas fa-play mr-1 sm:mr-2"></i> Start
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
        {running && (
          <button
            onClick={lap}
            className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-lg transition-all hover:scale-105"
            style={{ background: '#3b82f6', color: '#ffffff' }}
          >
            <i className="fas fa-flag mr-1 sm:mr-2"></i> Lap
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

      {/* Lap History */}
      {laps.length > 0 && (
        <div className="w-full max-w-lg overflow-auto px-2" style={{ maxHeight: '30vh' }}>
          <table className="w-full">
            <thead>
              <tr style={{ color: '#888888' }}>
                <th className="text-left py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium">Lap</th>
                <th className="text-right py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium">Split</th>
                <th className="text-right py-2 px-2 sm:px-4 text-xs sm:text-sm font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {laps.map(l => (
                <tr key={l.id} style={{ borderTop: '1px solid #222' }}>
                  <td className="py-2 px-2 sm:px-4 font-mono text-xs sm:text-sm" style={{ color: '#ffffff' }}>#{l.id}</td>
                  <td className="py-2 px-2 sm:px-4 font-mono text-right text-xs sm:text-sm" style={{ color: '#10b981' }}>{formatTime(l.split)}</td>
                  <td className="py-2 px-2 sm:px-4 font-mono text-right text-xs sm:text-sm" style={{ color: '#aaaaaa' }}>{formatTime(l.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
