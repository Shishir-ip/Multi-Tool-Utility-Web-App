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
      className={`flex flex-col items-center justify-center min-h-[80vh] px-4 ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{ background: '#000000' }}
    >
      {/* Controls — responsive positioning */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-1.5 sm:gap-3 z-10 flex-wrap justify-end max-w-[60vw]">
        <button
          onClick={() => setFormat24(!format24)}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-all"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          {format24 ? '24H' : '12H'}
        </button>
        <button
          onClick={() => setShowSeconds(!showSeconds)}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-all"
          style={{ background: showSeconds ? '#333' : '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          :SS
        </button>
        <button
          onClick={toggleFullscreen}
          className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-[10px] sm:text-sm font-medium transition-all"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
      </div>

      {/* Time Display */}
      <div className="text-center w-full overflow-hidden">
        <div
          className="font-mono font-bold tracking-tight"
          style={{
            fontSize: isFullscreen ? 'min(18vw, 14rem)' : 'clamp(3rem, 14vw, 12rem)',
            color: '#ffffff',
            textShadow: '0 0 40px rgba(255, 255, 255, 0.1)',
            lineHeight: 1,
            wordBreak: 'keep-all',
            overflowWrap: 'normal',
            whiteSpace: 'nowrap'
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
            <span className="ml-2 sm:ml-4" style={{ fontSize: '0.25em', opacity: 0.5, verticalAlign: 'super' }}>
              {ampm}
            </span>
          )}
        </div>

        {/* Date */}
        <div
          className="mt-4 sm:mt-6 font-light tracking-wide px-2"
          style={{
            fontSize: isFullscreen ? 'min(3vw, 2rem)' : 'clamp(0.8rem, 2.5vw, 2rem)',
            color: '#888888'
          }}
        >
          {dateStr}
        </div>
      </div>
    </div>
  );
}
