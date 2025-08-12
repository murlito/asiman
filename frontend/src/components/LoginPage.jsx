import React, { useState, useEffect } from 'react';

const LoginPage = ({ onLogin }) => {
  const [playerName, setPlayerName] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available games
  useEffect(() => {
    loadGames();
    // Refresh games every 5 seconds
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadGames = async () => {
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/poker/games`);
      const data = await response.json();
      setGames(data.games || []);
      console.log('Loaded games:', data.games);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

  const joinGame = async (gameId) => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/poker/join-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_id: gameId,
          player_name: playerName,
          chips: 1000
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Store player session data
        localStorage.setItem('poker_player_id', data.player_id);
        localStorage.setItem('poker_game_id', gameId);
        localStorage.setItem('poker_player_name', playerName);
        
        onLogin({
          playerId: data.player_id,
          gameId: gameId,
          playerName: playerName
        });
      } else {
        setError(data.detail || 'Failed to join game');
      }
    } catch (err) {
      setError('Failed to join game');
      console.error('Join game error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🃏 Texas Hold'em Poker</h1>
        <p>Join an available poker game</p>
        
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="available-games">
          <h3>Available Games ({games.length})</h3>
          
          {games.length === 0 ? (
            <div className="no-games">
              <p>No games available at the moment.</p>
              <p>Please wait for someone to create a game.</p>
            </div>
          ) : (
            <div className="games-list">
              {games.map((game) => (
                <div key={game.game_id} className="game-item">
                  <div className="game-info">
                    <div><strong>Players:</strong> {game.player_count}/9</div>
                    <div><strong>Pot:</strong> ${game.pot}</div>
                    <div><strong>State:</strong> {game.state.replace('_', ' ')}</div>
                    <div><strong>Hand:</strong> #{game.hand_number}</div>
                  </div>
                  <button
                    onClick={() => joinGame(game.game_id)}
                    disabled={loading || !game.can_join || !playerName.trim()}
                    className="join-button"
                  >
                    {loading ? 'Joining...' : 'Join Game'}
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button onClick={loadGames} className="refresh-button">
            🔄 Refresh Games
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 20px;
        }

        .login-card {
          background: rgba(30, 41, 59, 0.95);
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(71, 85, 105, 0.3);
          max-width: 500px;
          width: 100%;
          text-align: center;
          color: white;
        }

        h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(45deg, #22d3ee, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        p {
          color: #94a3b8;
          margin-bottom: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid rgba(71, 85, 105, 0.5);
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.8);
          color: white;
          font-size: 16px;
          box-sizing: border-box;
        }

        input:focus {
          outline: none;
          border-color: #22d3ee;
          box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.2);
        }

        .error-message {
          color: #ef4444;
          margin-bottom: 1rem;
          padding: 8px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .available-games {
          text-align: left;
        }

        .available-games h3 {
          text-align: center;
          margin-bottom: 1rem;
          color: #e2e8f0;
        }

        .no-games {
          text-align: center;
          padding: 2rem 1rem;
          color: #94a3b8;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(71, 85, 105, 0.3);
          margin-bottom: 1rem;
        }

        .no-games p {
          margin: 0.5rem 0;
        }

        .games-list {
          margin-bottom: 1rem;
        }

        .game-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
          border: 1px solid rgba(71, 85, 105, 0.3);
          margin-bottom: 0.5rem;
        }

        .game-info {
          font-size: 14px;
          color: #cbd5e1;
        }

        .game-info div {
          margin-bottom: 4px;
        }

        .game-info strong {
          color: #e2e8f0;
        }

        .join-button {
          background: linear-gradient(45deg, #22c55e, #16a34a);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .join-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }

        .join-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .refresh-button {
          background: rgba(71, 85, 105, 0.6);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
          font-weight: 500;
        }

        .refresh-button:hover {
          background: rgba(71, 85, 105, 0.8);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;