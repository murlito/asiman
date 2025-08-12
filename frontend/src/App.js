import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PokerGame from "./components/PokerGame";
import LoginPage from "./components/LoginPage";
import { Toaster } from "./components/ui/toaster";

function App() {
  const [playerName, setPlayerName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleEnterGame = (name) => {
    setPlayerName(name);
    setIsLoggedIn(true);
  };

  const handleLeaveGame = () => {
    setPlayerName('');
    setIsLoggedIn(false);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? (
                <Navigate to="/game" replace />
              ) : (
                <LoginPage onEnterGame={handleEnterGame} />
              )
            } 
          />
          <Route 
            path="/game" 
            element={
              isLoggedIn ? (
                <PokerGame playerName={playerName} onLeaveGame={handleLeaveGame} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;