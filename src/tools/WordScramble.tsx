import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../components/Shared';

const WORDS = [
  { word: 'JAVASCRIPT', hint: 'Popular programming language for web development' },
  { word: 'ALGORITHM', hint: 'Step-by-step procedure for solving a problem' },
  { word: 'DATABASE', hint: 'Organized collection of structured data' },
  { word: 'FUNCTION', hint: 'Reusable block of code that performs a task' },
  { word: 'VARIABLE', hint: 'Container for storing data values' },
  { word: 'INTERFACE', hint: 'Point of interaction between components' },
  { word: 'NETWORK', hint: 'Group of interconnected computers' },
  { word: 'SECURITY', hint: 'Protection against unauthorized access' },
  { word: 'BROWSER', hint: 'Application for accessing the internet' },
  { word: 'COMPILER', hint: 'Program that translates code to machine language' }
];

function scrambleWord(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Make sure it's actually scrambled
  if (arr.join('') === word) {
    return scrambleWord(word);
  }
  return arr.join('');
}

export const WordScramble: React.FC = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | ''>('');
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    loadNewWord();
  }, [currentWordIndex]);

  const loadNewWord = () => {
    const word = WORDS[currentWordIndex].word;
    setScrambledWord(scrambleWord(word));
    setUserInput('');
    setFeedback('');
    setShowHint(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctWord = WORDS[currentWordIndex].word;
    
    setAttempts(prev => prev + 1);
    
    if (userInput.toUpperCase() === correctWord) {
      setFeedback('correct');
      setScore(prev => prev + (showHint ? 5 : 10));
      
      setTimeout(() => {
        if (currentWordIndex < WORDS.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
          setGameOver(true);
        }
      }, 1500);
    } else {
      setFeedback('incorrect');
      setTimeout(() => setFeedback(''), 1000);
    }
  };

  const handleSkip = () => {
    if (currentWordIndex < WORDS.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setGameOver(true);
    }
  };

  const handleRestart = () => {
    setCurrentWordIndex(0);
    setScore(0);
    setAttempts(0);
    setGameOver(false);
    loadNewWord();
  };

  const handleShowHint = () => {
    setShowHint(true);
  };

  return (
    <div className="tool-container">
      <ToolHeader
        icon="fa-puzzle-piece"
        title="Word Scramble"
        description="Unscramble the letters to form words"
        color="#ec4899"
      />

      <div className="space-y-4">
        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Score</p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{score}</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Word</p>
            <p className="text-xl font-bold" style={{ color: '#10b981' }}>{currentWordIndex + 1}/{WORDS.length}</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Attempts</p>
            <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{attempts}</p>
          </div>
        </div>

        {!gameOver ? (
          <>
            {/* Scrambled Word Display */}
            <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Unscramble this word:</p>
              <p className="text-4xl font-bold tracking-widest mb-4" style={{ color: 'var(--accent)' }}>
                {scrambledWord}
              </p>
              
              {showHint && (
                <p className="text-sm mt-4 p-3 rounded" style={{ background: 'var(--card-bg)', color: 'var(--text-secondary)' }}>
                  <i className="fas fa-lightbulb mr-2" style={{ color: '#f59e0b' }}></i>
                  <strong>Hint:</strong> {WORDS[currentWordIndex].hint}
                </p>
              )}
            </div>

            {/* Feedback */}
            {feedback && (
              <div 
                className="p-3 rounded-lg text-center"
                style={{ 
                  background: feedback === 'correct' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${feedback === 'correct' ? '#10b981' : '#ef4444'}`
                }}
              >
                <p className="text-sm font-medium" style={{ color: feedback === 'correct' ? '#10b981' : '#ef4444' }}>
                  <i className={`fas ${feedback === 'correct' ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
                  {feedback === 'correct' ? 'Correct! +' + (showHint ? '5' : '10') + ' points' : 'Try again!'}
                </p>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value.toUpperCase())}
                placeholder="Type your answer..."
                className="input-field text-center text-lg font-mono"
                style={{ letterSpacing: '0.2em' }}
                autoFocus
              />
              
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  <i className="fas fa-check mr-2"></i>
                  Submit
                </button>
                {!showHint && (
                  <button type="button" onClick={handleShowHint} className="btn-secondary">
                    <i className="fas fa-lightbulb mr-2"></i>
                    Hint (-5 pts)
                  </button>
                )}
                <button type="button" onClick={handleSkip} className="btn-secondary">
                  <i className="fas fa-forward mr-2"></i>
                  Skip
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Game Over Screen */
          <div className="p-8 rounded-lg text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
            <i className="fas fa-trophy text-6xl mb-4" style={{ color: '#f59e0b' }}></i>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Game Complete!
            </h3>
            <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
              Final Score: <strong style={{ color: 'var(--accent)' }}>{score}</strong> points
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Completed in {attempts} attempts
            </p>
            <button onClick={handleRestart} className="btn-primary">
              <i className="fas fa-redo mr-2"></i>
              Play Again
            </button>
          </div>
        )}

        {/* Instructions */}
        {!gameOver && attempts === 0 && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <i className="fas fa-info-circle mr-2" style={{ color: 'var(--accent)' }}></i>
              <strong>How to play:</strong> Unscramble the letters to form the correct word. 
              You get 10 points for each correct answer without hints, or 5 points with a hint.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
