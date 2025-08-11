import React from 'react';
import PlayingCard from './PlayingCard';
import './CommunityCardsSplit.css';

export default function CommunityCardsSplit({ cards, gamePhase }) {
  return (
    <div className="community-cards-split">
      <div className="community-cards-horizontal">
        <div className="cards-label">Community Cards</div>
        <div className="cards-row">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="card-slot-split">
              {cards[index] ? (
                <PlayingCard 
                  card={cards[index]}
                  faceDown={false}
                  delay={index * 0.2}
                />
              ) : (
                <div className="empty-card-slot-split">
                  <div className="card-placeholder"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}