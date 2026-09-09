import { useState, useMemo } from 'react';

export default function WordCounter() {
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(w => w.length > 0).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
    const readingTime = Math.ceil(words / 200);
    const speakingTime = Math.ceil(words / 130);

    return { words, chars, charsNoSpaces, sentences, paragraphs, readingTime, speakingTime };
  }, [text]);

  const statCards = [
    { label: 'Words', value: stats.words, icon: 'fa-font', color: '#3b82f6' },
    { label: 'Characters', value: stats.chars, icon: 'fa-text-width', color: '#8b5cf6' },
    { label: 'Characters (no spaces)', value: stats.charsNoSpaces, icon: 'fa-compress-alt', color: '#06b6d4' },
    { label: 'Sentences', value: stats.sentences, icon: 'fa-align-left', color: '#10b981' },
    { label: 'Paragraphs', value: stats.paragraphs, icon: 'fa-paragraph', color: '#f59e0b' },
    { label: 'Reading Time', value: `${stats.readingTime} min`, icon: 'fa-book-reader', color: '#ef4444' },
    { label: 'Speaking Time', value: `${stats.speakingTime} min`, icon: 'fa-microphone', color: '#ec4899' },
  ];

  return (
    <div className="tool-container">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          <i className="fas fa-font mr-2" style={{ color: '#8b5cf6' }}></i>
          Word & Reading Time Counter
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Analyze your text with real-time statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {statCards.map((stat, i) => (
          <div key={i} className="stat-card">
            <i className={`fas ${stat.icon} text-lg mb-2`} style={{ color: stat.color }}></i>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Text Area */}
      <div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Start typing or paste your text here..."
          autoFocus
          className="w-full rounded-xl p-5 text-base leading-relaxed resize-y"
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            minHeight: '300px',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mt-4">
        <button onClick={() => setText('')} className="btn-secondary text-sm">
          <i className="fas fa-trash mr-1"></i> Clear
        </button>
        <button onClick={() => navigator.clipboard.writeText(text)} className="btn-secondary text-sm">
          <i className="fas fa-copy mr-1"></i> Copy Text
        </button>
      </div>
    </div>
  );
}
