import React from 'react';
import PlayingCard from './PlayingCard';
import './CommunityCardsTop.css';

export default function CommunityCardsTop({ cards, gamePhase }) {
  return (
    <div className="community-cards-top">
      <div className="community-cards-row">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="community-card-space">
            {cards[index] ? (
              <PlayingCard 
                card={cards[index]}
                faceDown={false}
                delay={index * 0.2}
              />
            ) : (
              <div className="empty-card-space">
                <div className="card-back-pattern-top"></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}