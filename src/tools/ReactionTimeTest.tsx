import React, { useState, useEffect, useRef } from 'react';
import { ToolHeader } from '../components/Shared';

type GameState = 'waiting' | 'ready' | 'too-early' | 'click-now' | 'result';

export const ReactionTimeTest: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = () => {
    setGameState('ready');
    setReactionTime(null);
    
    // Random delay between 2-5 seconds
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setGameState('click-now');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'ready') {
      // Clicked too early
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setGameState('too-early');
    } else if (gameState === 'click-now') {
      // Calculate reaction time
      const time = Date.now() - startTime;
      setReactionTime(time);
      setAttempts(prev => [...prev, time]);
      setGameState('result');
    }
  };

  const handleReset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setGameState('waiting');
    setReactionTime(null);
  };

  const handleClearHistory = () => {
    setAttempts([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Calculate statistics
  const getStats = () => {
    if (attempts.length === 0) return null;

    const avg = attempts.reduce((a, b) => a + b, 0) / attempts.length;
    const best = Math.min(...attempts);
    const worst = Math.max(...attempts);

    return {
      average: Math.round(avg),
      best,
      worst,
      count: attempts.length
    };
  };

  const stats = getStats();

  // Get color based on reaction time
  const getReactionColor = (time: number) => {
    if (time < 200) return '#10b981'; // Excellent
    if (time < 300) return '#3b82f6'; // Good
    if (time < 400) return '#f59e0b'; // Average
    return '#ef4444'; // Slow
  };

  const getReactionLabel = (time: number) => {
    if (time < 200) return 'Excellent!';
    if (time < 300) return 'Good!';
    if (time < 400) return 'Average';
    return 'Keep practicing!';
  };

  return (
    <div className="tool-container">
      <ToolHeader
        icon="fa-bolt"
        title="Reaction Time Test"
        description="Test your reaction speed"
        color="#ec4899"
      />

      <div className="space-y-4">
        {/* Game Area */}
        <div
          onClick={handleClick}
          className="rounded-lg p-12 text-center cursor-pointer select-none transition-all"
          style={{
            background: gameState === 'waiting' ? 'var(--bg-tertiary)' :
                       gameState === 'ready' ? '#f59e0b' :
                       gameState === 'too-early' ? '#ef4444' :
                       gameState === 'click-now' ? '#10b981' :
                       'var(--bg-tertiary)',
            border: '2px solid var(--border-color)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {gameState === 'waiting' && (
            <>
              <i className="fas fa-bolt text-6xl mb-4" style={{ color: 'var(--accent)' }}></i>
              <p className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Ready to test your reactions?
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Click "Start Test" to begin
              </p>
            </>
          )}

          {gameState === 'ready' && (
            <>
              <i className="fas fa-hourglass-half text-6xl mb-4" style={{ color: 'white' }}></i>
              <p className="text-xl font-bold mb-2" style={{ color: 'white' }}>
                Wait for green...
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Don't click yet!
              </p>
            </>
          )}

          {gameState === 'too-early' && (
            <>
              <i className="fas fa-times-circle text-6xl mb-4" style={{ color: 'white' }}></i>
              <p className="text-xl font-bold mb-2" style={{ color: 'white' }}>
                Too early!
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Click to try again
              </p>
            </>
          )}

          {gameState === 'click-now' && (
            <>
              <i className="fas fa-hand-pointer text-6xl mb-4" style={{ color: 'white' }}></i>
              <p className="text-2xl font-bold mb-2" style={{ color: 'white' }}>
                CLICK NOW!
              </p>
            </>
          )}

          {gameState === 'result' && reactionTime && (
            <>
              <i className="fas fa-stopwatch text-6xl mb-4" style={{ color: getReactionColor(reactionTime) }}></i>
              <p className="text-5xl font-bold mb-2" style={{ color: getReactionColor(reactionTime) }}>
                {reactionTime}ms
              </p>
              <p className="text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
                {getReactionLabel(reactionTime)}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Click to try again
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {gameState === 'waiting' && (
            <button onClick={handleStart} className="btn-primary">
              <i className="fas fa-play mr-2"></i>
              Start Test
            </button>
          )}
          {gameState === 'too-early' && (
            <button onClick={handleStart} className="btn-primary">
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </button>
          )}
          {gameState === 'result' && (
            <>
              <button onClick={handleStart} className="btn-primary">
                <i className="fas fa-redo mr-2"></i>
                Try Again
              </button>
              <button onClick={handleReset} className="btn-secondary">
                <i className="fas fa-home mr-2"></i>
                Reset
              </button>
            </>
          )}
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Best</p>
              <p className="text-2xl font-bold" style={{ color: '#10b981' }}>{stats.best}ms</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Average</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{stats.average}ms</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Worst</p>
              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{stats.worst}ms</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Attempts</p>
              <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{stats.count}</p>
            </div>
          </div>
        )}

        {/* History */}
        {attempts.length > 0 && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                <i className="fas fa-history mr-2" style={{ color: 'var(--accent)' }}></i>
                Recent Attempts
              </h3>
              <button
                onClick={handleClearHistory}
                className="text-xs px-3 py-1 rounded"
                style={{ background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {attempts.slice(-10).reverse().map((time, index) => (
                <div
                  key={index}
                  className="px-3 py-1 rounded text-sm font-mono"
                  style={{
                    background: getReactionColor(time),
                    color: 'white'
                  }}
                >
                  {time}ms
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {gameState === 'waiting' && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <i className="fas fa-info-circle mr-2" style={{ color: 'var(--accent)' }}></i>
              <strong>How to play:</strong> Wait for the screen to turn green, then click as fast as you can! 
              Your reaction time will be measured in milliseconds. Try to beat your best score!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
