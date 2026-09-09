import React, { useState, useMemo } from 'react';
import { ToolHeader, Button } from '../components/Shared';

// ── GPA Calculator ──
export const GpaCalculator: React.FC = () => {
  const [courses, setCourses] = useState([{ name: '', credit: 3, grade: 4 }]);
  const gradeScale = [
    { label: 'A+', value: 4.0 }, { label: 'A', value: 4.0 }, { label: 'A-', value: 3.7 },
    { label: 'B+', value: 3.3 }, { label: 'B', value: 3.0 }, { label: 'B-', value: 2.7 },
    { label: 'C+', value: 2.3 }, { label: 'C', value: 2.0 }, { label: 'C-', value: 1.7 },
    { label: 'D', value: 1.0 }, { label: 'F', value: 0.0 },
  ];
  const addCourse = () => setCourses(p => [...p, { name: '', credit: 3, grade: 4 }]);
  const removeCourse = (i: number) => setCourses(p => p.filter((_, idx) => idx !== i));
  const update = (i: number, field: string, val: any) => setCourses(p => p.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  const gpa = useMemo(() => {
    const totalCredits = courses.reduce((s, c) => s + c.credit, 0);
    const totalPoints = courses.reduce((s, c) => s + c.credit * c.grade, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  }, [courses]);

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-chart-line" title="GPA/CGPA Calculator" description="Calculate your GPA" color="#f59e0b" />
      <div className="space-y-2">
        {courses.map((c, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <input type="text" value={c.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Course" className="input-field flex-1 min-w-[100px] text-sm" />
            <input type="number" min="0" max="10" value={c.credit} onChange={e => update(i, 'credit', +e.target.value)} placeholder="Credits" className="input-field w-20 text-sm" />
            <select value={c.grade} onChange={e => update(i, 'grade', +e.target.value)} className="input-field w-24 text-sm">
              {gradeScale.map(g => <option key={g.value} value={g.value}>{g.label} ({g.value})</option>)}
            </select>
            <button onClick={() => removeCourse(i)} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button onClick={addCourse} icon="fa-plus" variant="secondary">Add Course</Button>
        <div className="ml-auto p-3 rounded-lg text-center" style={{ background: 'var(--accent)', color: 'white' }}>
          <p className="text-xs opacity-80">GPA</p>
          <p className="text-2xl font-bold">{gpa}</p>
        </div>
      </div>
    </div>
  );
};

// ── Marks Calculator ──
export const MarksCalculator: React.FC = () => {
  const [subjects, setSubjects] = useState([{ name: '', marks: 0, total: 100 }]);
  const add = () => setSubjects(p => [...p, { name: '', marks: 0, total: 100 }]);
  const remove = (i: number) => setSubjects(p => p.filter((_, idx) => idx !== i));
  const update = (i: number, field: string, val: any) => setSubjects(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const totalMarks = subjects.reduce((s, sub) => s + sub.marks, 0);
  const totalMax = subjects.reduce((s, sub) => s + sub.total, 0);
  const pct = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(2) : '0';

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-clipboard-check" title="Exam Marks Calculator" description="Calculate exam marks and percentages" color="#f59e0b" />
      <div className="space-y-2">
        {subjects.map((s, i) => (
          <div key={i} className="flex flex-wrap gap-2 items-center p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
            <input type="text" value={s.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Subject" className="input-field flex-1 min-w-[100px] text-sm" />
            <input type="number" value={s.marks} onChange={e => update(i, 'marks', +e.target.value)} placeholder="Marks" className="input-field w-24 text-sm" />
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <input type="number" value={s.total} onChange={e => update(i, 'total', +e.target.value)} placeholder="Total" className="input-field w-24 text-sm" />
            <button onClick={() => remove(i)} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button onClick={add} icon="fa-plus" variant="secondary">Add Subject</Button>
        <div className="ml-auto p-3 rounded-lg text-center" style={{ background: 'var(--accent)', color: 'white' }}>
          <p className="text-xs opacity-80">Total: {totalMarks}/{totalMax}</p>
          <p className="text-2xl font-bold">{pct}%</p>
        </div>
      </div>
    </div>
  );
};

// ── Attendance Calculator ──
export const AttendanceCalculator: React.FC = () => {
  const [totalClasses, setTotalClasses] = useState(100);
  const [attended, setAttended] = useState(75);
  const [target, setTarget] = useState(75);
  const currentPct = totalClasses > 0 ? ((attended / totalClasses) * 100).toFixed(1) : '0';
  const needed = Math.max(0, Math.ceil((target * totalClasses - 100 * attended) / (100 - target)));
  const canMiss = Math.max(0, Math.floor((100 * attended - target * totalClasses) / target));

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-calendar-check" title="Attendance Calculator" description="Track and calculate attendance" color="#f59e0b" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Total Classes</label>
          <input type="number" value={totalClasses} onChange={e => setTotalClasses(+e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Attended</label>
          <input type="number" value={attended} onChange={e => setAttended(+e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Target %</label>
          <input type="number" value={target} onChange={e => setTarget(+e.target.value)} className="input-field" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Attendance</p>
          <p className="text-2xl font-bold" style={{ color: +currentPct >= target ? '#10b981' : '#ef4444' }}>{currentPct}%</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Classes Needed to Reach {target}%</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{needed}</p>
        </div>
        <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Classes You Can Miss</p>
          <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{canMiss}</p>
        </div>
      </div>
    </div>
  );
};

// ── Citation Generator ──
export const CitationGenerator: React.FC = () => {
  const [format, setFormat] = useState<'APA' | 'MLA' | 'Chicago'>('APA');
  const [data, setData] = useState({ author: '', title: '', year: '', publisher: '', url: '' });
  const update = (field: string, val: string) => setData(p => ({ ...p, [field]: val }));
  const [copied, setCopied] = useState(false);
  const citation = useMemo(() => {
    const { author, title, year, publisher, url } = data;
    if (format === 'APA') return `${author} (${year}). ${title}. ${publisher}. ${url}`;
    if (format === 'MLA') return `${author}. "${title}." ${publisher}, ${year}. ${url}`;
    return `${author}. ${title}. ${publisher}, ${year}. ${url}`;
  }, [data, format]);

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-quote-left" title="Citation Generator" description="Generate APA/MLA/Chicago citations" color="#f59e0b" />
      <div className="flex gap-2 mb-4">
        {(['APA', 'MLA', 'Chicago'] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: format === f ? 'var(--accent)' : 'var(--bg-tertiary)', color: format === f ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}>{f}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Author</label><input value={data.author} onChange={e => update('author', e.target.value)} className="input-field" placeholder="Last, First" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Title</label><input value={data.title} onChange={e => update('title', e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Year</label><input value={data.year} onChange={e => update('year', e.target.value)} className="input-field" /></div>
        <div><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Publisher</label><input value={data.publisher} onChange={e => update('publisher', e.target.value)} className="input-field" /></div>
        <div className="sm:col-span-2"><label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>URL</label><input value={data.url} onChange={e => update('url', e.target.value)} className="input-field" /></div>
      </div>
      <div className="mt-4 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{format} Citation:</p>
        <p className="text-sm italic" style={{ color: 'var(--text-primary)' }}>{citation}</p>
        <button onClick={() => { navigator.clipboard.writeText(citation); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="mt-2 px-3 py-1 rounded text-xs" style={{ background: copied ? '#10b981' : 'var(--accent)', color: 'white' }}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

// ── Matrix Calculator ──
export const MatrixCalculator: React.FC = () => {
  const [size, setSize] = useState(2);
  const [matA, setMatA] = useState<number[][]>([[1, 2], [3, 4]]);
  const [matB, setMatB] = useState<number[][]>([[5, 6], [7, 8]]);
  const [op, setOp] = useState<'add' | 'sub' | 'mul' | 'det'>('add');
  const [result, setResult] = useState<number[][] | number | null>(null);

  const updateSize = (n: number) => {
    setSize(n);
    setMatA(Array.from({ length: n }, () => Array(n).fill(0)));
    setMatB(Array.from({ length: n }, () => Array(n).fill(0)));
  };

  const updateCell = (mat: 'A' | 'B', r: number, c: number, val: number) => {
    const setter = mat === 'A' ? setMatA : setMatB;
    setter(prev => prev.map((row, ri) => ri === r ? row.map((v, ci) => ci === c ? val : v) : row));
  };

  const calculate = () => {
    if (op === 'det') {
      const det = (m: number[][]): number => {
        if (m.length === 1) return m[0][0];
        if (m.length === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];
        let d = 0;
        for (let c = 0; c < m.length; c++) {
          const sub = m.slice(1).map(row => [...row.slice(0, c), ...row.slice(c + 1)]);
          d += (c % 2 === 0 ? 1 : -1) * m[0][c] * det(sub);
        }
        return d;
      };
      setResult(det(matA));
    } else {
      const res: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (op === 'add') res[i][j] = matA[i][j] + matB[i][j];
          else if (op === 'sub') res[i][j] = matA[i][j] - matB[i][j];
          else {
            let sum = 0;
            for (let k = 0; k < size; k++) sum += matA[i][k] * matB[k][j];
            res[i][j] = sum;
          }
        }
      }
      setResult(res);
    }
  };

  const renderMatrix = (label: string, mat: number[][], setter?: (r: number, c: number, v: number) => void) => (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <div className="inline-block">
        {mat.map((row, r) => (
          <div key={r} className="flex gap-1 mb-1">
            {row.map((v, c) => (
              <input key={c} type="number" value={v} onChange={e => setter?.(r, c, +e.target.value)}
                className="w-12 h-8 text-center text-sm rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-th" title="Matrix Calculator" description="Matrix operations: add, subtract, multiply, determinant" color="#f59e0b" />
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Size</label>
          <select value={size} onChange={e => updateSize(+e.target.value)} className="input-field w-20">
            {[2, 3, 4].map(n => <option key={n} value={n}>{n}×{n}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Operation</label>
          <select value={op} onChange={e => setOp(e.target.value as any)} className="input-field w-32">
            <option value="add">A + B</option>
            <option value="sub">A − B</option>
            <option value="mul">A × B</option>
            <option value="det">det(A)</option>
          </select>
        </div>
        <Button onClick={calculate} icon="fa-calculator">Calculate</Button>
      </div>
      <div className="flex flex-wrap gap-6 items-start">
        {renderMatrix('Matrix A', matA, (r, c, v) => updateCell('A', r, c, v))}
        {op !== 'det' && renderMatrix('Matrix B', matB, (r, c, v) => updateCell('B', r, c, v))}
        {result !== null && (
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Result</p>
            {typeof result === 'number' ? (
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{result}</p>
            ) : (
              <div className="inline-block">
                {(result as number[][]).map((row, r) => (
                  <div key={r} className="flex gap-1 mb-1">
                    {row.map((v, c) => (
                      <div key={c} className="w-12 h-8 flex items-center justify-center text-sm font-mono rounded" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--accent)' }}>{v}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
