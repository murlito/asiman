import React, { useState, useEffect } from 'react';

const LoginPage = ({ onLogin }) => {
  const [playerName, setPlayerName] = useState('');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGames, setShowGames] = useState(false);

  // Load available games
  useEffect(() => {
    loadGames();
    // Refresh games every 5 seconds
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const getBackendUrl = () => {
    // For development, always use localhost
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:8001';
    }
    
    // For production, use environment variable
    return import.meta.env.VITE_REACT_APP_BACKEND_URL || 
           process.env.REACT_APP_BACKEND_URL || 
           'http://localhost:8001';
  };

  const loadGames = async () => {
    try {
      const backendUrl = getBackendUrl();
      console.log('Loading games from:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/poker/games`);
      console.log('Games response status:', response.status);
      
      const data = await response.json();
      console.log('Games data received:', data);
      
      setGames(data.games || []);
    } catch (err) {
      console.error('Failed to load games:', err);
      setError(`Failed to connect to server: ${err.message}`);
    }
  };

  const handleEnter = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (games.length === 0) {
      setError('No games available. Please wait for a dealer to create a game.');
      return;
    }

    setShowGames(true);
  };

  const joinGame = async (gameId) => {
    setLoading(true);
    setError('');

    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/poker/join-game`, {
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

  const formatGameState = (state) => {
    const stateMap = {
      'waiting': 'Waiting for players',
      'pre_flop': 'Pre-flop',
      'flop': 'Flop',
      'turn': 'Turn',
      'river': 'River',
      'showdown': 'Showdown',
      'finished': 'Finished'
    };
    return stateMap[state] || state;
  };

  return (
    <div className="poker-login">
      {/* Background Elements */}
      <div className="background-pattern"></div>
      
      {/* Top Right Brand */}
      <div className="brand-text">
        SMART<br/>POKER
      </div>

      <div className="login-container">
        {!showGames ? (
          // Main Login Form
          <div className="main-content">
            <div className="left-section">
              <div className="title-container">
                <h1 className="game-title">
                  <span className="texas">TEXAS</span>
                  <span className="holdem">HOLD'EM</span>
                  <span className="poker">POKER</span>
                </h1>
                <div className="poker-chip">
                  <div className="chip-inner">
                    <div className="chip-center"></div>
                    <div className="chip-stripe chip-stripe-1"></div>
                    <div className="chip-stripe chip-stripe-2"></div>
                    <div className="chip-stripe chip-stripe-3"></div>
                    <div className="chip-stripe chip-stripe-4"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-section">
              <div className="login-form">
                <h2 className="form-title">Enter your name</h2>
                
                <div className="input-container">
                  <input
                    type="text"
                    placeholder="Your name..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEnter()}
                    disabled={loading}
                    className="name-input"
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button 
                  onClick={handleEnter}
                  disabled={loading || !playerName.trim()}
                  className="enter-button"
                >
                  {loading ? 'LOADING...' : 'ENTER'}
                </button>

                <p className="tagline">Join the table and test your poker skills!</p>
              </div>
            </div>
          </div>
        ) : (
          // Games Selection
          <div className="games-selection">
            <button 
              onClick={() => setShowGames(false)}
              className="back-button"
            >
              ← Back
            </button>
            
            <h2 className="games-title">Available Games ({games.length})</h2>
            
            {games.length === 0 ? (
              <div className="no-games">
                <p>No games available at the moment.</p>
                <p>Please wait for a dealer to create a game.</p>
              </div>
            ) : (
              <div className="games-grid">
                {games.map((game) => (
                  <div key={game.game_id} className="game-card">
                    <div className="game-header">
                      <strong>Game #{game.game_id.slice(-8)}</strong>
                      <span className={`game-status status-${game.state.replace('_', '-')}`}>
                        {formatGameState(game.state)}
                      </span>
                    </div>
                    <div className="game-details">
                      <div>👥 Players: {game.player_count}/9</div>
                      <div>💰 Pot: ${game.pot}</div>
                      <div>🎲 Hand: #{game.hand_number}</div>
                    </div>
                    <button
                      onClick={() => joinGame(game.game_id)}
                      disabled={loading || !game.can_join}
                      className="join-game-button"
                    >
                      {loading ? 'Joining...' : 'Join Game'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .poker-login {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a1929 0%, #1e3a8a 50%, #1e293b 100%);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .background-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 206, 84, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%);
          z-index: 1;
        }

        .brand-text {
          position: absolute;
          top: 2rem;
          right: 2rem;
          font-size: 1.8rem;
          font-weight: 900;
          color: white;
          letter-spacing: 2px;
          text-align: right;
          line-height: 1.2;
          z-index: 10;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }

        .login-container {
          position: relative;
          z-index: 5;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 500px;
          gap: 4rem;
          align-items: center;
          max-width: 1200px;
          width: 100%;
        }

        .left-section {
          position: relative;
        }

        .title-container {
          position: relative;
        }

        .game-title {
          margin: 0;
          line-height: 0.9;
        }

        .texas {
          display: block;
          font-size: 5rem;
          font-weight: 900;
          background: linear-gradient(45deg, #fbbf24, #f59e0b, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
          margin-bottom: -0.2rem;
        }

        .holdem {
          display: block;
          font-size: 5rem;
          font-weight: 900;
          background: linear-gradient(45deg, #fbbf24, #f59e0b, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 8px 16px rgba(251, 191, 36, 0.3);
          margin-bottom: 0.5rem;
        }

        .poker {
          display: block;
          font-size: 3.5rem;
          font-weight: 700;
          color: white;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
          letter-spacing: 8px;
          margin-left: 0.5rem;
        }

        .poker-chip {
          position: absolute;
          right: -2rem;
          bottom: -1rem;
          width: 120px;
          height: 120px;
          transform: rotate(15deg);
        }

        .chip-inner {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, #1f2937, #374151);
          border-radius: 50%;
          position: relative;
          border: 8px solid #fbbf24;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.4),
            inset 0 4px 8px rgba(255, 255, 255, 0.1);
        }

        .chip-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: linear-gradient(145deg, #374151, #1f2937);
          border-radius: 50%;
          border: 2px solid #fbbf24;
        }

        .chip-stripe {
          position: absolute;
          background: #fbbf24;
          border-radius: 2px;
        }

        .chip-stripe-1 {
          top: 20px;
          left: 50%;
          width: 4px;
          height: 20px;
          transform: translateX(-50%);
        }

        .chip-stripe-2 {
          bottom: 20px;
          left: 50%;
          width: 4px;
          height: 20px;
          transform: translateX(-50%);
        }

        .chip-stripe-3 {
          left: 20px;
          top: 50%;
          width: 20px;
          height: 4px;
          transform: translateY(-50%);
        }

        .chip-stripe-4 {
          right: 20px;
          top: 50%;
          width: 20px;
          height: 4px;
          transform: translateY(-50%);
        }

        .right-section {
          display: flex;
          justify-content: center;
        }

        .login-form {
          background: rgba(30, 41, 59, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 3rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }

        .form-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
          margin-bottom: 2rem;
          margin-top: 0;
        }

        .input-container {
          margin-bottom: 1.5rem;
        }

        .name-input {
          width: 100%;
          padding: 1rem 1.5rem;
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(251, 191, 36, 0.3);
          border-radius: 12px;
          color: white;
          font-size: 1.1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .name-input:focus {
          outline: none;
          border-color: #fbbf24;
          box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2);
          background: rgba(15, 23, 42, 0.9);
        }

        .name-input::placeholder {
          color: rgba(148, 163, 184, 0.7);
        }

        .error-message {
          color: #ef4444;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(239, 68, 68, 0.3);
          font-size: 0.9rem;
        }

        .enter-button {
          width: 100%;
          padding: 1rem 2rem;
          background: linear-gradient(45deg, #fbbf24, #f59e0b);
          color: #1f2937;
          border: none;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 1px;
          text-transform: uppercase;
          box-shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
        }

        .enter-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(251, 191, 36, 0.5);
          background: linear-gradient(45deg, #f59e0b, #d97706);
        }

        .enter-button:active {
          transform: translateY(0);
        }

        .enter-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 10px rgba(251, 191, 36, 0.2);
        }

        .tagline {
          margin-top: 1.5rem;
          margin-bottom: 0;
          color: rgba(148, 163, 184, 0.8);
          font-size: 1rem;
          font-style: italic;
        }

        /* Games Selection Styles */
        .games-selection {
          background: rgba(30, 41, 59, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          max-width: 800px;
          width: 100%;
        }

        .back-button {
          background: rgba(71, 85, 105, 0.6);
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 1.5rem;
          transition: background 0.2s;
        }

        .back-button:hover {
          background: rgba(71, 85, 105, 0.8);
        }

        .games-title {
          color: white;
          text-align: center;
          margin-bottom: 2rem;
          font-size: 1.5rem;
        }

        .no-games {
          text-align: center;
          padding: 3rem 2rem;
          color: #94a3b8;
          background: rgba(15, 23, 42, 0.6);
          border-radius: 12px;
          border: 1px solid rgba(71, 85, 105, 0.3);
        }

        .no-games p {
          margin: 0.5rem 0;
          font-size: 1.1rem;
        }

        .games-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .game-card {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.2s;
        }

        .game-card:hover {
          background: rgba(15, 23, 42, 0.8);
          transform: translateY(-2px);
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          color: white;
        }

        .game-status {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-waiting {
          background: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        }

        .status-pre-flop, .status-flop, .status-turn, .status-river {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .game-details {
          margin-bottom: 1rem;
          color: #cbd5e1;
          font-size: 0.9rem;
        }

        .game-details div {
          margin-bottom: 0.25rem;
        }

        .join-game-button {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(45deg, #22c55e, #16a34a);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .join-game-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
        }

        .join-game-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
          }
          
          .poker-chip {
            position: relative;
            right: auto;
            bottom: auto;
            margin: 2rem auto 0;
          }
          
          .texas, .holdem {
            font-size: 4rem;
          }
          
          .poker {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .brand-text {
            font-size: 1.4rem;
          }
          
          .login-form {
            padding: 2rem;
          }
          
          .texas, .holdem {
            font-size: 3rem;
          }
          
          .poker {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;