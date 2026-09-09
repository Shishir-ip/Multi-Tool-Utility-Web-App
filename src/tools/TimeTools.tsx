import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ToolHeader, Button } from '../components/Shared';

// ── Pomodoro Timer ──
export const PomodoroTimer: React.FC = () => {
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [remaining, setRemaining] = useState(workMin * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = window.setInterval(() => setRemaining(r => r - 1), 1000);
    } else if (remaining === 0) {
      if (mode === 'work') { setSessions(s => s + 1); setMode('break'); setRemaining(breakMin * 60); }
      else { setMode('work'); setRemaining(workMin * 60); }
      try { const ctx = new AudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 880; gain.gain.setValueAtTime(0.3, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5); osc.start(); osc.stop(ctx.currentTime + 0.5); } catch {}
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, remaining]);

  const reset = () => { setRunning(false); setRemaining(mode === 'work' ? workMin * 60 : breakMin * 60); };
  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const total = mode === 'work' ? workMin * 60 : breakMin * 60;
  const pct = ((total - remaining) / total) * 100;

  return (
    <div className="tool-container" style={{ background: '#000', border: '1px solid #222' }}>
      <ToolHeader icon="fa-tomato" title="Pomodoro Timer" description="Focus timer with work/break cycles" color="#ef4444" />
      <div className="flex justify-center gap-2 mb-6">
        <button onClick={() => { setMode('work'); setRemaining(workMin * 60); setRunning(false); }}
          className="px-4 py-2 rounded-lg text-sm" style={{ background: mode === 'work' ? '#ef4444' : '#222', color: 'white' }}>Work ({workMin}m)</button>
        <button onClick={() => { setMode('break'); setRemaining(breakMin * 60); setRunning(false); }}
          className="px-4 py-2 rounded-lg text-sm" style={{ background: mode === 'break' ? '#10b981' : '#222', color: 'white' }}>Break ({breakMin}m)</button>
      </div>
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <svg width="200" height="200" className="transform -rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#222" strokeWidth="6" />
            <circle cx="100" cy="100" r="90" fill="none" stroke={mode === 'work' ? '#ef4444' : '#10b981'} strokeWidth="6"
              strokeDasharray={2 * Math.PI * 90} strokeDashoffset={2 * Math.PI * 90 * (1 - pct / 100)} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-4xl font-bold text-white">{mins}:{secs}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-3 mb-4">
        <button onClick={() => setRunning(!running)} className="px-6 py-3 rounded-xl font-semibold" style={{ background: running ? '#f59e0b' : '#10b981', color: 'white' }}>
          <i className={`fas ${running ? 'fa-pause' : 'fa-play'} mr-2`}></i>{running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="px-6 py-3 rounded-xl font-semibold" style={{ background: '#333', color: 'white', border: '1px solid #555' }}>
          <i className="fas fa-redo mr-2"></i>Reset
        </button>
      </div>
      <p className="text-center text-sm" style={{ color: '#888' }}>Sessions completed: <strong className="text-white">{sessions}</strong></p>
    </div>
  );
};

