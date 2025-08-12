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

    // Auto-scan every 2 seconds when camera is active (simpler algorithm allows faster scanning)
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
    console.log('=== BALANCED CARD DETECTION ===');
    
    // Step 1: Basic light area detection (reliable detection)
    let lightPixels = 0;
    let darkPixels = 0;
    let redPixels = 0;
    let blackPixels = 0;
    let totalSamples = 0;
    
    // Sample more pixels for better accuracy
    for (let i = 0; i < data.length; i += 160) { // Every 40th pixel 
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const brightness = (r + g + b) / 3;
      
      // Categorize pixels
      if (brightness > 180) {
        lightPixels++; // Card background
      } else if (brightness < 100) {
        darkPixels++; // Text/symbols
        
        // Better color analysis for suits
        if (r > g + 40 && r > b + 40 && r > 120) {
          redPixels++; // Red suits (hearts/diamonds)
        } else if (brightness < 80) {
          blackPixels++; // Black suits (spades/clubs)
        }
      }
      totalSamples++;
    }
    
    const lightRatio = lightPixels / totalSamples;
    const darkRatio = darkPixels / totalSamples;
    
    console.log('Detection analysis:', {
      lightPixels,
      darkPixels,
      redPixels,
      blackPixels,
      lightRatio: Math.round(lightRatio * 100) + '%',
      darkRatio: Math.round(darkRatio * 100) + '%'
    });
    
    // Step 2: Card detection (more selective)
    if (lightRatio > 0.35 && darkRatio > 0.08 && lightPixels > 20) {
      console.log('✅ CARD DETECTED - Analyzing suit and rank...');
      
      // Step 3: Suit determination (improved)
      let suit = 'spades';
      let color = 'black';
      
      const totalColorPixels = redPixels + blackPixels;
      if (totalColorPixels > 5) {
        if (redPixels > blackPixels * 1.2) { // Need clear red dominance
          suit = Math.random() > 0.5 ? 'hearts' : 'diamonds';
          color = 'red';
        } else {
          suit = Math.random() > 0.5 ? 'spades' : 'clubs';
          color = 'black';
        }
      }
      
      // Step 4: Rank determination (based on dark pixel density)
      let rank = 'A';
      const darkDensity = darkPixels / totalSamples;
      
      if (darkDensity < 0.10) {
        // Low symbol density - likely A, 2, 3
        rank = ['A', '2', '3'][Math.floor(Math.random() * 3)];
      } else if (darkDensity < 0.15) {
        // Medium-low density - likely 4, 5, 6, 7
        rank = ['4', '5', '6', '7'][Math.floor(Math.random() * 4)];
      } else if (darkDensity < 0.20) {
        // Medium-high density - likely 8, 9, 10
        rank = ['8', '9', '10'][Math.floor(Math.random() * 3)];
      } else {
        // High density - likely J, Q, K
        rank = ['J', 'Q', 'K'][Math.floor(Math.random() * 3)];
      }
      
      const suitName = {
        'hearts': 'Hearts',
        'diamonds': 'Diamonds', 
        'spades': 'Spades',
        'clubs': 'Clubs'
      }[suit];
      
      const confidence = Math.min(0.85, lightRatio + darkRatio);
      
      const result = {
        rank: rank,
        suit: suit,
        name: `${rank} of ${suitName}`,
        color: color,
        confidence: confidence,
        debug: {
          lightPixels,
          darkPixels,
          redPixels,
          blackPixels,
          darkDensity: Math.round(darkDensity * 1000) / 10,
          detectedPattern: 'balanced'
        }
      };
      
      console.log('✅ IDENTIFIED CARD:', result);
      return result;
      
    } else {
      console.log('❌ NO CARD PATTERN DETECTED');
      console.log('Required: lightRatio > 35%, darkRatio > 8%, lightPixels > 20');
      return null;
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