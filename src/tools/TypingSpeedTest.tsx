import React, { useState, useEffect, useRef } from 'react';
import { ToolHeader } from '../components/Shared';

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog. This simple sentence contains every letter of the alphabet and is commonly used for typing practice.",
  "Programming is the art of telling another human what one wants the computer to do. It requires patience, logic, and creativity to solve problems effectively.",
  "Technology has transformed the way we live, work, and communicate. From smartphones to artificial intelligence, innovation continues to shape our future.",
  "Success is not final, failure is not fatal. It is the courage to continue that counts. Keep learning, keep growing, and never give up on your dreams.",
  "The best way to predict the future is to create it. Every great achievement starts with a single step, and every expert was once a beginner."
];

export const TypingSpeedTest: React.FC = () => {
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Select random text
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setText(randomText);
  }, []);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
    setInput('');
    setIsFinished(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    if (!startTime) {
      setStartTime(Date.now());
    }

    // Check if finished
    if (value === text) {
      setEndTime(Date.now());
      setIsRunning(false);
      setIsFinished(true);
    }
  };

  const handleReset = () => {
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setText(randomText);
    setInput('');
    setStartTime(null);
    setEndTime(null);
    setIsRunning(false);
    setIsFinished(false);
  };

  // Calculate statistics
  const getStats = () => {
    if (!startTime || !endTime) return null;

    const timeInSeconds = (endTime - startTime) / 1000;
    const words = text.split(/\s+/).length;
    const characters = text.length;
    
    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === text[i]) {
        correctChars++;
      }
    }
    const accuracy = (correctChars / characters) * 100;

    // WPM (Words Per Minute)
    const wpm = Math.round((words / timeInSeconds) * 60);
    
    // CPM (Characters Per Minute)
    const cpm = Math.round((characters / timeInSeconds) * 60);

    return {
      wpm,
      cpm,
      accuracy: accuracy.toFixed(1),
      time: timeInSeconds.toFixed(1),
      words,
      characters
    };
  };

  const stats = getStats();

  // Get character status for highlighting
  const getCharStatus = (index: number) => {
    if (index >= input.length) return 'pending';
    if (input[index] === text[index]) return 'correct';
    return 'incorrect';
  };

  return (
    <div className="tool-container">
      <ToolHeader
        icon="fa-keyboard"
        title="Typing Speed Test"
        description="Test your typing speed and accuracy"
        color="#ec4899"
      />

      <div className="space-y-4">
        {/* Stats Display */}
        {stats && isFinished && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>WPM</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.wpm}</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Accuracy</p>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{stats.accuracy}%</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time</p>
              <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.time}s</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Characters</p>
              <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{stats.characters}</p>
            </div>
          </div>
        )}

        {/* Text to Type */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            Text to Type
          </label>
          <div 
            className="p-4 rounded-lg font-mono text-sm leading-relaxed"
            style={{ 
              background: 'var(--bg-tertiary)', 
              border: '1px solid var(--border-color)',
              minHeight: '120px'
            }}
          >
            {text.split('').map((char, index) => {
              const status = getCharStatus(index);
              let color = 'var(--text-muted)';
              if (status === 'correct') color = '#10b981';
              if (status === 'incorrect') color = '#ef4444';
              
              return (
                <span key={index} style={{ color, backgroundColor: status === 'incorrect' ? 'rgba(239, 68, 68, 0.2)' : 'transparent' }}>
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        {/* Input Area */}
        <div>
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>
            Your Input
          </label>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            disabled={!isRunning && !isFinished}
            className="input-field font-mono text-sm"
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder={isRunning ? "Start typing..." : "Click Start to begin"}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isRunning && !isFinished && (
            <button onClick={handleStart} className="btn-primary">
              <i className="fas fa-play mr-2"></i>
              Start Test
            </button>
          )}
          {(isRunning || isFinished) && (
            <button onClick={handleReset} className="btn-secondary">
              <i className="fas fa-redo mr-2"></i>
              {isFinished ? 'Try Again' : 'Reset'}
            </button>
          )}
        </div>

        {/* Instructions */}
        {!isRunning && !isFinished && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <i className="fas fa-info-circle mr-2" style={{ color: 'var(--accent)' }}></i>
              <strong>How to play:</strong> Click "Start Test" and type the text as quickly and accurately as possible. 
              Your typing speed (WPM) and accuracy will be calculated when you finish.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
