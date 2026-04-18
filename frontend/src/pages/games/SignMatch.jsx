import React, { useState, useEffect } from 'react';
import GameContainer from '../../components/games/GameContainer';
import { useProfile } from '../../contexts/ProfileContext';
import { useTranslation } from 'react-i18next';

export default function SignMatch() {
  const { profile } = useProfile();
  const { t } = useTranslation();
  const [score, setScore] = useState(0);
  const [currentPair, setCurrentPair] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState('');

  const isLowHearing = profile?.disabilities?.includes('Low Hearing') || profile?.disabilities?.includes('Hard of Hearing');
  const isLowVision = profile?.disabilities?.includes('Low Vision');

  const pairs = [
    { word: 'APPLE', icon: '🍎' },
    { word: 'DOG', icon: '🐶' },
    { word: 'BOOK', icon: '📖' },
    { word: 'SUN', icon: '☀️' },
    { word: 'FISH', icon: '🐟' },
    { word: 'TREES', icon: '🌳' },
  ];

  useEffect(() => {
    generateNewRound();
  }, []);

  const generateNewRound = () => {
    const main = pairs[Math.floor(Math.random() * pairs.length)];
    const others = pairs.filter(p => p.word !== main.word).sort(() => Math.random() - 0.5).slice(0, 2);
    const roundOptions = [main, ...others].sort(() => Math.random() - 0.5);
    
    setCurrentPair(main);
    setOptions(roundOptions);
    setFeedback('');
  };

  const handleSelect = (option) => {
    if (option.word === currentPair.word) {
      setScore(s => s + 50);
      setFeedback(t('games.sign_match_correct'));
      setTimeout(generateNewRound, 1500);
    } else {
      setFeedback(t('games.sign_match_try_again'));
    }
  };

  const GameComponent = () => (
    <div style={{ padding: '20px', textAlign: 'center', width: '100%', maxWidth: '800px', maxHeight: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: isLowVision ? '80px' : '120px', marginBottom: '20px', animation: 'bounce 2s infinite' }}>
        {currentPair?.icon}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            style={{
              padding: '24px',
              fontSize: isLowVision ? '32px' : '24px',
              fontWeight: '900',
              backgroundColor: isLowVision ? '#000' : '#FFFFFF',
              color: isLowVision ? '#FFFF00' : '#0A1628',
              border: isLowVision ? '4px solid #FFF' : 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {opt.word}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '40px', fontSize: '24px', fontWeight: 'bold', color: isLowVision ? '#FFF' : '#1A7A62' }}>
        {feedback}
      </div>
      
      <style>{`
        @keyframes bounce { 
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);} 
          40% {transform: translateY(-20px);} 
          60% {transform: translateY(-10px);} 
        }
      `}</style>
    </div>
  );

  return (
    <GameContainer
      title={t('games.sign_match')}
      description={t('games.sign_match_desc')}
      type="component"
      gameSource={<GameComponent />}
      background={isLowVision ? '#000' : '#EBF4FF'}
    />
  );
}
