import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import PlayingCard from './PlayingCard';
import './FlopCardsSection.css';

export default function FlopCardsSection({ cards, gameInfo, onLeave }) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recognizedCard, setRecognizedCard] = useState(null);

  useEffect(() => {
    // Initialize camera functionality
    const initCamera = () => {
      const startCameraBtn = document.getElementById('start-camera');
      const scanCardBtn = document.getElementById('scan-card');
      
      if (startCameraBtn && scanCardBtn) {
        startCameraBtn.addEventListener('click', startCamera);
        scanCardBtn.addEventListener('click', scanCard);
      }
    };

    // Initialize after component mounts
    setTimeout(initCamera, 100);

    return () => {
      // Cleanup camera stream
      const video = document.getElementById('camera-video');
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const video = document.getElementById('camera-video');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment' // Use back camera if available
        } 
      });
      
      video.srcObject = stream;
      setIsCameraActive(true);
      
      // Update button text
      const startBtn = document.getElementById('start-camera');
      if (startBtn) {
        startBtn.textContent = 'Camera On';
        startBtn.style.background = '#059669';
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const scanCard = () => {
    if (!isCameraActive) {
      alert('Please start the camera first');
      return;
    }

    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64 for processing
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Simulate card recognition (in real app, this would call an AI service)
    simulateCardRecognition(imageData);
  };

  const simulateCardRecognition = (imageData) => {
    // This is a simulation - in real app you'd call an AI service
    const mockCards = [
      { rank: 'A', suit: 'spades', name: 'Ace of Spades' },
      { rank: 'K', suit: 'hearts', name: 'King of Hearts' },
      { rank: 'Q', suit: 'diamonds', name: 'Queen of Diamonds' },
      { rank: 'J', suit: 'clubs', name: 'Jack of Clubs' },
      { rank: '10', suit: 'spades', name: '10 of Spades' },
      { rank: '9', suit: 'hearts', name: '9 of Hearts' },
      { rank: '8', suit: 'diamonds', name: '8 of Diamonds' },
      { rank: '7', suit: 'clubs', name: '7 of Clubs' }
    ];

    // Random card for simulation
    const randomCard = mockCards[Math.floor(Math.random() * mockCards.length)];
    
    setRecognizedCard(randomCard);
    
    // Display recognition result
    const displayElement = document.getElementById('recognized-card');
    if (displayElement) {
      displayElement.textContent = `Detected: ${randomCard.name}`;
      displayElement.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        displayElement.style.display = 'none';
      }, 3000);
    }
  };

  const handleConfirmLeave = () => {
    setIsLeaveDialogOpen(false);
    if (onLeave) {
      onLeave();
    } else {
      // Default behavior - show alert or reload
      alert('Leaving game...');
      window.location.reload();
    }
  };

  return (
    <div className="flop-cards-container">
      <div className="flop-header">
        <div className="game-info">
          <div className="blinds-pot-stack">
            <span className="blinds-info">Blinds: {gameInfo.blinds.small}/{gameInfo.blinds.big}</span>
            <span className="pot-info">Pot: ${gameInfo.pot}</span>
            {/* Leave button moved under POT */}
            <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="leave-button-under-pot">Leave</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave the game? You will lose your current progress.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmLeave} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Leave Game
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {/* Camera section on the right side of header */}
        <div className="camera-section">
          <div className="camera-container">
            <div className="camera-title">Card Scanner</div>
            <div className="camera-screen">
              <video id="camera-video" autoPlay playsInline muted></video>
              <canvas id="camera-canvas" style={{ display: 'none' }}></canvas>
              <div className="camera-overlay">
                <div className="scan-frame"></div>
                <div className="scan-instruction">Show card to camera</div>
              </div>
              <div id="recognized-card" className="recognized-card-display"></div>
            </div>
            <div className="camera-controls">
              <button id="start-camera" className="camera-btn">Start Camera</button>
              <button id="scan-card" className="camera-btn">Scan Card</button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flop-cards">
        {Array.from({ length: 5 }).map((_, index) => {
          // Different animation types for each card position to make it more dynamic
          const animationTypes = ['from-left', 'flip', 'from-right-smooth', 'from-right', 'from-right-smooth'];
          return (
            <div key={index} className="flop-card-slot">
              {cards[index] ? (
                <PlayingCard 
                  card={cards[index]}
                  faceDown={false}
                  delay={index * 0.4}
                  animationType={animationTypes[index]}
                />
              ) : (
                <div className="empty-flop-slot">
                  <div className="card-placeholder-flop"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}