import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Card, CardContent } from './ui/card'; 
import { Badge } from './ui/badge';
import './PlayerControls.css';

export default function PlayerControls({ currentPlayer, currentBet, onPlayerAction, gamePhase }) {
  const [raiseAmount, setRaiseAmount] = useState(currentBet + 50);
  const [showRaiseInput, setShowRaiseInput] = useState(false);

  const handleRaise = () => {
    if (raiseAmount > currentBet && raiseAmount <= currentPlayer.chips) {
      onPlayerAction('raise', raiseAmount);
      setShowRaiseInput(false);
    }
  };

  const canCall = currentBet > 0 && currentPlayer.chips >= currentBet;
  const canRaise = currentPlayer.chips > currentBet;
  const canCheck = currentBet === 0;

  return (
    <Card className="player-controls-card">
      <CardContent className="p-6">
        <div className="controls-header">
          <h3 className="text-xl font-bold">{currentPlayer.name}'s Turn</h3>
          <div className="player-stats">
            <Badge variant="outline">Chips: ${currentPlayer.chips.toLocaleString()}</Badge>
            {currentBet > 0 && (
              <Badge variant="secondary">To Call: ${currentBet}</Badge>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <div className="primary-actions">
            <Button 
              variant="destructive" 
              size="lg"
              onClick={() => onPlayerAction('fold')}
              className="fold-btn"
            >
              Fold
            </Button>

            {canCheck && (
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => onPlayerAction('check')}
                className="check-btn"
              >
                Check
              </Button>
            )}

            {canCall && (
              <Button 
                variant="default" 
                size="lg"
                onClick={() => onPlayerAction('call')}
                className="call-btn"
              >
                Call ${currentBet}
              </Button>
            )}

            {canRaise && (
              <Button 
                variant="default" 
                size="lg"
                onClick={() => setShowRaiseInput(!showRaiseInput)}
                className="raise-btn"
              >
                Raise
              </Button>
            )}

            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => onPlayerAction('allin')}
              className="allin-btn"
            >
              All In
            </Button>
          </div>

          {showRaiseInput && (
            <div className="raise-controls">
              <div className="raise-slider">
                <label className="text-sm font-medium">Raise Amount: ${raiseAmount}</label>
                <Slider
                  value={[raiseAmount]}
                  onValueChange={(value) => setRaiseAmount(value[0])}
                  max={currentPlayer.chips}
                  min={currentBet + 10}
                  step={10}
                  className="mt-2"
                />
              </div>
              
              <div className="raise-actions">
                <Input
                  type="number"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  min={currentBet + 10}
                  max={currentPlayer.chips}
                  className="raise-input"
                />
                <Button onClick={handleRaise} size="sm">
                  Confirm Raise
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowRaiseInput(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="quick-bet-buttons">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRaiseAmount(currentBet + 50)}
          >
            +50
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRaiseAmount(currentBet + 100)}
          >
            +100
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRaiseAmount(Math.floor(currentPlayer.chips / 2))}
          >
            1/2 Pot
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setRaiseAmount(currentPlayer.chips)}
          >
            All In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}