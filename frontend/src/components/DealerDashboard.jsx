import React, { useState, useEffect } from 'react';

const DealerDashboard = () => {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-refresh every 3 seconds
  useEffect(() => {
    loadGames();
    const interval = setInterval(() => {
      loadGames();
      if (selectedGame) {
        loadGameState(selectedGame);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedGame]);

  const getBackendUrl = () => {
    return import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  };

  const loadGames = async () => {
    try {
      const backendUrl = getBackendUrl();
      console.log('Dealer loading games from:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/poker/games`);
      console.log('Games response status:', response.status);
      
      const data = await response.json();
      console.log('Games data received:', data);
      
      setGames(data.games || []);
    } catch (err) {
      console.error('Failed to load games:', err);
      setError(`Failed to load games: ${err.message}`);
    }
  };

  const loadGameState = async (gameId) => {
    try {
      // We need a special dealer endpoint to see all player cards
      const response = await fetch(`${getBackendUrl()}/api/dealer/game-state/${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setGameState(data);
      }
    } catch (err) {
      console.error('Failed to load game state:', err);
    }
  };

  const createNewGame = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${getBackendUrl()}/api/poker/create-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          small_blind: 10,
          big_blind: 20
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setError('');
        loadGames(); // Refresh games list
        alert(`Новая игра создана! ID: ${data.game_id}`);
      } else {
        setError(data.detail || 'Failed to create game');
      }
    } catch (err) {
      setError('Failed to create game');
      console.error('Create game error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (gameId) => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/poker/start-game/${gameId}`, {
        method: 'POST'
      });

      if (response.ok) {
        loadGames();
        loadGameState(gameId);
        alert('Игра запущена!');
      } else {
        const data = await response.json();
        alert(data.detail || 'Не удалось запустить игру');
      }
    } catch (err) {
      alert('Ошибка запуска игры');
      console.error('Start game error:', err);
    }
  };

  const selectGame = (gameId) => {
    setSelectedGame(gameId);
    loadGameState(gameId);
  };

  const formatGameState = (state) => {
    const stateMap = {
      'waiting': 'Ожидание игроков',
      'pre_flop': 'Пре-флоп',
      'flop': 'Флоп',
      'turn': 'Терн',
      'river': 'Ривер',
      'showdown': 'Вскрытие',
      'finished': 'Завершена'
    };
    return stateMap[state] || state;
  };

  return (
    <div className="dealer-dashboard">
      <header className="dealer-header">
        <h1>🎰 Дилер Панель</h1>
        <p>Управление покерными играми</p>
      </header>

      <div className="dashboard-content">
        {/* Left Panel - Games List */}
        <div className="games-panel">
          <div className="panel-header">
            <h2>Игры ({games.length})</h2>
            <button 
              onClick={createNewGame}
              disabled={loading}
              className="create-game-btn"
            >
              {loading ? 'Создание...' : '+ Новая Игра'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="games-list">
            {games.map((game) => (
              <div 
                key={game.game_id} 
                className={`game-card ${selectedGame === game.game_id ? 'selected' : ''}`}
                onClick={() => selectGame(game.game_id)}
              >
                <div className="game-header">
                  <strong>Игра #{game.game_id.slice(-8)}</strong>
                  <span className={`game-status status-${game.state}`}>
                    {formatGameState(game.state)}
                  </span>
                </div>
                <div className="game-info">
                  <div>👥 Игроки: {game.player_count}/9</div>
                  <div>💰 Банк: ${game.pot}</div>
                  <div>🎲 Раунд: #{game.hand_number}</div>
                </div>
                {game.state === 'waiting' && game.player_count >= 2 && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      startGame(game.game_id);
                    }}
                    className="start-game-btn"
                  >
                    ▶️ Запустить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Game Details */}
        <div className="game-details-panel">
          {selectedGame && gameState ? (
            <div className="game-details">
              <h2>🎮 Детали Игры</h2>
              
              <div className="game-summary">
                <div className="summary-item">
                  <label>Состояние:</label>
                  <span className={`status status-${gameState.game_state}`}>
                    {formatGameState(gameState.game_state)}
                  </span>
                </div>
                <div className="summary-item">
                  <label>Банк:</label>
                  <span>${gameState.pot}</span>
                </div>
                <div className="summary-item">
                  <label>Текущая ставка:</label>
                  <span>${gameState.current_bet}</span>
                </div>
                <div className="summary-item">
                  <label>Раунд:</label>
                  <span>#{gameState.hand_number}</span>
                </div>
              </div>

              {/* Community Cards */}
              {gameState.community_cards.length > 0 && (
                <div className="community-cards-section">
                  <h3>🃏 Общие карты</h3>
                  <div className="community-cards">
                    {gameState.community_cards.map((card, idx) => (
                      <div key={idx} className={`card ${card.color}`}>
                        {card.rank}{getSuitSymbol(card.suit)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Players */}
              <div className="players-section">
                <h3>👥 Игроки ({gameState.players.length})</h3>
                <div className="players-list">
                  {gameState.players.map((player, idx) => (
                    <div key={player.id} className={`player-card ${player.is_folded ? 'folded' : ''}`}>
                      <div className="player-header">
                        <span className="player-name">{player.name}</span>
                        <div className="player-badges">
                          {player.is_dealer && <span className="badge dealer">Д</span>}
                          {player.is_small_blind && <span className="badge sb">МБ</span>}
                          {player.is_big_blind && <span className="badge bb">ББ</span>}
                        </div>
                      </div>
                      
                      <div className="player-info">
                        <div>💰 Фишки: ${player.chips}</div>
                        <div>🎯 Ставка: ${player.current_bet}</div>
                        {player.last_action && (
                          <div>🎬 Действие: {player.last_action}</div>
                        )}
                      </div>

                      {/* Dealer can see all hole cards */}
                      {player.hole_cards.length > 0 && (
                        <div className="hole-cards">
                          <strong>Карты:</strong>
                          <div className="cards">
                            {player.hole_cards.map((card, cardIdx) => (
                              <span key={cardIdx} className={`card ${card.color}`}>
                                {card.rank}{getSuitSymbol(card.suit)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-game-selected">
              <h2>Выберите игру</h2>
              <p>Кликните на игру слева для просмотра деталей</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .dealer-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .dealer-header {
          text-align: center;
          padding: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dealer-header h1 {
          font-size: 2.5rem;
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }

        .dealer-header p {
          color: #a0a0a0;
          font-size: 1.1rem;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 400px 1fr;
          height: calc(100vh - 120px);
        }

        .games-panel {
          background: rgba(0, 0, 0, 0.3);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          overflow-y: auto;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-header h2 {
          margin: 0;
          color: #e0e0e0;
        }

        .create-game-btn {
          background: linear-gradient(45deg, #4CAF50, #45a049);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s;
        }

        .create-game-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .create-game-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background: rgba(255, 0, 0, 0.1);
          border: 1px solid rgba(255, 0, 0, 0.3);
          color: #ff6b6b;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .games-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .game-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .game-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }

        .game-card.selected {
          border-color: #feca57;
          background: rgba(254, 202, 87, 0.1);
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .game-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-waiting {
          background: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        }

        .status-pre_flop, .status-flop, .status-turn, .status-river {
          background: rgba(40, 167, 69, 0.2);
          color: #28a745;
        }

        .status-showdown {
          background: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        }

        .status-finished {
          background: rgba(220, 53, 69, 0.2);
          color: #dc3545;
        }

        .game-info {
          font-size: 0.9rem;
          color: #b0b0b0;
        }

        .game-info div {
          margin-bottom: 2px;
        }

        .start-game-btn {
          background: linear-gradient(45deg, #ff6b6b, #ee5a52);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          margin-top: 0.5rem;
          transition: transform 0.2s;
        }

        .start-game-btn:hover {
          transform: translateY(-1px);
        }

        .game-details-panel {
          padding: 1rem;
          overflow-y: auto;
        }

        .no-game-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #666;
        }

        .game-details h2 {
          margin-bottom: 1rem;
          color: #feca57;
        }

        .game-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .summary-item {
          background: rgba(255, 255, 255, 0.05);
          padding: 1rem;
          border-radius: 8px;
        }

        .summary-item label {
          display: block;
          font-size: 0.9rem;
          color: #b0b0b0;
          margin-bottom: 0.5rem;
        }

        .summary-item span {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .community-cards-section {
          margin-bottom: 2rem;
        }

        .community-cards-section h3 {
          margin-bottom: 1rem;
          color: #e0e0e0;
        }

        .community-cards {
          display: flex;
          gap: 0.5rem;
        }

        .card {
          background: white;
          color: black;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 1.1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .card.red {
          color: #dc3545;
        }

        .players-section h3 {
          margin-bottom: 1rem;
          color: #e0e0e0;
        }

        .players-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .player-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
        }

        .player-card.folded {
          opacity: 0.6;
          background: rgba(0, 0, 0, 0.2);
        }

        .player-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .player-name {
          font-weight: 600;
          font-size: 1.1rem;
        }

        .player-badges {
          display: flex;
          gap: 0.25rem;
        }

        .badge {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        .badge.dealer {
          background: #feca57;
          color: black;
        }

        .badge.sb {
          background: #74b9ff;
          color: white;
        }

        .badge.bb {
          background: #fd79a8;
          color: white;
        }

        .player-info {
          font-size: 0.9rem;
          color: #b0b0b0;
          margin-bottom: 0.5rem;
        }

        .player-info div {
          margin-bottom: 2px;
        }

        .hole-cards {
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 0.5rem;
        }

        .hole-cards strong {
          color: #feca57;
          font-size: 0.9rem;
        }

        .hole-cards .cards {
          display: flex;
          gap: 0.25rem;
          margin-top: 0.25rem;
        }

        .hole-cards .card {
          padding: 4px 8px;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

// Helper function to get suit symbols
const getSuitSymbol = (suit) => {
  const symbols = {
    'hearts': '♥',
    'diamonds': '♦',
    'spades': '♠',
    'clubs': '♣'
  };
  return symbols[suit] || suit;
};

export default DealerDashboard;