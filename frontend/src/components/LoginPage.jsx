import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/use-toast';
import './LoginPage.css';

export default function LoginPage({ onEnterGame }) {
  const [playerName, setPlayerName] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue",
        variant: "destructive"
      });
      return;
    }

    if (playerName.trim().length < 2) {
      toast({
        title: "Name too short",
        description: "Name must be at least 2 characters long",
        variant: "destructive"
      });
      return;
    }

    if (playerName.trim().length > 20) {
      toast({
        title: "Name too long",
        description: "Name must be 20 characters or less",
        variant: "destructive"
      });
      return;
    }

    // Success - enter the game
    toast({
      title: "Welcome!",
      description: `Good luck, ${playerName.trim()}!`
    });

    onEnterGame(playerName.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="poker-cards-bg">
          <div className="card-bg card1"></div>
          <div className="card-bg card2"></div>
          <div className="card-bg card3"></div>
          <div className="card-bg card4"></div>
        </div>
        
        <div className="login-container">
          <div className="login-header">
            <h1 className="game-title">TEXAS HOLD'EM</h1>
            <h2 className="game-subtitle">POKER</h2>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="playerName" className="input-label">
                Enter your name
              </label>
              <Input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Your name..."
                className="player-name-input"
                maxLength={20}
                autoFocus
              />
            </div>

            <Button 
              type="submit"
              size="lg"
              className="enter-game-btn"
              disabled={!playerName.trim()}
            >
              ENTER
            </Button>
          </form>

          <div className="login-footer">
            <p className="game-info">Join the table and test your poker skills!</p>
          </div>
        </div>
      </div>
    </div>
  );
}