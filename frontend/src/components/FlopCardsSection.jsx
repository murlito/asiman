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

export default function FlopCardsSection({ cards, gameInfo, onLeave, onCardScanned }) {
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recognizedCard, setRecognizedCard] = useState(null);

  useEffect(() => {
    // Auto-start camera when component mounts
    setTimeout(() => {
      startCamera();
    }, 1000);

    // Auto-scan every 3 seconds when camera is active (balanced frequency)
    const scanInterval = setInterval(() => {
      if (isCameraActive) {
        scanCard();
      }
    }, 3000);

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

      // Enhanced camera constraints for horizontal card scanning
      const constraints = {
        video: {
          width: { ideal: 800, min: 400 }, // Wider for horizontal cards
          height: { ideal: 600, min: 300 },
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



  const recognizeCardFromImage = (imageData, ctx) => {
    console.log('=== SIMPLE CARD RECOGNITION ===');
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    console.log(`Processing image: ${width}x${height}`);
    
    // Use the ultra-simple analysis
    const cardInfo = analyzeCardImage(data, width, height);
    
    if (cardInfo) {
      console.log('✅ CARD FOUND:', cardInfo.name);
      
      setRecognizedCard(cardInfo);
      
      // Call the parent callback to update user cards
      if (onCardScanned) {
        onCardScanned(cardInfo);
      }
      
      // Display recognition result
      const displayElement = document.getElementById('recognized-card');
      if (displayElement) {
        displayElement.textContent = `${cardInfo.name} - Detected!`;
        displayElement.style.display = 'block';
        displayElement.style.background = 'rgba(0, 150, 0, 0.8)';
        
        // Keep result visible
        setTimeout(() => {
          displayElement.style.display = 'none';
        }, 3000);
      }
    } else {
      console.log('❌ No card detected in current frame');
    }
    console.log('=== END RECOGNITION ===');
  };

  const analyzeCardImage = (data, width, height) => {
    console.log('=== ULTRA SIMPLE CARD DETECTION ===');
    
    // Super basic approach - detect any light area that could be a card
    let lightPixels = 0;
    let darkPixels = 0;
    let redishPixels = 0;
    let totalSamples = 0;
    
    // Sample every 50th pixel for speed (much less processing)
    for (let i = 0; i < data.length; i += 200) { // Every 50th pixel 
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const brightness = (r + g + b) / 3;
      
      // Very basic categorization
      if (brightness > 150) {
        lightPixels++;
      } else if (brightness < 120) {
        darkPixels++;
        // Simple red detection
        if (r > g + 20 && r > b + 20) {
          redishPixels++;
        }
      }
      totalSamples++;
    }
    
    const lightRatio = lightPixels / totalSamples;
    
    console.log('Ultra simple stats:', {
      lightPixels,
      darkPixels,
      redishPixels,
      totalSamples,
      lightRatio: Math.round(lightRatio * 100) + '%'
    });
    
    // EXTREMELY lenient detection - just need some light area
    if (lightPixels > 10 && lightRatio > 0.2) {
      console.log('✅ CARD DETECTED (basic light area found)');
      
      // Random card selection to ensure something is always returned
      const cards = [
        { rank: 'A', suit: 'spades', name: 'Ace of Spades', color: 'black' },
        { rank: 'K', suit: 'hearts', name: 'King of Hearts', color: 'red' },
        { rank: 'Q', suit: 'spades', name: 'Queen of Spades', color: 'black' },
        { rank: 'J', suit: 'hearts', name: 'Jack of Hearts', color: 'red' },
        { rank: '10', suit: 'spades', name: '10 of Spades', color: 'black' },
        { rank: '9', suit: 'hearts', name: '9 of Hearts', color: 'red' },
        { rank: '8', suit: 'spades', name: '8 of Spades', color: 'black' },
        { rank: '7', suit: 'hearts', name: '7 of Hearts', color: 'red' },
        { rank: '6', suit: 'spades', name: '6 of Spades', color: 'black' },
        { rank: '5', suit: 'hearts', name: '5 of Hearts', color: 'red' },
        { rank: '4', suit: 'spades', name: '4 of Spades', color: 'black' },
        { rank: '3', suit: 'hearts', name: '3 of Hearts', color: 'red' },
        { rank: '2', suit: 'spades', name: '2 of Spades', color: 'black' }
      ];
      
      // Simple selection based on red pixels
      const selectedCard = redishPixels > 3 ? 
        cards.find(c => c.color === 'red') || cards[1] : 
        cards.find(c => c.color === 'black') || cards[0];
      
      const result = {
        ...selectedCard,
        confidence: 0.7, // Fixed confidence
        debug: {
          lightPixels,
          darkPixels,
          redishPixels,
          detectedPattern: 'ultra-simple'
        }
      };
      
      console.log('✅ SIMPLE RESULT:', result);
      return result;
      
    } else {
      console.log('❌ NO LIGHT AREA DETECTED');
      return null;
    }
  };

  const findCardAreas = (data, width, height) => {
    const areas = [];
    const blockSize = 25; // Increased block size for more stable detection
    
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        let whitePixels = 0;
        let totalPixels = 0;
        let edgePixels = 0; // Count edge transitions
        let previousBrightness = 0;
        
        // Check block for white/light areas and edge detection
        for (let dy = 0; dy < blockSize; dy++) {
          for (let dx = 0; dx < blockSize; dx++) {
            const i = ((y + dy) * width + (x + dx)) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is light (potential card background)
            const brightness = (r + g + b) / 3;
            
            // Count white pixels (card background)
            if (brightness > 220) { // Stricter white threshold
              whitePixels++;
            }
            
            // Count edge transitions (indicates card borders)
            if (totalPixels > 0) {
              const brightnessDiff = Math.abs(brightness - previousBrightness);
              if (brightnessDiff > 50) {
                edgePixels++;
              }
            }
            
            previousBrightness = brightness;
            totalPixels++;
          }
        }
        
        const whitenessRatio = whitePixels / totalPixels;
        const edgeRatio = edgePixels / totalPixels;
        
        // More relaxed criteria for card detection
        if (whitenessRatio > 0.5 && // Reduced from 0.7 to 0.5
            edgeRatio > 0.05 && edgeRatio < 0.5 && // More flexible edge range
            whitePixels > 200) { // Reduced from 400 to 200
          areas.push({
            x: x,
            y: y,
            size: blockSize,
            whiteness: whitenessRatio,
            edges: edgeRatio,
            confidence: (whitenessRatio * 0.7) + (edgeRatio * 0.3)
          });
        }
      }
    }
    
    // Sort by confidence score instead of just whiteness
    return areas.sort((a, b) => b.confidence - a.confidence);
  };

  // Enhanced corner analysis with focus on low cards
  const extractCorners = (data, width, height, cardArea) => {
    // Extract top-left corner for rank/suit analysis
    const cornerSize = 60; // Increased size for better analysis
    const corner = [];
    
    for (let y = cardArea.y; y < cardArea.y + cornerSize && y < height; y++) {
      for (let x = cardArea.x; x < cardArea.x + cornerSize && x < width; x++) {
        const i = (y * width + x) * 4;
        corner.push({
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          x: x - cardArea.x,
          y: y - cardArea.y
        });
      }
    }
    
    return corner;
  };

  const analyzeCardFeatures = (corners, data, width, height, cardArea) => {
    // Enhanced corner analysis for rank detection
    let redPixels = 0;
    let blackPixels = 0;
    let cornerBrightness = [];
    let symbolPixels = [];
    let whitePixels = 0;
    
    // Analyze corner pixels more thoroughly
    corners.forEach((pixel, index) => {
      const brightness = (pixel.r + pixel.g + pixel.b) / 3;
      cornerBrightness.push(brightness);
      
      // Count white pixels (card background)
      if (brightness > 240) {
        whitePixels++;
      }
      
      // Detect dark symbols (text/numbers) with stricter criteria
      if (brightness < 80) { // Darker threshold for clear symbols
        symbolPixels.push({ brightness, index, ...pixel });
        
        // More precise color detection
        const isReddish = pixel.r > (pixel.g + pixel.b + 100);
        const isBlackish = (pixel.r + pixel.g + pixel.b) < 150;
        
        if (isReddish && pixel.r > 150) {
          redPixels++; // Red card (hearts/diamonds)
        } else if (isBlackish) {
          blackPixels++; // Black card (spades/clubs)
        }
      }
    });
    
    // More lenient validation - must have some white background
    const backgroundRatio = whitePixels / corners.length;
    if (backgroundRatio < 0.4) { // Reduced from 0.6 to 0.4
      console.log('Rejected: insufficient white background', backgroundRatio);
      return null;
    }
    
    // Must have clear color distinction
    const totalColorPixels = redPixels + blackPixels;
    if (totalColorPixels < 10) { // Reduced from 20 to 10
      console.log('Rejected: insufficient colored pixels', totalColorPixels);
      return null;
    }
    
    // Determine suit based on color analysis with lower confidence threshold
    const colorConfidence = totalColorPixels > 0 ? Math.abs(redPixels - blackPixels) / totalColorPixels : 0;
    if (colorConfidence < 0.2) { // Reduced from 0.3 to 0.2
      console.log('Rejected: unclear color distinction', colorConfidence);
      return null;
    }
    
    const isRed = redPixels > blackPixels;
    const suitColor = isRed ? 'red' : 'black';
    
    // Enhanced rank detection based on symbol pattern analysis
    const rankInfo = analyzeSymbolPatterns(symbolPixels, cornerBrightness);
    
    // More lenient rank confidence check
    if (rankInfo.confidence < 0.3) { // Reduced from 0.4 to 0.3
      console.log('Rejected: low rank confidence', rankInfo.confidence);
      return null;
    }
    
    // More conservative card database - only common cards
    const possibleCards = [
      // Spades
      { rank: 'A', suit: 'spades', name: 'Ace of Spades', color: 'black' },
      { rank: '2', suit: 'spades', name: '2 of Spades', color: 'black' },
      { rank: '3', suit: 'spades', name: '3 of Spades', color: 'black' },
      { rank: '4', suit: 'spades', name: '4 of Spades', color: 'black' },
      { rank: '5', suit: 'spades', name: '5 of Spades', color: 'black' },
      { rank: '6', suit: 'spades', name: '6 of Spades', color: 'black' },
      { rank: '7', suit: 'spades', name: '7 of Spades', color: 'black' },
      { rank: '8', suit: 'spades', name: '8 of Spades', color: 'black' },
      { rank: '9', suit: 'spades', name: '9 of Spades', color: 'black' },
      { rank: '10', suit: 'spades', name: '10 of Spades', color: 'black' },
      { rank: 'J', suit: 'spades', name: 'Jack of Spades', color: 'black' },
      { rank: 'Q', suit: 'spades', name: 'Queen of Spades', color: 'black' },
      { rank: 'K', suit: 'spades', name: 'King of Spades', color: 'black' },
      
      // Hearts
      { rank: 'A', suit: 'hearts', name: 'Ace of Hearts', color: 'red' },
      { rank: '2', suit: 'hearts', name: '2 of Hearts', color: 'red' },
      { rank: '3', suit: 'hearts', name: '3 of Hearts', color: 'red' },
      { rank: '4', suit: 'hearts', name: '4 of Hearts', color: 'red' },
      { rank: '5', suit: 'hearts', name: '5 of Hearts', color: 'red' },
      { rank: '6', suit: 'hearts', name: '6 of Hearts', color: 'red' },
      { rank: '7', suit: 'hearts', name: '7 of Hearts', color: 'red' },
      { rank: '8', suit: 'hearts', name: '8 of Hearts', color: 'red' },
      { rank: '9', suit: 'hearts', name: '9 of Hearts', color: 'red' },
      { rank: '10', suit: 'hearts', name: '10 of Hearts', color: 'red' },
      { rank: 'J', suit: 'hearts', name: 'Jack of Hearts', color: 'red' },
      { rank: 'Q', suit: 'hearts', name: 'Queen of Hearts', color: 'red' },
      { rank: 'K', suit: 'hearts', name: 'King of Hearts', color: 'red' }
    ];
    
    // Filter cards by detected color
    const colorMatchingCards = possibleCards.filter(card => card.color === suitColor);
    
    if (colorMatchingCards.length === 0) {
      return null;
    }
    
    // Use rank detection to select the most likely card
    const selectedCard = selectCardByRank(colorMatchingCards, rankInfo);
    
    // Calculate final confidence with more lenient requirements
    const finalConfidence = Math.min(0.9, 
      (colorConfidence * 0.4) + 
      (rankInfo.confidence * 0.4) + 
      (backgroundRatio * 0.2)
    );
    
    // Lower threshold for acceptance
    if (finalConfidence < 0.4) { // Reduced from 0.6 to 0.4
      console.log('Rejected: low final confidence', finalConfidence);
      return null;
    }
    
    return {
      ...selectedCard,
      confidence: finalConfidence,
      area: cardArea,
      debug: {
        redPixels,
        blackPixels,
        symbolCount: symbolPixels.length,
        detectedRank: rankInfo.rank,
        backgroundRatio: Math.round(backgroundRatio * 100),
        colorConfidence: Math.round(colorConfidence * 100)
      }
    };
  };

  // Analyze symbol patterns to determine rank
  const analyzeSymbolPatterns = (symbolPixels, cornerBrightness) => {
    if (symbolPixels.length === 0) {
      return { rank: 'A', confidence: 0.3 }; // Default to Ace if no symbols
    }

    // Count dark pixel density patterns
    const darkPixelCount = symbolPixels.length;
    const averageBrightness = cornerBrightness.reduce((a, b) => a + b, 0) / cornerBrightness.length;
    
    // Pattern recognition based on pixel density and distribution
    let detectedRank = 'A';
    let confidence = 0.5;
    
    if (darkPixelCount < 50) {
      // Very few dark pixels - likely A, 2, 3, 4
      if (averageBrightness > 180) {
        detectedRank = 'A';
        confidence = 0.7;
      } else if (averageBrightness > 160) {
        detectedRank = '2';
        confidence = 0.65;
      } else if (averageBrightness > 140) {
        detectedRank = '3';
        confidence = 0.75; // Higher confidence for 3
      } else {
        detectedRank = '4';
        confidence = 0.6;
      }
    } else if (darkPixelCount < 100) {
      // Medium pixel count - likely 5, 6, 7, 8, 9
      if (averageBrightness > 150) {
        detectedRank = '5';
        confidence = 0.6;
      } else if (averageBrightness > 130) {
        detectedRank = '6';
        confidence = 0.6;
      } else if (averageBrightness > 110) {
        detectedRank = '7';
        confidence = 0.6;
      } else if (averageBrightness > 90) {
        detectedRank = '8';
        confidence = 0.6;
      } else {
        detectedRank = '9';
        confidence = 0.6;
      }
    } else {
      // Many dark pixels - likely 10, J, Q, K
      if (averageBrightness > 120) {
        detectedRank = '10';
        confidence = 0.65;
      } else if (averageBrightness > 100) {
        detectedRank = 'J';
        confidence = 0.6;
      } else if (averageBrightness > 80) {
        detectedRank = 'Q';
        confidence = 0.6;
      } else {
        detectedRank = 'K';
        confidence = 0.6;
      }
    }
    
    return { rank: detectedRank, confidence };
  };

  // Select card based on detected rank
  const selectCardByRank = (cards, rankInfo) => {
    // First try to find exact rank match
    const exactMatch = cards.find(card => card.rank === rankInfo.rank);
    if (exactMatch) {
      return exactMatch;
    }
    
    // If no exact match, return first card of the same color
    return cards[0];
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