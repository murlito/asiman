import React from 'react';
import { Button } from './ui/button';
import PlayingCard from './PlayingCard';
import './FlopCardsSection.css';

export default function FlopCardsSection({ cards, gameInfo, onLeave }) {
  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      if (onLeave) {
        onLeave();
      } else {
        // Default behavior - show alert or reload
        alert('Leaving game...');
        window.location.reload();
      }
    }
  };

  return (
    <div className="flop-cards-container">
      <div className="flop-header">
        <div className="game-info">
          <div className="blinds-pot-stack">
            <span className="blinds-info">Blinds: {gameInfo.blinds.small}/{gameInfo.blinds.big}</span>
            <span className="pot-info">Pot: ${gameInfo.pot}</span>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleLeave}>Leave</Button>
      </div>
      
      <div className="flop-cards">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flop-card-slot">
            {cards[index] ? (
              <PlayingCard 
                card={cards[index]}
                faceDown={false}
                delay={index * 0.2}
              />
            ) : (
              <div className="empty-flop-slot">
                <div className="card-placeholder-flop"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}