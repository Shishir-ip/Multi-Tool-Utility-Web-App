import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ToolHeader, DropZone, Button } from '../components/Shared';
import QRCode from 'qrcode';

// ── Wi-Fi QR Generator ──
export const WifiQr: React.FC = () => {
  const [ssid, setSsid] = useState('MyNetwork');
  const [password, setPassword] = useState('');
  const [encryption, setEncryption] = useState('WPA');
  const [hidden, setHidden] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const str = `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
    QRCode.toCanvas(canvasRef.current, str, { width: 280, margin: 2 }).catch(() => {});
  }, [ssid, password, encryption, hidden]);
  const download = () => {
    if (!canvasRef.current) return;
    const a = document.createElement('a'); a.href = canvasRef.current.toDataURL('image/png'); a.download = 'wifi-qr.png'; a.click();
  };
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-wifi" title="Wi-Fi QR Generator" description="Generate Wi-Fi QR codes for easy sharing" color="#6366f1" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Network Name (SSID)</label><input value={ssid} onChange={e => setSsid(e.target.value)} className="input-field" /></div>
          <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Password</label><input type="text" value={password} onChange={e => setPassword(e.target.value)} className="input-field" /></div>
          <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Encryption</label>
            <select value={encryption} onChange={e => setEncryption(e.target.value)} className="input-field"><option>WPA</option><option>WEP</option><option>nopass</option></select></div>
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Hidden network</label>
          <Button onClick={download} icon="fa-download">Download QR</Button>
        </div>
        <div className="flex items-center justify-center"><canvas ref={canvasRef} className="rounded-lg max-w-full" /></div>
      </div>
    </div>
  );
};

// ── Password Generator ──
export const PasswordGenerator: React.FC = () => {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const generate = () => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';
    let pwd = '';
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    for (let i = 0; i < length; i++) pwd += chars[arr[i] % chars.length];
    setPassword(pwd);
  };
  useEffect(() => { generate(); }, [length, upper, lower, numbers, symbols]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-key" title="Strong Password Generator" description="Generate secure passwords" color="#6366f1" />
      <div className="p-4 rounded-lg mb-4 flex items-center gap-3" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <code className="flex-1 font-mono text-lg break-all" style={{ color: 'var(--text-primary)' }}>{password}</code>
        <button onClick={() => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="px-3 py-1.5 rounded text-xs flex-shrink-0" style={{ background: copied ? '#10b981' : 'var(--accent)', color: 'white' }}>{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Length: {length}</label>
        <input type="range" min="4" max="64" value={length} onChange={e => setLength(+e.target.value)} className="w-full" /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {[{ label: 'Uppercase', val: upper, set: setUpper }, { label: 'Lowercase', val: lower, set: setLower }, { label: 'Numbers', val: numbers, set: setNumbers }, { label: 'Symbols', val: symbols, set: setSymbols }].map(o => (
          <label key={o.label} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <input type="checkbox" checked={o.val} onChange={e => o.set(e.target.checked)} />
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{o.label}</span>
          </label>
        ))}
      </div>
      <Button onClick={generate} icon="fa-refresh" variant="secondary">Regenerate</Button>
    </div>
  );
};

// ── Password Strength Checker ──
export const PasswordChecker: React.FC = () => {
  const [password, setPassword] = useState('');
  const check = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong', 'Excellent'];
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
    return { score, label: labels[score], color: colors[score], pct: (score / 5) * 100 };
  }, [password]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-shield-alt" title="Password Strength Checker" description="Check password strength" color="#6366f1" />
      <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Enter Password</label>
        <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="Type a password..." /></div>
      {password && (
        <div className="mt-4 space-y-3">
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${check.pct}%`, background: check.color }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: check.color }}>{check.label}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{check.score}/5</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[{ label: '8+ chars', ok: password.length >= 8 }, { label: '12+ chars', ok: password.length >= 12 }, { label: 'Mixed case', ok: /[a-z]/.test(password) && /[A-Z]/.test(password) }, { label: 'Numbers', ok: /\d/.test(password) }, { label: 'Symbols', ok: /[^a-zA-Z0-9]/.test(password) }].map(c => (
              <div key={c.label} className="p-2 rounded-lg flex items-center gap-2 text-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: c.ok ? '#10b981' : 'var(--text-muted)' }}>
                <i className={`fas ${c.ok ? 'fa-check-circle' : 'fa-times-circle'}`}></i>{c.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Bulk File Renamer ──
export const BulkRenamer: React.FC = () => {
  const [files, setFiles] = useState<{ name: string; newName: string }[]>([]);
  const [prefix, setPrefix] = useState('');
  const [pattern, setPattern] = useState('{n}');
  const handleFiles = (fl: FileList) => {
    setFiles(Array.from(fl).map((f, i) => ({ name: f.name, newName: `${prefix}${pattern.replace('{n}', String(i + 1).padStart(3, '0')).replace('{name}', f.name.replace(/\.[^.]+$/, ''))}${f.name.match(/\.[^.]+$/)?.[0] || ''}` })));
  };
  useEffect(() => {
    setFiles(prev => prev.map((f, i) => ({ ...f, newName: `${prefix}${pattern.replace('{n}', String(i + 1).padStart(3, '0')).replace('{name}', f.name.replace(/\.[^.]+$/, ''))}${f.name.match(/\.[^.]+$/)?.[0] || ''}` })));
  }, [prefix, pattern]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-edit" title="Bulk File Renamer" description="Rename multiple files at once" color="#6366f1" />
      <DropZone onFiles={handleFiles} multiple icon="fa-files" title="Drop files here" subtitle="Add files to rename" />
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Prefix</label><input value={prefix} onChange={e => setPrefix(e.target.value)} className="input-field" placeholder="photo_" /></div>
            <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Pattern ({'{n}'}=number, {'{name}'}=original)</label><input value={pattern} onChange={e => setPattern(e.target.value)} className="input-field" /></div>
          </div>
          <div className="max-h-64 overflow-auto space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded text-sm" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>{f.name}</span>
                <i className="fas fa-arrow-right text-xs" style={{ color: 'var(--text-muted)' }}></i>
                <span className="truncate flex-1 font-medium" style={{ color: 'var(--accent)' }}>{f.newName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── File Extension Changer ──
export const ExtensionChanger: React.FC = () => {
  const [files, setFiles] = useState<{ name: string; newName: string }[]>([]);
  const [newExt, setNewExt] = useState('.txt');
  const handleFiles = (fl: FileList) => {
    setFiles(Array.from(fl).map(f => ({ name: f.name, newName: f.name.replace(/\.[^.]+$/, newExt) })));
  };
  useEffect(() => { setFiles(prev => prev.map(f => ({ ...f, newName: f.name.replace(/\.[^.]+$/, newExt) }))); }, [newExt]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-signature" title="File Extension Changer" description="Change file extensions in bulk" color="#6366f1" />
      <DropZone onFiles={handleFiles} multiple icon="fa-file" title="Drop files here" subtitle="Select files to change extensions" />
      {files.length > 0 && (
        <div className="mt-4 space-y-3">
          <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>New Extension</label>
            <select value={newExt} onChange={e => setNewExt(e.target.value)} className="input-field w-40">
              {['.txt', '.md', '.csv', '.json', '.html', '.css', '.js', '.png', '.jpg', '.pdf'].map(e => <option key={e}>{e}</option>)}
            </select></div>
          <div className="max-h-64 overflow-auto space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded text-sm" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>{f.name}</span>
                <i className="fas fa-arrow-right text-xs" style={{ color: 'var(--text-muted)' }}></i>
                <span className="truncate flex-1 font-medium" style={{ color: 'var(--accent)' }}>{f.newName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Random Number Generator ──
export const RandomNumber: React.FC = () => {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(1);
  const [unique, setUnique] = useState(false);
  const [results, setResults] = useState<number[]>([]);
  const generate = () => {
    if (unique && max - min + 1 < count) { alert('Range too small for unique numbers'); return; }
    const nums: number[] = [];
    const pool = new Set<number>();
    while (nums.length < count) {
      const n = Math.floor(Math.random() * (max - min + 1)) + min;
      if (unique) { if (!pool.has(n)) { pool.add(n); nums.push(n); } }
      else nums.push(n);
    }
    setResults(nums);
  };
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-dice" title="Random Number Generator" description="Generate random numbers" color="#6366f1" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Min</label><input type="number" value={min} onChange={e => setMin(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Max</label><input type="number" value={max} onChange={e => setMax(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Count</label><input type="number" min="1" max="100" value={count} onChange={e => setCount(+e.target.value)} className="input-field" /></div>
        <div className="flex items-end"><label className="flex items-center gap-2 p-2 text-sm" style={{ color: 'var(--text-secondary)' }}><input type="checkbox" checked={unique} onChange={e => setUnique(e.target.checked)} /> Unique</label></div>
      </div>
      <Button onClick={generate} icon="fa-dice" variant="secondary">Generate</Button>
      {results.length > 0 && (
        <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-wrap gap-2">{results.map((n, i) => <span key={i} className="px-3 py-1.5 rounded-lg font-mono text-sm" style={{ background: 'var(--accent)', color: 'white' }}>{n}</span>)}</div>
        </div>
      )}
    </div>
  );
};

// ── Random Choice Picker ──
export const RandomChoice: React.FC = () => {
  const [items, setItems] = useState('');
  const [result, setResult] = useState('');
  const [spinning, setSpinning] = useState(false);
  const pick = () => {
    const list = items.split('\n').map(s => s.trim()).filter(Boolean);
    if (list.length === 0) return;
    setSpinning(true);
    let count = 0;
    const interval = setInterval(() => {
      setResult(list[Math.floor(Math.random() * list.length)]);
      count++;
      if (count > 15) { clearInterval(interval); setSpinning(false); }
    }, 80);
  };
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-list" title="Random Choice Picker" description="Pick random items from a list" color="#6366f1" />
      <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Enter options (one per line)</label>
        <textarea value={items} onChange={e => setItems(e.target.value)} className="input-field" style={{ minHeight: '150px', resize: 'vertical' }} placeholder="Pizza&#10;Burger&#10;Sushi&#10;Pasta" /></div>
      <Button onClick={pick} icon={spinning ? 'fa-spinner fa-spin' : 'fa-random'} variant="secondary" disabled={spinning}>Pick Random</Button>
      {result && (
        <div className="mt-4 p-6 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Selected</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{result}</p>
        </div>
      )}
    </div>
  );
};

// ── Dice Roller ──
export const DiceRoller: React.FC = () => {
  const [count, setCount] = useState(2);
  const [sides, setSides] = useState(6);
  const [results, setResults] = useState<number[]>([]);
  const [rolling, setRolling] = useState(false);
  const roll = () => {
    setRolling(true);
    let c = 0;
    const interval = setInterval(() => {
      setResults(Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1));
      c++;
      if (c > 10) { clearInterval(interval); setRolling(false); }
    }, 60);
  };
  const total = results.reduce((a, b) => a + b, 0);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-dice-d6" title="Dice Roller" description="Roll virtual dice" color="#6366f1" />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Number of Dice</label><input type="number" min="1" max="10" value={count} onChange={e => setCount(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Sides</label>
          <select value={sides} onChange={e => setSides(+e.target.value)} className="input-field"><option value="4">D4</option><option value="6">D6</option><option value="8">D8</option><option value="10">D10</option><option value="12">D12</option><option value="20">D20</option><option value="100">D100</option></select></div>
      </div>
      <Button onClick={roll} icon={rolling ? 'fa-spinner fa-spin' : 'fa-dice'} variant="secondary" disabled={rolling}>Roll!</Button>
      {results.length > 0 && (
        <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div className="flex flex-wrap justify-center gap-2 mb-2">{results.map((n, i) => <span key={i} className="w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg" style={{ background: 'var(--accent)', color: 'white' }}>{n}</span>)}</div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total: <strong className="text-xl" style={{ color: 'var(--text-primary)' }}>{total}</strong></p>
        </div>
      )}
    </div>
  );
};

// ── Coin Flip ──
export const CoinFlip: React.FC = () => {
  const [result, setResult] = useState<'heads' | 'tails' | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [stats, setStats] = useState({ heads: 0, tails: 0 });
  const flip = () => {
    setFlipping(true);
    let c = 0;
    const interval = setInterval(() => {
      setResult(Math.random() > 0.5 ? 'heads' : 'tails');
      c++;
      if (c > 12) {
        clearInterval(interval);
        setFlipping(false);
        setStats(prev => ({ ...prev, [result || 'heads']: prev[result || 'heads'] + 1 }));
      }
    }, 80);
  };
  const total = stats.heads + stats.tails;
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-coins" title="Coin Flip" description="Flip a virtual coin" color="#6366f1" />
      <div className="text-center py-8">
        <div className={`inline-block w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mb-6 transition-transform ${flipping ? 'animate-spin' : ''}`}
          style={{ background: result === 'heads' ? '#f59e0b' : result === 'tails' ? '#6b7280' : 'var(--bg-tertiary)', color: 'white', border: '4px solid var(--border-color)' }}>
          {result ? (result === 'heads' ? 'H' : 'T') : '?'}
        </div>
        <div>
          <Button onClick={flip} icon={flipping ? 'fa-spinner fa-spin' : 'fa-coins'} disabled={flipping}>Flip Coin</Button>
        </div>
        {total > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Heads</p><p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{stats.heads}</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p><p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{total}</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tails</p><p className="text-xl font-bold" style={{ color: '#6b7280' }}>{stats.tails}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
