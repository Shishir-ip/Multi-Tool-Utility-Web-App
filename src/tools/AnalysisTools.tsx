import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ToolHeader, Button } from '../components/Shared';
import { jsPDF } from 'jspdf';

// ── Unit Price Compare ──
export const UnitPriceCompare: React.FC = () => {
  const [items, setItems] = useState([
    { name: 'Item 1', price: 10, quantity: 500, unit: 'g' },
    { name: 'Item 2', price: 15, quantity: 1, unit: 'kg' }
  ]);

  const unitConversions: Record<string, number> = {
    'g': 1, 'kg': 1000, 'oz': 28.35, 'lb': 453.59,
    'ml': 1, 'l': 1000, 'pcs': 1
  };

  const addItem = () => setItems([...items, { name: `Item ${items.length + 1}`, price: 0, quantity: 1, unit: 'pcs' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: any) => setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const results = useMemo(() => {
    return items.map(item => {
      const baseQuantity = item.quantity * (unitConversions[item.unit] || 1);
      const unitPrice = baseQuantity > 0 ? item.price / baseQuantity : 0;
      return { ...item, unitPrice, baseQuantity };
    }).sort((a, b) => a.unitPrice - b.unitPrice);
  }, [items]);

  const bestValue = results[0];
  const worstValue = results[results.length - 1];
  const savings = worstValue.unitPrice > 0 ? ((worstValue.unitPrice - bestValue.unitPrice) / worstValue.unitPrice * 100) : 0;

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-tags" title="Unit Price Compare" description="Compare best value per unit" color="#3b82f6" />
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <input type="text" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Name" className="input-field flex-1 min-w-[100px] text-sm" />
            <input type="number" value={item.price} onChange={e => updateItem(i, 'price', +e.target.value)} placeholder="Price" className="input-field w-24 text-sm" />
            <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', +e.target.value)} placeholder="Qty" className="input-field w-20 text-sm" />
            <select value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)} className="input-field w-20 text-sm">
              <option value="g">g</option><option value="kg">kg</option><option value="oz">oz</option><option value="lb">lb</option>
              <option value="ml">ml</option><option value="l">L</option><option value="pcs">pcs</option>
            </select>
            {items.length > 2 && <button onClick={() => removeItem(i)} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>}
          </div>
        ))}
      </div>
      <Button onClick={addItem} icon="fa-plus" variant="secondary">Add Item</Button>
      <div className="mt-4 space-y-2">
        {results.map((item, i) => (
          <div key={i} className="p-3 rounded-lg flex justify-between items-center" style={{ background: i === 0 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)', border: `2px solid ${i === 0 ? '#10b981' : 'var(--border-color)'}` }}>
            <div>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>${item.unitPrice.toFixed(4)} per {item.unit}</p>
            </div>
            {i === 0 && <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: '#10b981', color: 'white' }}>BEST VALUE</span>}
          </div>
        ))}
      </div>
      {results.length > 1 && (
        <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Save <strong className="text-2xl" style={{ color: '#10b981' }}>{savings.toFixed(1)}%</strong> by choosing {bestValue.name}
          </p>
        </div>
      )}
    </div>
  );
};

