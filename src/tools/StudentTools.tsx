import React, { useState, useMemo } from 'react';
import { ToolHeader, Button } from '../components/Shared';

// ── GPA/CGPA Calculator (Redesigned) ──
export const GpaCalculator: React.FC = () => {
  const [mode, setMode] = useState<'gpa' | 'cgpa'>('gpa');
  const [courses, setCourses] = useState<Array<{ name: string; credit: number; grade: number }>>([]);
  const [semesters, setSemesters] = useState<Array<{ gpa: number; credits: number }>>([]);
  const [showGradeScale, setShowGradeScale] = useState(false);
  const [showCalcDetails, setShowCalcDetails] = useState(false);

  const gradeScale = [
    { label: 'A+', value: 4.0 }, { label: 'A', value: 4.0 }, { label: 'A-', value: 3.7 },
    { label: 'B+', value: 3.3 }, { label: 'B', value: 3.0 }, { label: 'B-', value: 2.7 },
    { label: 'C+', value: 2.3 }, { label: 'C', value: 2.0 }, { label: 'C-', value: 1.7 },
    { label: 'D', value: 1.0 }, { label: 'F', value: 0.0 },
  ];

  const addCourse = () => setCourses(p => [...p, { name: '', credit: 3, grade: 4 }]);
  const removeCourse = (i: number) => setCourses(p => p.filter((_, idx) => idx !== i));
  const updateCourse = (i: number, field: string, val: any) => 
    setCourses(p => p.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const addSemester = () => setSemesters(p => [...p, { gpa: 3.5, credits: 15 }]);
  const removeSemester = (i: number) => setSemesters(p => p.filter((_, idx) => idx !== i));
  const updateSemester = (i: number, field: string, val: number) => 
    setSemesters(p => p.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const loadExample = () => {
    if (mode === 'gpa') {
      setCourses([
        { name: 'Data Structures', credit: 3, grade: 4.0 },
        { name: 'Database Systems', credit: 3, grade: 3.7 },
        { name: 'Operating Systems', credit: 3, grade: 3.3 },
        { name: 'Computer Networks', credit: 3, grade: 3.7 },
      ]);
    } else {
      setSemesters([
        { gpa: 3.8, credits: 15 },
        { gpa: 3.92, credits: 18 },
        { gpa: 3.75, credits: 15 },
      ]);
    }
  };

  const resetAll = () => {
    if (mode === 'gpa') setCourses([]);
    else setSemesters([]);
  };

  // GPA Calculation
  const gpaResult = useMemo(() => {
    const validCourses = courses.filter(c => c.credit > 0);
    const totalCredits = validCourses.reduce((s, c) => s + c.credit, 0);
    const totalPoints = validCourses.reduce((s, c) => s + c.credit * c.grade, 0);
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return {
      gpa: gpa.toFixed(2),
      totalCredits,
      totalPoints: totalPoints.toFixed(2),
      courseCount: validCourses.length,
    };
  }, [courses]);

  // CGPA Calculation
  const cgpaResult = useMemo(() => {
    const totalCredits = semesters.reduce((s, sem) => s + sem.credits, 0);
    const totalPoints = semesters.reduce((s, sem) => s + (sem.gpa * sem.credits), 0);
    const cgpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return {
      cgpa: cgpa.toFixed(2),
      totalCredits,
      totalPoints: totalPoints.toFixed(2),
      semesterCount: semesters.length,
    };
  }, [semesters]);

  const result = mode === 'gpa' ? gpaResult : cgpaResult;
  const resultValue = mode === 'gpa' ? gpaResult.gpa : cgpaResult.cgpa;
  const resultLabel = mode === 'gpa' ? 'Your Semester GPA' : 'Your Cumulative GPA';

  return (
    <div className="tool-container">
      <ToolHeader icon="fa-chart-line" title="GPA / CGPA Calculator" description="Calculate your semester GPA or overall CGPA using course credits and grades." color="#f59e0b" />

      {/* Mode Selector */}
      <div className="mb-6">
        <div className="flex gap-2 p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
          <button
            onClick={() => setMode('gpa')}
            className="flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm"
            style={{
              background: mode === 'gpa' ? 'var(--accent)' : 'transparent',
              color: mode === 'gpa' ? 'white' : 'var(--text-primary)',
            }}
          >
            GPA Calculator
          </button>
          <button
            onClick={() => setMode('cgpa')}
            className="flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm"
            style={{
              background: mode === 'cgpa' ? 'var(--accent)' : 'transparent',
              color: mode === 'cgpa' ? 'white' : 'var(--text-primary)',
            }}
          >
            CGPA Calculator
          </button>
        </div>
        <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
          {mode === 'gpa' ? 'GPA = performance for one semester' : 'CGPA = cumulative performance across multiple semesters'}
        </p>
      </div>

      {/* GPA Mode */}
      {mode === 'gpa' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Your Courses</h3>
            <div className="flex gap-2">
              <button onClick={loadExample} className="text-xs px-3 py-1.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                Use Example
              </button>
              {courses.length > 0 && (
                <button onClick={resetAll} className="text-xs px-3 py-1.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-8 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <i className="fas fa-book text-3xl mb-2" style={{ color: 'var(--text-muted)' }}></i>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No courses added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add your courses to calculate your GPA</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((c, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Course Name (optional)</label>
                      <input
                        type="text"
                        value={c.name}
                        onChange={e => updateCourse(i, 'name', e.target.value)}
                        placeholder="e.g. Data Structures"
                        className="input-field text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeCourse(i)}
                      className="ml-2 p-2 rounded hover:bg-red-500 hover:text-white transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Remove course"
                      title="Remove course"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Credits</label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={c.credit}
                        onChange={e => updateCourse(i, 'credit', Math.max(0.5, +e.target.value))}
                        className="input-field text-sm"
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Credit hours for this course</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Grade</label>
                      <select
                        value={c.grade}
                        onChange={e => updateCourse(i, 'grade', +e.target.value)}
                        className="input-field text-sm"
                      >
                        {gradeScale.map(g => (
                          <option key={g.value} value={g.value}>{g.label} — {g.value.toFixed(2)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Grade Points: {(c.credit * c.grade).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addCourse} icon="fa-plus" variant="secondary">
            Add Course
          </Button>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add each course you took this semester</p>
        </div>
      )}

      {/* CGPA Mode */}
      {mode === 'cgpa' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Your Semesters</h3>
            <div className="flex gap-2">
              <button onClick={loadExample} className="text-xs px-3 py-1.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                Use Example
              </button>
              {semesters.length > 0 && (
                <button onClick={resetAll} className="text-xs px-3 py-1.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {semesters.length === 0 ? (
            <div className="text-center py-8 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <i className="fas fa-graduation-cap text-3xl mb-2" style={{ color: 'var(--text-muted)' }}></i>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No semesters added yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Add your semesters to calculate your CGPA</p>
            </div>
          ) : (
            <div className="space-y-3">
              {semesters.map((s, i) => (
                <div key={i} className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Semester {i + 1}</h4>
                    <button
                      onClick={() => removeSemester(i)}
                      className="p-2 rounded hover:bg-red-500 hover:text-white transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Remove semester"
                      title="Remove semester"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>GPA</label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        step="0.01"
                        value={s.gpa}
                        onChange={e => updateSemester(i, 'gpa', Math.min(4, Math.max(0, +e.target.value)))}
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>Credits</label>
                      <input
                        type="number"
                        min="1"
                        value={s.credits}
                        onChange={e => updateSemester(i, 'credits', Math.max(1, +e.target.value))}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Quality Points: {(s.gpa * s.credits).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button onClick={addSemester} icon="fa-plus" variant="secondary">
            Add Semester
          </Button>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Add each semester's GPA and total credits</p>
        </div>
      )}

      {/* Result Card */}
      {(courses.length > 0 || semesters.length > 0) && (
        <div className="mt-6 p-6 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '2px solid var(--accent)' }}>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{resultLabel}</p>
          <p className="text-5xl font-bold mb-2" style={{ color: 'var(--accent)' }}>{resultValue}</p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>out of 4.00</p>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {mode === 'gpa' ? 'Courses' : 'Semesters'}
              </p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {mode === 'gpa' ? gpaResult.courseCount : cgpaResult.semesterCount}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Credits</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{result.totalCredits}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Quality Points</p>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{result.totalPoints}</p>
            </div>
          </div>

          {/* Calculation Details */}
          <button
            onClick={() => setShowCalcDetails(!showCalcDetails)}
            className="mt-4 text-xs underline"
            style={{ color: 'var(--accent)' }}
          >
            {showCalcDetails ? 'Hide' : 'Show'} Calculation Details
          </button>

          {showCalcDetails && (
            <div className="mt-4 p-4 rounded-lg text-left text-xs" style={{ background: 'var(--card-bg)' }}>
              {mode === 'gpa' ? (
                <div className="space-y-2">
                  {courses.filter(c => c.credit > 0).map((c, i) => (
                    <div key={i} style={{ color: 'var(--text-secondary)' }}>
                      {c.name || `Course ${i + 1}`}: {c.credit} credits × {c.grade.toFixed(2)} = {(c.credit * c.grade).toFixed(2)}
                    </div>
                  ))}
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <p>Total Quality Points: {result.totalPoints}</p>
                    <p>Total Credits: {result.totalCredits}</p>
                    <p className="font-bold mt-1">GPA: {result.totalPoints} ÷ {result.totalCredits} = {resultValue}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {semesters.map((s, i) => (
                    <div key={i} style={{ color: 'var(--text-secondary)' }}>
                      Semester {i + 1}: {s.gpa.toFixed(2)} × {s.credits} = {(s.gpa * s.credits).toFixed(2)}
                    </div>
                  ))}
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                    <p>Total Quality Points: {result.totalPoints}</p>
                    <p>Total Credits: {result.totalCredits}</p>
                    <p className="font-bold mt-1">CGPA: {result.totalPoints} ÷ {result.totalCredits} = {resultValue}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
        <button
          onClick={() => setShowGradeScale(!showGradeScale)}
          className="w-full flex items-center justify-between text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          <span>
            <i className="fas fa-info-circle mr-2" style={{ color: 'var(--accent)' }}></i>
            How does this work?
          </span>
          <i className={`fas fa-chevron-${showGradeScale ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)' }}></i>
        </button>

        {showGradeScale && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>GPA Formula:</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                GPA = Total Quality Points ÷ Total Credits
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Each course's grade point is multiplied by its credits. Those values are added together and divided by your total credits.
              </p>
            </div>

            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Grade Scale (4.00):</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {gradeScale.map(g => (
                  <div key={g.label} className="flex justify-between p-1 rounded" style={{ background: 'var(--card-bg)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{g.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{g.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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
