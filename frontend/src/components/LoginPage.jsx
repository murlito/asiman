import React, { useState, useEffect } from 'react';

const LoginPage = ({ onLogin }) => {
  const [playerName, setPlayerName] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available games
  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/poker/games`);
      const data = await response.json();
      setGames(data.games || []);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

  const createNewGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create new game
      const createResponse = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/poker/create-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          small_blind: 10,
          big_blind: 20
        })
      });

      const createData = await createResponse.json();
      
      if (createResponse.ok) {
        // Join the created game
        await joinGame(createData.game_id);
      } else {
        setError('Failed to create game');
      }
    } catch (err) {
      setError('Failed to create game');
      console.error('Create game error:', err);
    } finally {
      setLoading(false);
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
        <p>Join or create a poker game</p>
        
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createNewGame()}
            disabled={loading}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="game-actions">
          <button 
            onClick={createNewGame}
            disabled={loading || !playerName.trim()}
            className="primary-button"
          >
            {loading ? 'Creating...' : 'Create New Game'}
          </button>
        </div>

        {games.length > 0 && (
          <div className="available-games">
            <h3>Available Games</h3>
            <div className="games-list">
              {games.map((game) => (
                <div key={game.game_id} className="game-item">
                  <div className="game-info">
                    <div>Players: {game.player_count}/9</div>
                    <div>Pot: ${game.pot}</div>
                    <div>State: {game.state}</div>
                    <div>Hand: #{game.hand_number}</div>
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
            <button onClick={loadGames} className="refresh-button">
              Refresh Games
            </button>
          </div>
        )}
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

        .game-actions {
          margin-bottom: 2rem;
        }

        .primary-button {
          background: linear-gradient(45deg, #22d3ee, #a855f7);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all 0.2s;
        }

        .primary-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.4);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .available-games {
          border-top: 1px solid rgba(71, 85, 105, 0.3);
          padding-top: 2rem;
          text-align: left;
        }

        .available-games h3 {
          text-align: center;
          margin-bottom: 1rem;
          color: #e2e8f0;
        }

        .games-list {
          space-y: 1rem;
          margin-bottom: 1rem;
        }

        .game-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
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
          margin-bottom: 2px;
        }

        .join-button {
          background: rgba(34, 197, 94, 0.8);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .join-button:hover:not(:disabled) {
          background: rgba(34, 197, 94, 1);
        }

        .join-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .refresh-button {
          background: rgba(71, 85, 105, 0.6);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
          transition: background 0.2s;
        }

        .refresh-button:hover {
          background: rgba(71, 85, 105, 0.8);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;