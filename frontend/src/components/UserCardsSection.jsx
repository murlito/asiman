import React from 'react';
import PlayingCard from './PlayingCard';
import './UserCardsSection.css';

export default function UserCardsSection({ cards, chips }) {
  return (
    <div className="user-cards-container">
      <div className="user-hand-cards">
        {cards.map((card, index) => (
          <PlayingCard 
            key={index}
            card={card}
            faceDown={false}
            delay={index * 0.2}
            animationType="slide-up"
          />
        ))}
      </div>
      
      <div className="user-chips-info">
        <div className="chips-label-new">Your Chips</div>
        <div className="chips-amount-new">${chips}</div>
      </div>
      
      <div className="hand-strength-new">
        <div className="strength-label-new">Hand Strength</div>
        <div className="strength-value-new">High Card</div>
      </div>
      
      <div className="hand-odds">
        <div className="odds-label">Win Probability</div>
        <div className="odds-value">12%</div>
      </div>
    </div>
  );
}