import { useState, useEffect, useRef } from 'react';

export default function AnalogClock() {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = Math.min(canvas.parentElement?.clientWidth || 400, 400);
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = center - 20;

    ctx.clearRect(0, 0, size, size);

    // Clock face
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(center, center, radius - 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Hour marks
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      const innerR = radius - 25;
      const outerR = radius - 8;
      ctx.beginPath();
      ctx.moveTo(center + innerR * Math.cos(angle), center + innerR * Math.sin(angle));
      ctx.lineTo(center + outerR * Math.cos(angle), center + outerR * Math.sin(angle));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Minute marks
    for (let i = 0; i < 60; i++) {
      if (i % 5 === 0) continue;
      const angle = (i * Math.PI) / 30 - Math.PI / 2;
      const innerR = radius - 15;
      const outerR = radius - 8;
      ctx.beginPath();
      ctx.moveTo(center + innerR * Math.cos(angle), center + innerR * Math.sin(angle));
      ctx.lineTo(center + outerR * Math.cos(angle), center + outerR * Math.sin(angle));
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Numbers
    ctx.font = `${size * 0.06}px sans-serif`;
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) {
      const angle = (i * Math.PI) / 6 - Math.PI / 2;
      const numR = radius - 45;
      ctx.fillText(i.toString(), center + numR * Math.cos(angle), center + numR * Math.sin(angle));
    }

    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const ms = time.getMilliseconds();

    // Hour hand
    const hourAngle = ((hours + minutes / 60) * Math.PI) / 6 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + radius * 0.5 * Math.cos(hourAngle), center + radius * 0.5 * Math.sin(hourAngle));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Minute hand
    const minuteAngle = ((minutes + seconds / 60) * Math.PI) / 30 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + radius * 0.7 * Math.cos(minuteAngle), center + radius * 0.7 * Math.sin(minuteAngle));
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Second hand
    const secondAngle = ((seconds + ms / 1000) * Math.PI) / 30 - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(center - 20 * Math.cos(secondAngle), center - 20 * Math.sin(secondAngle));
    ctx.lineTo(center + radius * 0.8 * Math.cos(secondAngle), center + radius * 0.8 * Math.sin(secondAngle));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(center, center, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  }, [time]);

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
      className={`flex flex-col items-center justify-center min-h-[80vh] ${isFullscreen ? 'fullscreen-mode' : ''}`}
      style={{ background: '#000000' }}
    >
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#1a1a1a', color: '#ffffff', border: '1px solid #333' }}
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
      </div>

      <canvas ref={canvasRef} className="max-w-full" style={{ maxWidth: '400px', maxHeight: '400px' }} />

      <div className="mt-6 text-center">
        <p style={{ color: '#888888', fontSize: '1.2rem', fontFamily: 'monospace' }}>
          {time.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
