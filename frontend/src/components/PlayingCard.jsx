import React from 'react';
import './PlayingCard.css';

export default function PlayingCard({ card, faceDown = false, delay = 0 }) {
  if (!card && !faceDown) return null;

  const getSuitColor = (suit) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-black';
  };

  const getSuitSymbol = (suit) => {
    const symbols = {
      'hearts': '♥',
      'diamonds': '♦', 
      'clubs': '♣',
      'spades': '♠'
    };
    return symbols[suit] || suit;
  };

  return (
    <div 
      className="playing-card-container"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`playing-card ${faceDown ? 'face-down' : 'face-up'}`}>
        <div className="card-front">
          {card && (
            <>
              <div className="card-corner top-left">
                <div className={`card-rank ${getSuitColor(card.suit)}`}>
                  {card.rank}
                </div>
                <div className={`card-suit ${getSuitColor(card.suit)}`}>
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
              
              <div className="card-center">
                <div className={`card-suit-large ${getSuitColor(card.suit)}`}>
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
              
              <div className="card-corner bottom-right">
                <div className={`card-rank ${getSuitColor(card.suit)}`}>
                  {card.rank}
                </div>
                <div className={`card-suit ${getSuitColor(card.suit)}`}>
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="card-back">
          <div className="card-back-pattern"></div>
        </div>
      </div>
    </div>
  );
}