// ── Time Zone Converter ──
export const TimezoneConverter: React.FC = () => {
  const zones = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Dhaka', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
  const [sourceTz, setSourceTz] = useState('UTC');
  const [time, setTime] = useState(new Date().toISOString().slice(0, 16));
  const conversions = useMemo(() => {
    const d = new Date(time);
    return zones.filter(z => z !== sourceTz).map(z => ({
      zone: z,
      time: d.toLocaleString('en-US', { timeZone: z, hour: '2-digit', minute: '2-digit', hour12: true, weekday: 'short', month: 'short', day: 'numeric' })
    }));
  }, [time, sourceTz]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-globe" title="Time Zone Converter" description="Convert time between zones" color="#ec4899" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Source Time Zone</label>
          <select value={sourceTz} onChange={e => setSourceTz(e.target.value)} className="input-field">{zones.map(z => <option key={z}>{z}</option>)}</select></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Date & Time</label>
          <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} className="input-field" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {conversions.map(c => (
          <div key={c.zone} className="p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.zone}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Date Calculator ──
export const DateCalculator: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState(30);
  const [op, setOp] = useState<'add' | 'sub'>('add');
  const result = useMemo(() => {
    const d = new Date(date);
    d.setDate(d.getDate() + (op === 'add' ? days : -days));
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [date, days, op]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-calendar-plus" title="Date Calculator" description="Add/subtract days from a date" color="#ec4899" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Start Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Days</label><input type="number" value={days} onChange={e => setDays(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Operation</label>
          <select value={op} onChange={e => setOp(e.target.value as any)} className="input-field"><option value="add">Add Days</option><option value="sub">Subtract Days</option></select></div>
      </div>
      <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Result</p>
        <p className="text-lg font-bold mt-1" style={{ color: 'var(--accent)' }}>{result}</p>
      </div>
    </div>
  );
};

// ── Business Days Calculator ──
export const BusinessDays: React.FC = () => {
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const days = useMemo(() => {
    let count = 0;
    const d = new Date(start);
    const e = new Date(end);
    while (d <= e) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  }, [start, end]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-briefcase" title="Business Days Calculator" description="Count business days between dates" color="#ec4899" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Start Date</label><input type="date" value={start} onChange={e => setStart(e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>End Date</label><input type="date" value={end} onChange={e => setEnd(e.target.value)} className="input-field" /></div>
      </div>
      <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Business Days (Mon-Fri)</p>
        <p className="text-3xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{days}</p>
      </div>
    </div>
  );
};

// ── Days Between Calculator ──
export const DaysBetween: React.FC = () => {
  const [d1, setD1] = useState(new Date().toISOString().slice(0, 10));
  const [d2, setD2] = useState(new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10));
  const result = useMemo(() => {
    const a = new Date(d1), b = new Date(d2);
    const diff = Math.abs(b.getTime() - a.getTime());
    const days = Math.floor(diff / 86400000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.44);
    return { days, weeks, months, hours: days * 24 };
  }, [d1, d2]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-calendar-minus" title="Days Between Calculator" description="Count days between two dates" color="#ec4899" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Start Date</label><input type="date" value={d1} onChange={e => setD1(e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>End Date</label><input type="date" value={d2} onChange={e => setD2(e.target.value)} className="input-field" /></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Days</p><p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{result.days}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Weeks</p><p className="text-xl font-bold" style={{ color: '#10b981' }}>{result.weeks}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Months</p><p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{result.months}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hours</p><p className="text-xl font-bold" style={{ color: '#8b5cf6' }}>{result.hours}</p>
        </div>
      </div>
    </div>
  );
};

// ── Calendar Generator ──
export const CalendarGenerator: React.FC = () => {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext('2d')!;
    c.width = 700; c.height = 600;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    ctx.fillStyle = '#000'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${monthNames[month]} ${year}`, 350, 50);
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#666';
    days.forEach((d, i) => ctx.fillText(d, 50 + i * 100, 90));
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#000';
    for (let d = 1; d <= total; d++) {
      const pos = first + d - 1;
      const col = pos % 7, row = Math.floor(pos / 7);
      const x = 50 + col * 100, y = 130 + row * 70;
      ctx.strokeStyle = '#ddd'; ctx.strokeRect(x - 40, y - 20, 80, 60);
      if (new Date().toDateString() === new Date(year, month, d).toDateString()) {
        ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(x, y + 5, 18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
      } else { ctx.fillStyle = '#000'; }
      ctx.fillText(d.toString(), x, y + 10);
    }
  }, [month, year]);

  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `calendar-${year}-${month + 1}.png`; a.click();
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-calendar-alt" title="Calendar Generator" description="Generate printable calendars" color="#ec4899" />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Month</label>
          <select value={month} onChange={e => setMonth(+e.target.value)} className="input-field w-32">
            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Year</label>
          <input type="number" value={year} onChange={e => setYear(+e.target.value)} className="input-field w-28" /></div>
        <Button onClick={download} icon="fa-download">Download PNG</Button>
      </div>
      <canvas ref={canvasRef} className="max-w-full border rounded-lg mx-auto" style={{ borderColor: 'var(--border-color)' }} />
    </div>
  );
};