// ── Aspect Ratio Calculator ──
export const AspectRatioCalc: React.FC = () => {
  const [ratio, setRatio] = useState('16:9');
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [customRatio, setCustomRatio] = useState('16:9');

  const presets = ['16:9', '4:3', '21:9', '1:1', '9:16', '3:2'];

  const updateFromWidth = (w: number) => {
    setWidth(w);
    const [rw, rh] = (ratio === 'custom' ? customRatio : ratio).split(':').map(Number);
    setHeight(Math.round(w * rh / rw));
  };

  const updateFromHeight = (h: number) => {
    setHeight(h);
    const [rw, rh] = (ratio === 'custom' ? customRatio : ratio).split(':').map(Number);
    setWidth(Math.round(h * rw / rh));
  };

  const setPreset = (r: string) => {
    setRatio(r);
    const [rw, rh] = r.split(':').map(Number);
    setHeight(Math.round(width * rh / rw));
  };

  const scale = Math.min(300 / width, 200 / height, 1);

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-desktop" title="Aspect Ratio Calculator" description="Calculate screen dimensions" color="#3b82f6" />
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map(r => (
          <button key={r} onClick={() => setPreset(r)} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: ratio === r ? 'var(--accent)' : 'var(--bg-tertiary)', color: ratio === r ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{r}</button>
        ))}
        <button onClick={() => setRatio('custom')} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: ratio === 'custom' ? 'var(--accent)' : 'var(--bg-tertiary)', color: ratio === 'custom' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>Custom</button>
      </div>
      {ratio === 'custom' && (
        <div className="mb-4">
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Custom Ratio (W:H)</label>
          <input value={customRatio} onChange={e => setCustomRatio(e.target.value)} className="input-field w-32" placeholder="16:9" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Width (px)</label>
          <input type="number" value={width} onChange={e => updateFromWidth(+e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Height (px)</label>
          <input type="number" value={height} onChange={e => updateFromHeight(+e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-center">
        <div className="border-2 rounded" style={{ width: width * scale, height: height * scale, borderColor: 'var(--accent)', background: 'rgba(59, 130, 246, 0.1)' }}>
          <div className="w-full h-full flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
            {width} × {height}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Readability Analyzer ──
export const ReadabilityAnalyzer: React.FC = () => {
  const [text, setText] = useState('');

  const countSyllables = (word: string) => {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  const stats = useMemo(() => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const words = text.split(/\s+/).filter(w => w.trim()).length;
    const syllables = text.split(/\s+/).filter(w => w.trim()).reduce((sum, w) => sum + countSyllables(w), 0);
    const complexWords = text.split(/\s+/).filter(w => countSyllables(w) >= 3).length;
    const characters = text.replace(/\s/g, '').length;

    const fleschEase = sentences > 0 && words > 0 ? 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words) : 0;
    const fleschGrade = sentences > 0 && words > 0 ? 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59 : 0;
    const fogIndex = sentences > 0 && words > 0 ? 0.4 * ((words / sentences) + 100 * (complexWords / words)) : 0;
    const colemanLiau = sentences > 0 && words > 0 ? 0.0588 * (characters / words) * 100 - 0.296 * (sentences / words) * 100 - 15.8 : 0;

    const getDifficulty = (score: number) => {
      if (score >= 90) return 'Very Easy';
      if (score >= 80) return 'Easy';
      if (score >= 70) return 'Fairly Easy';
      if (score >= 60) return 'Standard';
      if (score >= 50) return 'Fairly Difficult';
      if (score >= 30) return 'Difficult';
      return 'Very Difficult';
    };

    return {
      sentences, words, syllables, complexWords, characters,
      fleschEase: fleschEase.toFixed(1),
      fleschGrade: fleschGrade.toFixed(1),
      fogIndex: fogIndex.toFixed(1),
      colemanLiau: colemanLiau.toFixed(1),
      difficulty: getDifficulty(fleschEase)
    };
  }, [text]);

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-book-open" title="Readability Analyzer" description="Analyze text readability scores" color="#f59e0b" />
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste your text here..." className="input-field mb-4" style={{ minHeight: '200px', resize: 'vertical' }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sentences</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.sentences}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Words</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.words}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Syllables</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.syllables}</p>
        </div>
        <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Complex Words</p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.complexWords}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Flesch Reading Ease</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.fleschEase}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{stats.difficulty}</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Flesch-Kincaid Grade</p>
          <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{stats.fleschGrade}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Grade Level</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gunning Fog Index</p>
          <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.fogIndex}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Years of Education</p>
        </div>
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Coleman-Liau Index</p>
          <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{stats.colemanLiau}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Grade Level</p>
        </div>
      </div>
    </div>
  );
};

// ── Printable Paper Generator ──
export const PaperGenerator: React.FC = () => {
  const [style, setStyle] = useState('lined');
  const [spacing, setSpacing] = useState(8);
  const [margin, setMargin] = useState(20);
  const [opacity, setOpacity] = useState(0.3);
  const [color, setColor] = useState('#3b82f6');
  const [pageSize, setPageSize] = useState('a4');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = pageSize === 'a4' ? 794 : 816;
    const height = pageSize === 'a4' ? 1123 : 1056;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = color;
    ctx.globalAlpha = opacity;
    ctx.lineWidth = 1;

    if (style === 'lined') {
      for (let y = margin; y < height - margin; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }
    } else if (style === 'grid') {
      for (let x = margin; x < width - margin; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, height - margin);
        ctx.stroke();
      }
      for (let y = margin; y < height - margin; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(width - margin, y);
        ctx.stroke();
      }
    } else if (style === 'dot') {
      for (let x = margin; x < width - margin; x += spacing) {
        for (let y = margin; y < height - margin; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (style === 'isometric') {
      const h = spacing * Math.sqrt(3) / 2;
      for (let y = margin; y < height - margin; y += h) {
        for (let x = margin; x < width - margin; x += spacing) {
          const offset = (Math.floor(y / h) % 2) * (spacing / 2);
          ctx.beginPath();
          ctx.arc(x + offset, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (style === 'music') {
      const staffHeight = 40;
      const lineSpacing = 8;
      for (let y = margin; y < height - margin; y += staffHeight) {
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(margin, y + i * lineSpacing);
          ctx.lineTo(width - margin, y + i * lineSpacing);
          ctx.stroke();
        }
      }
    }

    ctx.globalAlpha = 1;
  }, [style, spacing, margin, opacity, color, pageSize]);

  const downloadPdf = () => {
    if (!canvasRef.current) return;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pageSize === 'a4' ? 'a4' : 'letter'
    });
    const imgData = canvasRef.current.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${style}-paper.pdf`);
  };

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-file-lines" title="Printable Paper Generator" description="Generate lined, grid, or dot paper" color="#f59e0b" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Style</label>
          <select value={style} onChange={e => setStyle(e.target.value)} className="input-field">
            <option value="lined">Lined / Ruled</option>
            <option value="grid">Grid / Graph</option>
            <option value="dot">Dot Grid</option>
            <option value="isometric">Isometric</option>
            <option value="music">Music Staff</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Page Size</label>
          <select value={pageSize} onChange={e => setPageSize(e.target.value)} className="input-field">
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Spacing: {spacing}mm</label>
          <input type="range" min="4" max="20" value={spacing} onChange={e => setSpacing(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Margin: {margin}mm</label>
          <input type="range" min="10" max="40" value={margin} onChange={e => setMargin(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Opacity: {Math.round(opacity * 100)}%</label>
          <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(+e.target.value)} className="w-full" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Color</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 rounded cursor-pointer border" style={{ borderColor: 'var(--border-color)' }} />
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full max-w-md mx-auto border rounded-lg mb-4" style={{ borderColor: 'var(--border-color)' }} />
      <Button onClick={downloadPdf} icon="fa-download">Download PDF</Button>
    </div>
  );
};
