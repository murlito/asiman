import React from 'react';
import './PlayingCardSmall.css';

export default function PlayingCardSmall({ card, faceDown = true, delay = 0 }) {
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
      className="playing-card-small-container"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`playing-card-small ${faceDown ? 'face-down' : 'face-up'}`}>
        <div className="card-front-small">
          {card && !faceDown && (
            <>
              <div className="card-corner-small top-left">
                <div className={`card-rank-small ${getSuitColor(card.suit)}`}>
                  {card.rank}
                </div>
                <div className={`card-suit-small ${getSuitColor(card.suit)}`}>
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
              
              <div className="card-center-small">
                <div className={`card-suit-large-small ${getSuitColor(card.suit)}`}>
                  {getSuitSymbol(card.suit)}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="card-back-small">
          <div className="card-back-pattern-small"></div>
        </div>
      </div>
    </div>
  );
}