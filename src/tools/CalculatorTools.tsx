import React, { useState, useMemo } from 'react';
import { ToolHeader } from '../components/Shared';

// ── BMI Calculator ──
export const BmiCalculator: React.FC = () => {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');
  const bmi = useMemo(() => {
    if (unit === 'metric') return weight / ((height / 100) ** 2);
    return (weight * 703) / (height ** 2);
  }, [weight, height, unit]);
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const color = bmi < 18.5 ? '#3b82f6' : bmi < 25 ? '#10b981' : bmi < 30 ? '#f59e0b' : '#ef4444';
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-weight" title="BMI Calculator" description="Calculate Body Mass Index" color="#3b82f6" />
      <div className="flex gap-2 mb-4">
        {(['metric', 'imperial'] as const).map(u => (
          <button key={u} onClick={() => setUnit(u)} className="px-4 py-2 rounded-lg text-sm capitalize"
            style={{ background: unit === u ? 'var(--accent)' : 'var(--bg-tertiary)', color: unit === u ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{u}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Weight ({unit === 'metric' ? 'kg' : 'lbs'})</label><input type="number" value={weight} onChange={e => setWeight(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Height ({unit === 'metric' ? 'cm' : 'inches'})</label><input type="number" value={height} onChange={e => setHeight(+e.target.value)} className="input-field" /></div>
      </div>
      <div className="mt-4 p-6 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Your BMI</p>
        <p className="text-4xl font-bold mt-1" style={{ color }}>{bmi.toFixed(1)}</p>
        <p className="text-sm mt-1 font-medium" style={{ color }}>{cat}</p>
      </div>
    </div>
  );
};

// ── Age Calculator ──
export const AgeCalculator: React.FC = () => {
  const [dob, setDob] = useState('2000-01-01');
  const result = useMemo(() => {
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) { months--; days += 30; }
    if (months < 0) { years--; months += 12; }
    const totalDays = Math.floor((now.getTime() - birth.getTime()) / 86400000);
    return { years, months, days, totalDays, totalWeeks: Math.floor(totalDays / 7), totalHours: totalDays * 24 };
  }, [dob]);
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-birthday-cake" title="Age Calculator" description="Calculate exact age from birthdate" color="#3b82f6" />
      <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label><input type="date" value={dob} onChange={e => setDob(e.target.value)} className="input-field" /></div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Years</p><p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{result.years}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Months</p><p className="text-2xl font-bold" style={{ color: '#10b981' }}>{result.months}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Days</p><p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{result.days}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Days</p><p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{result.totalDays.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Weeks</p><p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{result.totalWeeks.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Hours</p><p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{result.totalHours.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// ── General Unit Converter ──
export const UnitConverter: React.FC = () => {
  const [category, setCategory] = useState('length');
  const [value, setValue] = useState(1);
  const [from, setFrom] = useState('m');
  const [to, setTo] = useState('ft');
  const units: Record<string, Record<string, number>> = {
    length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.34, yd: 0.9144, ft: 0.3048, in: 0.0254 },
    weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495, ton: 1000 },
    temperature: { celsius: 1, fahrenheit: 1, kelvin: 1 },
  };
  const result = useMemo(() => {
    if (category === 'temperature') {
      let c = value;
      if (from === 'fahrenheit') c = (value - 32) * 5 / 9;
      else if (from === 'kelvin') c = value - 273.15;
      if (to === 'fahrenheit') return c * 9 / 5 + 32;
      if (to === 'kelvin') return c + 273.15;
      return c;
    }
    const base = value * units[category][from];
    return base / units[category][to];
  }, [value, from, to, category]);

  const currentUnits = Object.keys(category === 'temperature' ? { celsius: 1, fahrenheit: 1, kelvin: 1 } : units[category]);

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-balance-scale" title="General Unit Converter" description="Convert length, weight, temperature" color="#3b82f6" />
      <div className="mb-4">
        <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
        <select value={category} onChange={e => { setCategory(e.target.value); setFrom(Object.keys(units[e.target.value] || { celsius: 1 })[0]); setTo(Object.keys(units[e.target.value] || { celsius: 1 })[1]); }} className="input-field">
          <option value="length">Length</option><option value="weight">Weight</option><option value="temperature">Temperature</option>
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Value</label><input type="number" value={value} onChange={e => setValue(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>From</label>
          <select value={from} onChange={e => setFrom(e.target.value)} className="input-field">{currentUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>To</label>
          <select value={to} onChange={e => setTo(e.target.value)} className="input-field">{currentUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
      </div>
      <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Result</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{result.toFixed(4)} {to}</p>
      </div>
    </div>
  );
};

// ── Data Storage Converter ──
export const StorageConverter: React.FC = () => {
  const [value, setValue] = useState(1);
  const [from, setFrom] = useState('GB');
  const units: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, PB: 1024 ** 5 };
  const [to, setTo] = useState('MB');
  const result = (value * units[from]) / units[to];
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-hdd" title="Data Storage Converter" description="Convert KB, MB, GB, TB" color="#3b82f6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Value</label><input type="number" value={value} onChange={e => setValue(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>From</label>
          <select value={from} onChange={e => setFrom(e.target.value)} className="input-field">{Object.keys(units).map(u => <option key={u}>{u}</option>)}</select></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>To</label>
          <select value={to} onChange={e => setTo(e.target.value)} className="input-field">{Object.keys(units).map(u => <option key={u}>{u}</option>)}</select></div>
      </div>
      <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Result</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{result.toLocaleString()} {to}</p>
      </div>
    </div>
  );
};

// ── Speed Converter ──
export const SpeedConverter: React.FC = () => {
  const [value, setValue] = useState(100);
  const [from, setFrom] = useState('Mbps');
  const units: Record<string, number> = { 'bps': 1, 'Kbps': 1000, 'Mbps': 1e6, 'Gbps': 1e9, 'B/s': 8, 'KB/s': 8000, 'MB/s': 8e6, 'GB/s': 8e9 };
  const [to, setTo] = useState('MB/s');
  const result = (value * units[from]) / units[to];
  return (
    <div className="tool-container">
      <ToolHeader icon="fa-tachometer-alt" title="Speed Converter" description="Convert Mbps to MB/s and more" color="#3b82f6" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Value</label><input type="number" value={value} onChange={e => setValue(+e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>From</label>
          <select value={from} onChange={e => setFrom(e.target.value)} className="input-field">{Object.keys(units).map(u => <option key={u}>{u}</option>)}</select></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>To</label>
          <select value={to} onChange={e => setTo(e.target.value)} className="input-field">{Object.keys(units).map(u => <option key={u}>{u}</option>)}</select></div>
      </div>
      <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Result</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--accent)' }}>{result.toFixed(4)} {to}</p>
      </div>
    </div>
  );
};
