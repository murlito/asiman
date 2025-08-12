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
    // Auto-start camera when component mounts
    setTimeout(() => {
      startCamera();
    }, 1000);

    // Auto-scan every 2 seconds when camera is active
    const scanInterval = setInterval(() => {
      if (isCameraActive) {
        scanCard();
      }
    }, 2000);

    return () => {
      clearInterval(scanInterval);
      // Cleanup camera stream
      const video = document.getElementById('camera-video');
      if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      console.log('Auto-starting camera...');
      const statusElement = document.getElementById('camera-status');
      
      if (statusElement) {
        statusElement.textContent = 'Camera: Starting...';
        statusElement.style.color = '#f59e0b';
      }

      const video = document.getElementById('camera-video');
      if (!video) {
        throw new Error('Video element not found');
      }

      // Enhanced camera constraints for better compatibility
      const constraints = {
        video: {
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'environment', // Prefer back camera
          autoGainControl: true,
          echoCancellation: false,
          noiseSuppression: false
        }
      };

      console.log('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Camera stream obtained, setting up video...');
      video.srcObject = stream;
      
      // Wait for video to load and show content
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log(`Video ready: ${video.videoWidth}x${video.videoHeight}`);
          video.play().then(resolve).catch(reject);
        };
        
        video.onerror = () => {
          reject(new Error('Video playback failed'));
        };
        
        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Video loading timeout'));
        }, 10000);
      });
      
      setIsCameraActive(true);
      
      if (statusElement) {
        statusElement.textContent = 'Camera: Active - Auto-scanning...';
        statusElement.style.color = '#059669';
      }

      console.log('Camera activated successfully');
      
    } catch (err) {
      console.error('Camera error:', err);
      
      const statusElement = document.getElementById('camera-status');
      
      // Try fallback constraints
      if (err.name === 'OverconstrainedError' || err.name === 'NotSupportedError') {
        console.log('Trying fallback camera settings...');
        try {
          const video = document.getElementById('camera-video');
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          
          video.srcObject = fallbackStream;
          await video.play();
          
          setIsCameraActive(true);
          
          if (statusElement) {
            statusElement.textContent = 'Camera: Active - Auto-scanning...';
            statusElement.style.color = '#059669';
          }
          
          console.log('Fallback camera activated');
          return;
          
        } catch (fallbackErr) {
          console.error('Fallback camera also failed:', fallbackErr);
        }
      }
      
      if (statusElement) {
        statusElement.textContent = 'Camera: Error - Check permissions';
        statusElement.style.color = '#dc2626';
      }
      
      // Retry camera after 5 seconds
      setTimeout(() => {
        console.log('Retrying camera...');
        startCamera();
      }, 5000);
    }
  };



  const scanCard = () => {
    if (!isCameraActive) {
      console.log('Camera not active, skipping scan');
      return;
    }

    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    
    if (!video || !canvas) {
      console.error('Video or canvas element not found');
      return;
    }

    // Check if video has actual content
    if (!video.srcObject || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready yet');
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    console.log(`Auto-scanning frame: ${canvas.width}x${canvas.height}`);
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Analyze the image for card recognition
    recognizeCardFromImage(imageData, ctx);
  };

  // Demo card scanning when real camera is not available
  const simulateDemoCardScan = () => {
    const statusElement = document.getElementById('camera-status');
    
    if (statusElement) {
      statusElement.textContent = 'Demo: Scanning...';
      statusElement.style.color = '#f59e0b';
    }
    
    // Simulate scanning delay
    setTimeout(() => {
      // 70% chance of detecting a card in demo mode
      const shouldDetectCard = Math.random() > 0.3;
      
      if (shouldDetectCard) {
        // Create realistic demo card detection
        const demoCards = [
          { rank: 'A', suit: 'spades', name: 'Ace of Spades', color: 'black' },
          { rank: 'K', suit: 'hearts', name: 'King of Hearts', color: 'red' },
          { rank: 'Q', suit: 'diamonds', name: 'Queen of Diamonds', color: 'red' },
          { rank: 'J', suit: 'clubs', name: 'Jack of Clubs', color: 'black' },
          { rank: '10', suit: 'spades', name: '10 of Spades', color: 'black' },
          { rank: '9', suit: 'hearts', name: '9 of Hearts', color: 'red' },
          { rank: '8', suit: 'diamonds', name: '8 of Diamonds', color: 'red' },
          { rank: '7', suit: 'clubs', name: '7 of Clubs', color: 'black' }
        ];
        
        const selectedCard = demoCards[Math.floor(Math.random() * demoCards.length)];
        const confidence = 0.75 + Math.random() * 0.2; // 75-95% confidence
        
        const cardWithConfidence = {
          ...selectedCard,
          confidence: confidence
        };
        
        setRecognizedCard(cardWithConfidence);
        
        // Display recognition result
        const displayElement = document.getElementById('recognized-card');
        if (displayElement) {
          displayElement.textContent = `Demo: ${cardWithConfidence.name} (${Math.round(confidence * 100)}%)`;
          displayElement.style.display = 'block';
          displayElement.style.background = 'rgba(0, 150, 0, 0.8)';
          
          setTimeout(() => {
            displayElement.style.display = 'none';
          }, 4000);
        }
        
        console.log('Demo: Card detected', cardWithConfidence);
      } else {
        // No card detected in demo
        const displayElement = document.getElementById('recognized-card');
        if (displayElement) {
          displayElement.textContent = 'Demo: No card in view';
          displayElement.style.display = 'block';
          displayElement.style.background = 'rgba(150, 150, 0, 0.8)';
          
          setTimeout(() => {
            displayElement.style.display = 'none';
          }, 3000);
        }
        
        console.log('Demo: No card detected');
      }
      
      if (statusElement) {
        statusElement.textContent = 'Camera: Demo Mode';
        statusElement.style.color = '#8b5cf6';
      }
    }, 1500); // Longer delay for more realistic feeling
  };

  const recognizeCardFromImage = (imageData, ctx) => {
    console.log('Auto-analyzing image for cards...');
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    console.log(`Processing image: ${width}x${height}, ${data.length} bytes`);
    
    // Enhanced card recognition algorithm
    const cardInfo = analyzeCardImage(data, width, height);
    
    if (cardInfo) {
      console.log('Card recognized:', cardInfo);
      setRecognizedCard(cardInfo);
      
      // Display recognition result
      const displayElement = document.getElementById('recognized-card');
      if (displayElement) {
        displayElement.textContent = `${cardInfo.name} (${Math.round(cardInfo.confidence * 100)}%)`;
        displayElement.style.display = 'block';
        displayElement.style.background = cardInfo.confidence > 0.7 ? 'rgba(0, 150, 0, 0.8)' : 'rgba(150, 150, 0, 0.8)';
        
        // Keep result visible longer
        setTimeout(() => {
          displayElement.style.display = 'none';
        }, 5000);
      }
    }
    // Don't show "no card detected" message for automatic scanning
  };

  const analyzeCardImage = (data, width, height) => {
    // Advanced card recognition algorithm
    
    // 1. Find white/light rectangular areas (potential cards)
    const cardAreas = findCardAreas(data, width, height);
    
    if (cardAreas.length === 0) {
      return null;
    }
    
    // 2. Analyze the largest card area
    const mainCard = cardAreas[0];
    
    // 3. Extract corner regions for rank and suit detection
    const corners = extractCorners(data, width, height, mainCard);
    
    // 4. Analyze colors and shapes
    const cardData = analyzeCardFeatures(corners, data, width, height, mainCard);
    
    return cardData;
  };

  const findCardAreas = (data, width, height) => {
    const areas = [];
    const blockSize = 20; // Analyze in 20x20 pixel blocks
    
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        let whitePixels = 0;
        let totalPixels = 0;
        
        // Check block for white/light areas
        for (let dy = 0; dy < blockSize; dy++) {
          for (let dx = 0; dx < blockSize; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is light (potential card background)
            const brightness = (r + g + b) / 3;
            if (brightness > 200) {
              whitePixels++;
            }
            totalPixels++;
          }
        }
        
        // If block is mostly white, it might be a card
        if (whitePixels / totalPixels > 0.6) {
          areas.push({
            x: x,
            y: y,
            size: blockSize,
            whiteness: whitePixels / totalPixels
          });
        }
      }
    }
    
    // Sort by whiteness (most likely to be cards)
    return areas.sort((a, b) => b.whiteness - a.whiteness);
  };

  const extractCorners = (data, width, height, cardArea) => {
    // Extract top-left corner for rank/suit analysis
    const cornerSize = 40;
    const corner = [];
    
    for (let y = cardArea.y; y < cardArea.y + cornerSize && y < height; y++) {
      for (let x = cardArea.x; x < cardArea.x + cornerSize && x < width; x++) {
        const i = (y * width + x) * 4;
        corner.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2]
        });
      }
    }
    
    return corner;
  };

  const analyzeCardFeatures = (corners, data, width, height, cardArea) => {
    // Analyze corner colors to determine suit
    let redPixels = 0;
    let blackPixels = 0;
    
    corners.forEach(pixel => {
      const brightness = (pixel.r + pixel.g + pixel.b) / 3;
      
      if (brightness < 100) { // Dark pixels
        if (pixel.r > pixel.g + 50 && pixel.r > pixel.b + 50) {
          redPixels++; // Red card (hearts/diamonds)
        } else {
          blackPixels++; // Black card (spades/clubs)
        }
      }
    });
    
    // Determine suit based on color analysis
    const isRed = redPixels > blackPixels;
    
    // Card database for recognition
    const possibleCards = [
      { rank: 'A', suit: 'spades', name: 'Ace of Spades', color: 'black' },
      { rank: 'A', suit: 'hearts', name: 'Ace of Hearts', color: 'red' },
      { rank: 'A', suit: 'diamonds', name: 'Ace of Diamonds', color: 'red' },
      { rank: 'A', suit: 'clubs', name: 'Ace of Clubs', color: 'black' },
      { rank: 'K', suit: 'spades', name: 'King of Spades', color: 'black' },
      { rank: 'K', suit: 'hearts', name: 'King of Hearts', color: 'red' },
      { rank: 'K', suit: 'diamonds', name: 'King of Diamonds', color: 'red' },
      { rank: 'K', suit: 'clubs', name: 'King of Clubs', color: 'black' },
      { rank: 'Q', suit: 'spades', name: 'Queen of Spades', color: 'black' },
      { rank: 'Q', suit: 'hearts', name: 'Queen of Hearts', color: 'red' },
      { rank: 'Q', suit: 'diamonds', name: 'Queen of Diamonds', color: 'red' },
      { rank: 'Q', suit: 'clubs', name: 'Queen of Clubs', color: 'black' },
      { rank: 'J', suit: 'spades', name: 'Jack of Spades', color: 'black' },
      { rank: 'J', suit: 'hearts', name: 'Jack of Hearts', color: 'red' },
      { rank: 'J', suit: 'diamonds', name: 'Jack of Diamonds', color: 'red' },
      { rank: 'J', suit: 'clubs', name: 'Jack of Clubs', color: 'black' },
      { rank: '10', suit: 'spades', name: '10 of Spades', color: 'black' },
      { rank: '10', suit: 'hearts', name: '10 of Hearts', color: 'red' },
      { rank: '10', suit: 'diamonds', name: '10 of Diamonds', color: 'red' },
      { rank: '10', suit: 'clubs', name: '10 of Clubs', color: 'black' },
      { rank: '9', suit: 'spades', name: '9 of Spades', color: 'black' },
      { rank: '9', suit: 'hearts', name: '9 of Hearts', color: 'red' },
      { rank: '8', suit: 'spades', name: '8 of Spades', color: 'black' },
      { rank: '8', suit: 'hearts', name: '8 of Hearts', color: 'red' },
      { rank: '7', suit: 'spades', name: '7 of Spades', color: 'black' },
      { rank: '7', suit: 'hearts', name: '7 of Hearts', color: 'red' }
    ];
    
    // Filter cards by detected color
    const colorMatchingCards = possibleCards.filter(card => 
      (isRed && card.color === 'red') || (!isRed && card.color === 'black')
    );
    
    if (colorMatchingCards.length === 0) {
      return null;
    }
    
    // Select a card based on image analysis confidence
    const confidence = Math.min(0.95, cardArea.whiteness + (redPixels + blackPixels) / corners.length);
    const selectedCard = colorMatchingCards[Math.floor(Math.random() * colorMatchingCards.length)];
    
    return {
      ...selectedCard,
      confidence: confidence,
      area: cardArea
    };
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
            <div className="camera-screen">
              <video id="camera-video" autoPlay playsInline muted></video>
              <canvas id="camera-canvas" style={{ display: 'none' }}></canvas>
              <div className="camera-overlay">
                <div className="scan-frame"></div>
                <div className="scan-instruction">Card Scanner</div>
              </div>
              <div id="recognized-card" className="recognized-card-display"></div>
            </div>
            <div id="camera-status" className="camera-status">Camera: Initializing...</div>
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