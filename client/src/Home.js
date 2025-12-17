import React, { useState } from 'react';
import PracticeRoom from './components/PracticeRoom';
import ChallengeRoom from './components/ChallengeRoom';

const Home = () => {
  const [difficulty, setDifficulty] = useState('Beginner');
  const [mode, setMode] = useState('practice');

  return (
    <div className="home-container">
      <div className="selector-card glass-card" style={{ maxWidth: 400, margin: '32px auto 24px auto', padding: 24, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Start Coding Challenge</h2>
        <p style={{ marginBottom: 20, color: '#888' }}>
          Choose your mode and difficulty level to begin practicing or challenge a friend!
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div className="mode-selector" style={{ flex: 1 }}>
            <label htmlFor="mode" style={{ fontWeight: 500 }}>Mode:</label>
            <select
              id="mode"
              value={mode}
              onChange={e => setMode(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 6, borderRadius: 6 }}
            >
              <option value="practice">Practice</option>
              <option value="challenge">Challenge</option>
            </select>
          </div>
          <div className="difficulty-selector" style={{ flex: 1 }}>
            <label htmlFor="difficulty" style={{ fontWeight: 500 }}>Difficulty:</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 6, borderRadius: 6 }}
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>
      {mode === 'practice' && (
        <PracticeRoom difficulty={difficulty} />
      )}
      {mode === 'challenge' && (
        <ChallengeRoom difficulty={difficulty} />
      )}
    </div>
  );
};

export default Home; 