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

    // Фото каждые 3 секунды когда камера активна (OpenCV обработка может занять время)
    const scanInterval = setInterval(async () => {
      if (isCameraActive) {
        await scanCard();
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
        statusElement.textContent = 'Camera: Active - OpenCV сканирует...';
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
            statusElement.textContent = 'Camera: Active - Фотографирование...';
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



  const scanCard = async () => {
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
    
    console.log(`Фотографирую кадр: ${canvas.width}x${canvas.height}`);
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Analyze the image for card recognition
    await recognizeCardFromImage(imageData, ctx);
  };



  const recognizeCardFromImage = async (imageData, ctx) => {
    console.log('=== OPENCV CARD RECOGNITION ===');
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const context = canvas.getContext('2d');
    context.putImageData(imageData, 0, 0);
    
    console.log(`Обрабатываю кадр: ${canvas.width}x${canvas.height}`);
    
    // Анализ изображения через OpenCV
    const capturedCards = await analyzeCardImage(canvas);
    
    if (capturedCards && capturedCards.length > 0) {
      console.log('📸 OPENCV КАРТЫ ОБНАРУЖЕНЫ:', capturedCards.length, 'карт(ы)');
      
      setRecognizedCard(capturedCards);
      
      // Отправляем каждую карту родительскому компоненту
      capturedCards.forEach(card => {
        if (onCardScanned) {
          onCardScanned(card);
        }
      });
      
      // Показываем результат
      const displayElement = document.getElementById('recognized-card');
      if (displayElement) {
        const cardNames = capturedCards.map(card => `${card.name} (${Math.round(card.confidence * 100)}%)`).join(' + ');
        displayElement.textContent = `🔍 OpenCV: ${cardNames}`;
        displayElement.style.display = 'block';
        displayElement.style.background = 'rgba(34, 197, 94, 0.9)';
        displayElement.style.color = 'white';
        displayElement.style.fontSize = '12px';
        displayElement.style.padding = '6px 10px';
        displayElement.style.borderRadius = '4px';
        
        // Скрываем через 4 секунды
        setTimeout(() => {
          displayElement.style.display = 'none';
        }, 4000);
      }
    } else {
      console.log('❌ OpenCV: Карты не найдены');
    }
    console.log('=== КОНЕЦ OPENCV ===');
  };

  const analyzeCardImage = async (canvas) => {
    console.log('=== OPENCV CARD DETECTION ===');
    
    try {
      // Convert canvas to base64
      const frameData = canvas.toDataURL('image/jpeg', 0.8);
      
      console.log('Отправляю кадр на OpenCV сервер...');
      
      // Send frame to backend for OpenCV processing  
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/scan-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frame_data: frameData
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log('📸 OpenCV ответ:', result);
      console.log(`⏱️ Время обработки: ${result.processing_time_ms}ms`);
      
      if (result.cards && result.cards.length > 0) {
        console.log(`✅ ОБНАРУЖЕНО ${result.cards.length} КАРТ(Ы):`);
        result.cards.forEach((card, idx) => {
          console.log(`   ${idx + 1}. ${card.name} (${Math.round(card.confidence * 100)}%)`);
        });
        
        return result.cards;
      } else {
        console.log('❌ Карты не обнаружены');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Ошибка OpenCV сканирования:', error);
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
                <div className="scan-frame">
                  <div className="scan-card-slot"></div>
                  <div className="scan-card-slot"></div>
                </div>
                <div className="scan-instruction">Место карты в слоты</div>
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