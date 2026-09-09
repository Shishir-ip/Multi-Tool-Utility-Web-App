import { useState, useEffect } from 'react';

export default function DigitalClock() {
  const [time, setTime] = useState(new Date());
  const [format24, setFormat24] = useState(false);
  const [showSeconds, setShowSeconds] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
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

  const hours = format24 ? time.getHours() : time.getHours() % 12 || 12;
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = !format24 ? (time.getHours() >= 12 ? 'PM' : 'AM') : '';

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dateStr = `${days[time.getDay()]}, ${months[time.getMonth()]} ${time.getDate()}, ${time.getFullYear()}`;

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-[80vh] ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{ background: '#000000' }}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-3 z-10">
        <button
          onClick={() => setFormat24(!format24)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          {format24 ? '24H' : '12H'}
        </button>
        <button
          onClick={() => setShowSeconds(!showSeconds)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          {showSeconds ? ':SS' : ':SS'}
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
      </div>

      {/* Time Display */}
      <div className="text-center">
        <div
          className="font-mono font-bold tracking-tight"
          style={{
            fontSize: isFullscreen ? '20vw' : 'clamp(4rem, 15vw, 12rem)',
            color: '#ffffff',
            textShadow: '0 0 40px rgba(255, 255, 255, 0.1)',
            lineHeight: 1
          }}
        >
          {hours.toString().padStart(2, '0')}
          <span style={{ opacity: 0.6 }}>:</span>
          {minutes}
          {showSeconds && (
            <>
              <span style={{ opacity: 0.6 }}>:</span>
              {seconds}
            </>
          )}
          {!format24 && (
            <span className="ml-4" style={{ fontSize: '0.3em', opacity: 0.5, verticalAlign: 'super' }}>
              {ampm}
            </span>
          )}
        </div>

        {/* Date */}
        <div
          className="mt-6 font-light tracking-wide"
          style={{
            fontSize: isFullscreen ? '3vw' : 'clamp(1rem, 3vw, 2rem)',
            color: '#888888'
          }}
        >
          {dateStr}
        </div>
      </div>
    </div>
  );
}
