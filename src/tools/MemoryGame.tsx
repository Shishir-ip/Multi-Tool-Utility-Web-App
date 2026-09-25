import React, { useState, useEffect } from 'react';
import { ToolHeader } from '../components/Shared';

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻'];

export const MemoryGame: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  // Initialize game
  const initializeGame = () => {
    const shuffledEmojis = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffledEmojis);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(false);
    setGameWon(false);
    setStartTime(null);
    setEndTime(null);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      setMoves(prev => prev + 1);

      if (cards[first].emoji === cards[second].emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) => 
            idx === first || idx === second 
              ? { ...card, isMatched: true }
              : card
          ));
          setFlippedCards([]);
          setMatches(prev => {
            const newMatches = prev + 1;
            if (newMatches === EMOJIS.length) {
              setGameWon(true);
              setEndTime(Date.now());
            }
            return newMatches;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map((card, idx) => 
            idx === first || idx === second 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  const handleCardClick = (id: number) => {
    if (!gameStarted) {
      setGameStarted(true);
      setStartTime(Date.now());
    }

    if (flippedCards.length === 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;

    setCards(prev => prev.map((card, idx) => 
      idx === id ? { ...card, isFlipped: true } : card
    ));
    setFlippedCards(prev => [...prev, id]);
  };

  const getTimeElapsed = () => {
    if (!startTime) return '0:00';
    const end = endTime || Date.now();
    const seconds = Math.floor((end - startTime) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="tool-container">
      <ToolHeader
        icon="fa-brain"
        title="Memory Game"
        description="Classic card matching memory game"
        color="#ec4899"
      />

      <div className="space-y-4">
        {/* Game Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Moves</p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{moves}</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Matches</p>
            <p className="text-xl font-bold" style={{ color: '#10b981' }}>{matches}/{EMOJIS.length}</p>
          </div>
          <div className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Time</p>
            <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{getTimeElapsed()}</p>
          </div>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className="aspect-square rounded-lg cursor-pointer transition-all transform hover:scale-105"
              style={{
                background: card.isFlipped || card.isMatched 
                  ? 'var(--card-bg)' 
                  : 'var(--accent)',
                border: `2px solid ${card.isMatched ? '#10b981' : 'var(--border-color)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem'
              }}
            >
              {(card.isFlipped || card.isMatched) && card.emoji}
            </div>
          ))}
        </div>

        {/* Win Message */}
        {gameWon && (
          <div className="p-6 rounded-lg text-center" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981' }}>
            <i className="fas fa-trophy text-5xl mb-3" style={{ color: '#f59e0b' }}></i>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Congratulations!
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              You completed the game in {moves} moves and {getTimeElapsed()}!
            </p>
            <button onClick={initializeGame} className="btn-primary">
              <i className="fas fa-redo mr-2"></i>
              Play Again
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {!gameWon && (
          <div className="flex gap-2 justify-center">
            <button onClick={initializeGame} className="btn-secondary">
              <i className="fas fa-redo mr-2"></i>
              New Game
            </button>
          </div>
        )}

        {/* Instructions */}
        {!gameStarted && !gameWon && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <i className="fas fa-info-circle mr-2" style={{ color: 'var(--accent)' }}></i>
              <strong>How to play:</strong> Click on cards to flip them. Find all matching pairs to win! 
              Try to complete the game in as few moves as possible.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
