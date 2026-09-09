import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../components/Shared';

const ColorPicker: React.FC = () => {
  const [color, setColor] = useState('#3b82f6');
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState('');

  const hex = color;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const rgb = `rgb(${r}, ${g}, ${b})`;

  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r / 255) h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g / 255) h = ((b / 255 - r / 255) / d + 2) / 6;
    else h = ((r / 255 - g / 255) / d + 4) / 6;
  }
  const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

  const copy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  const addToHistory = () => {
    if (!history.includes(color)) setHistory(prev => [color, ...prev].slice(0, 12));
  };

  useEffect(() => { addToHistory(); }, [color]);

  const values = [
    { label: 'HEX', value: hex.toUpperCase() },
    { label: 'RGB', value: rgb },
    { label: 'HSL', value: hsl },
    { label: 'RGBA', value: `rgba(${r}, ${g}, ${b}, 1)` },
  ];

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-eye-dropper" title="Color Picker" description="Pick colors in HEX, RGB, HSL" color="#10b981" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="w-full h-48 rounded-xl border overflow-hidden" style={{ background: color, borderColor: 'var(--border-color)' }} />
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>R</label>
              <input type="number" min="0" max="255" value={r} onChange={e => {
                const v = Math.min(255, Math.max(0, +e.target.value));
                setColor(`#${v.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
              }} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>G</label>
              <input type="number" min="0" max="255" value={g} onChange={e => {
                const v = Math.min(255, Math.max(0, +e.target.value));
                setColor(`#${r.toString(16).padStart(2,'0')}${v.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
              }} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>B</label>
              <input type="number" min="0" max="255" value={b} onChange={e => {
                const v = Math.min(255, Math.max(0, +e.target.value));
                setColor(`#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${v.toString(16).padStart(2,'0')}`);
              }} className="input-field text-sm" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {values.map(v => (
            <div key={v.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{v.label}</span>
                <p className="font-mono text-sm" style={{ color: 'var(--text-primary)' }}>{v.value}</p>
              </div>
              <button onClick={() => copy(v.value, v.label)} className="px-3 py-1.5 rounded text-xs" style={{ background: copied === v.label ? '#10b981' : 'var(--accent)', color: 'white' }}>
                {copied === v.label ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          ))}
          {history.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>History</p>
              <div className="flex flex-wrap gap-2">
                {history.map((c, i) => (
                  <button key={i} onClick={() => setColor(c)} className="w-8 h-8 rounded-lg border" style={{ background: c, borderColor: 'var(--border-color)' }} title={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;
