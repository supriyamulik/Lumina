import React, { useState, useEffect, useCallback } from 'react';
import GameContainer from '../../components/games/GameContainer';
import { useProfile } from '../../contexts/ProfileContext';
import { useTranslation } from 'react-i18next';

export default function MemoryMatch() {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);

  const grade = profile?.grade || 6;
  const isLowVision = profile?.disabilities?.includes('Low Vision');

  const symbols = ['🍎', '🐶', '☀️', '⚽', '🎨', '🚀', '🧠', '🎈', '🍭', '🌊', '🦖', '🦜', '🍕', '🍰', '🏎️', '🌍'];

  const initGame = useCallback(() => {
    let pairCount = 4;
    if (grade > 3) pairCount = 8;
    if (grade > 6) pairCount = 12;

    const gameSymbols = symbols.slice(0, pairCount);
    const deck = [...gameSymbols, ...gameSymbols]
      .sort(() => Math.random() - 0.5)
      .map((s, i) => ({ id: i, symbol: s }));

    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setScore(0);
  }, [grade]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleFlip = (id) => {
    if (flipped.length === 2 || flipped.includes(id) || matched.includes(id)) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [id1, id2] = newFlipped;
      if (cards[id1].symbol === cards[id2].symbol) {
        setMatched(m => [...m, id1, id2]);
        setScore(s => s + 500);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const gridSize = cards.length <= 8 ? '2' : cards.length <= 16 ? '4' : '6';

  const GameComponent = () => (
    <div style={{ padding: '20px', width: '100%', maxWidth: '900px', maxHeight: '100%', overflowY: 'auto', textAlign: 'center' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: '20px',
        margin: '0 auto'
      }}>
        {cards.map((card, i) => {
          const isFlipped = flipped.includes(i) || matched.includes(i);
          return (
            <div
              key={card.id}
              onClick={() => handleFlip(i)}
              style={{
                aspectRatio: '1',
                cursor: 'pointer',
                backgroundColor: isFlipped ? (isLowVision ? '#000' : '#FFF') : (isLowVision ? '#222' : '#E8920C'),
                border: isLowVision ? '4px solid #FFF' : 'none',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.4s'
              }}
            >
              {isFlipped ? card.symbol : '?'}
            </div>
          );
        })}
      </div>
      {matched.length === cards.length && cards.length > 0 && (
         <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '32px', color: '#1A7A62' }}>{t('games.memory_match_master')}</h2>
            <button onClick={initGame} style={{ padding: '12px 32px', backgroundColor: '#E8920C', color: '#FFF', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' }}>{t('games.memory_match_restart')}</button>
         </div>
      )}
    </div>
  );

  return (
    <GameContainer
      title={t('games.memory_match')}
      description={t('games.memory_match_desc')}
      type="component"
      gameSource={<GameComponent />}
      background={isLowVision ? '#000' : '#F7F6F2'}
    />
  );
}
