import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import PokerGame from './components/PokerGame';
import { Toaster } from './components/ui/toaster';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlayerHand, setCurrentPlayerHand] = useState([]);
  const [playerSession, setPlayerSession] = useState(null);

  // Check for existing session on app load
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('poker_player_id');
    const savedGameId = localStorage.getItem('poker_game_id');
    const savedPlayerName = localStorage.getItem('poker_player_name');

    if (savedPlayerId && savedGameId && savedPlayerName) {
      setPlayerSession({
        playerId: savedPlayerId,
        gameId: savedGameId,
        playerName: savedPlayerName
      });
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (sessionData) => {
    console.log('Player logged in:', sessionData);
    setPlayerSession(sessionData);
    setIsLoggedIn(true);
  };

  const handleLeaveGame = async () => {
    if (playerSession?.playerId) {
      try {
        // Call leave game API
        const response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/poker/leave-game/${playerSession.playerId}`, {
          method: 'POST'
        });

        if (response.ok) {
          console.log('Successfully left the game');
        }
      } catch (error) {
        console.error('Error leaving game:', error);
      }
    }

    // Clear session data
    localStorage.removeItem('poker_player_id');
    localStorage.removeItem('poker_game_id');
    localStorage.removeItem('poker_player_name');
    
    setPlayerSession(null);
    setIsLoggedIn(false);
    setCurrentPlayerHand([]);
  };

  const handleScannedCard = (cardData) => {
    console.log('Card scanned:', cardData);
    
    setCurrentPlayerHand(prevHand => {
      const newHand = [...prevHand];
      
      // Add new card (max 2 cards for Texas Hold'em)
      if (newHand.length < 2) {
        newHand.push({ ...cardData, isNew: true });
      } else {
        // Replace oldest card
        newHand.shift();
        newHand.push({ ...cardData, isNew: true });
      }
      
      // Remove isNew flag from previous cards
      newHand.forEach((card, index) => {
        if (index < newHand.length - 1) {
          card.isNew = false;
        }
      });
      
      return newHand;
    });
  };

  return (
    <div className="App">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? (
                <Navigate to="/game" replace />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            } 
          />
          <Route 
            path="/game" 
            element={
              isLoggedIn && playerSession ? (
                <PokerGame 
                  onLeaveGame={handleLeaveGame}
                  onCardScanned={handleScannedCard}
                  currentPlayerHand={currentPlayerHand}
                  playerSession={playerSession}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
      </Router>
      <Toaster />
    </div>
  );
}

export default App;