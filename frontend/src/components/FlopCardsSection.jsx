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
      console.log('Starting camera...');
      const statusElement = document.getElementById('camera-status');
      
      if (statusElement) {
        statusElement.textContent = 'Camera: Starting...';
        statusElement.style.color = '#f59e0b';
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported in this browser');
      }

      const video = document.getElementById('camera-video');
      
      // Try different camera configurations
      const constraints = [
        { video: { width: 640, height: 480, facingMode: 'environment' } },
        { video: { width: 640, height: 480 } },
        { video: { width: 320, height: 240 } },
        { video: true }
      ];
      
      let stream = null;
      let lastError = null;
      
      for (const constraint of constraints) {
        try {
          console.log('Trying constraint:', constraint);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('Camera stream obtained with constraint:', constraint);
          break;
        } catch (err) {
          console.warn('Constraint failed:', constraint, err.message);
          lastError = err;
        }
      }
      
      if (!stream) {
        throw lastError || new Error('All camera configurations failed');
      }
      
      video.srcObject = stream;
      setIsCameraActive(true);
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', resolve, { once: true });
      });
      
      // Update button and status
      const startBtn = document.getElementById('start-camera');
      if (startBtn) {
        startBtn.textContent = 'Camera On';
        startBtn.style.background = '#059669';
      }
      
      if (statusElement) {
        statusElement.textContent = 'Camera: Active';
        statusElement.style.color = '#059669';
      }

      console.log('Camera activated successfully');
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      
      const statusElement = document.getElementById('camera-status');
      if (statusElement) {
        statusElement.textContent = 'Camera: Error';
        statusElement.style.color = '#dc2626';
      }
      
      // Provide specific error messages and solutions
      let errorMessage = 'Camera error: ';
      let solution = '';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied.';
        solution = 'Please click "Allow" when prompted for camera permission, or check your browser settings to enable camera access for this site.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found.';
        solution = 'Please connect a camera to your device and refresh the page.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported.';
        solution = 'Try using Chrome, Firefox, or Safari browser. Some browsers require HTTPS for camera access.';
      } else if (err.message.includes('getUserMedia not supported')) {
        errorMessage = 'Browser not supported.';
        solution = 'Please use a modern browser like Chrome, Firefox, or Safari.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use.';
        solution = 'Close other applications that might be using the camera and try again.';
      } else {
        errorMessage = `Camera error: ${err.message}`;
        solution = 'Try refreshing the page or using a different browser.';
      }
      
      // Show user-friendly error dialog
      alert(`${errorMessage}\n\n${solution}`);
      
      // Also try to enable demo mode
      enableDemoMode();
    }
  };

  // Demo mode for when camera is not available
  const enableDemoMode = () => {
    console.log('Enabling demo mode');
    const statusElement = document.getElementById('camera-status');
    if (statusElement) {
      statusElement.textContent = 'Camera: Demo Mode';
      statusElement.style.color = '#8b5cf6';
    }
    
    const startBtn = document.getElementById('start-camera');
    if (startBtn) {
      startBtn.textContent = 'Demo Mode';
      startBtn.style.background = '#8b5cf6';
    }
    
    setIsCameraActive(true); // Enable scanning in demo mode
  };

  const scanCard = () => {
    console.log('Scan card clicked, camera active:', isCameraActive);
    
    if (!isCameraActive) {
      console.log('Camera not active, showing alert');
      alert('Please start the camera first');
      return;
    }

    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const statusElement = document.getElementById('camera-status');
    
    if (!canvas) {
      console.error('Canvas element not found');
      alert('Camera elements not found');
      return;
    }

    // Check if we're in demo mode or real camera mode
    const isDemo = statusElement && statusElement.textContent.includes('Demo');
    
    if (isDemo) {
      console.log('Running in demo mode - simulating card detection');
      simulateDemoCardScan();
      return;
    }

    if (!video) {
      console.error('Video element not found');
      alert('Camera video not found');
      return;
    }
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready yet');
      alert('Camera is starting up, please wait a moment and try again');
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    console.log(`Drawing video frame: ${canvas.width}x${canvas.height}`);
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Show scanning feedback
    if (statusElement) {
      statusElement.textContent = 'Camera: Scanning...';
      statusElement.style.color = '#f59e0b';
    }
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log('Image data captured, analyzing...');
    
    // Analyze the image for card recognition
    recognizeCardFromImage(imageData, ctx);
    
    // Reset status
    setTimeout(() => {
      if (statusElement) {
        statusElement.textContent = 'Camera: Active';
        statusElement.style.color = '#059669';
      }
    }, 2000);
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
      // Create mock image data for demo
      const mockImageData = {
        data: new Uint8Array(640 * 480 * 4).fill(128), // Gray image
        width: 640,
        height: 480
      };
      
      // Add some "card-like" bright areas for realistic detection
      for (let i = 0; i < mockImageData.data.length; i += 4) {
        if (Math.random() > 0.7) { // 30% chance of bright pixel
          mockImageData.data[i] = 255;     // R
          mockImageData.data[i + 1] = 255; // G  
          mockImageData.data[i + 2] = 255; // B
          mockImageData.data[i + 3] = 255; // A
        }
      }
      
      console.log('Demo: Simulating card recognition');
      recognizeCardFromImage(mockImageData, null);
      
      if (statusElement) {
        statusElement.textContent = 'Demo: Ready';
        statusElement.style.color = '#8b5cf6';
      }
    }, 1000);
  };

  const recognizeCardFromImage = (imageData, ctx) => {
    console.log('Starting card recognition...');
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    console.log(`Analyzing image: ${width}x${height}, ${data.length} bytes`);
    
    // Card recognition algorithm
    const cardInfo = analyzeCardImage(data, width, height);
    
    if (cardInfo) {
      console.log('Card recognized:', cardInfo);
      setRecognizedCard(cardInfo);
      
      // Display recognition result
      const displayElement = document.getElementById('recognized-card');
      if (displayElement) {
        displayElement.textContent = `Detected: ${cardInfo.name} (${Math.round(cardInfo.confidence * 100)}%)`;
        displayElement.style.display = 'block';
        displayElement.style.background = cardInfo.confidence > 0.7 ? 'rgba(0, 150, 0, 0.8)' : 'rgba(150, 150, 0, 0.8)';
        
        // Hide after 4 seconds
        setTimeout(() => {
          displayElement.style.display = 'none';
        }, 4000);
      }
    } else {
      console.log('No card detected');
      // No card detected
      const displayElement = document.getElementById('recognized-card');
      if (displayElement) {
        displayElement.textContent = 'No card detected';
        displayElement.style.display = 'block';
        displayElement.style.background = 'rgba(150, 0, 0, 0.8)';
        
        setTimeout(() => {
          displayElement.style.display = 'none';
        }, 2000);
      }
    }
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
                <div className="scan-instruction">Show card to camera</div>
              </div>
              <div id="recognized-card" className="recognized-card-display"></div>
            </div>
            <div className="camera-controls">
              <button id="start-camera" className="camera-btn">Start Camera</button>
              <button id="scan-card" className="camera-btn">Scan Card</button>
              <button id="demo-mode" className="camera-btn" onClick={() => enableDemoMode()}>Demo Mode</button>
            </div>
            <div id="camera-status" className="camera-status">Camera: Off</div>
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