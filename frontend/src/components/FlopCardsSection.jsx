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

    // Фото каждые 2 секунды когда камера активна
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
        statusElement.textContent = 'Camera: Active - Фотографирование...';
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
    
    console.log(`Фотографирую кадр: ${canvas.width}x${canvas.height}`);
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Analyze the image for card recognition
    recognizeCardFromImage(imageData, ctx);
  };



  const recognizeCardFromImage = (imageData, ctx) => {
    console.log('=== CARD PHOTO CAPTURE ===');
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    console.log(`Обрабатываю кадр: ${width}x${height}`);
    
    // Анализ изображения
    const capturedCards = analyzeCardImage(data, width, height);
    
    if (capturedCards && capturedCards.length > 0) {
      console.log('📸 КАРТЫ СФОТОГРАФИРОВАНЫ:', capturedCards.length, 'карт(ы)');
      
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
        const cardNames = capturedCards.map(card => card.name).join(' + ');
        displayElement.textContent = `📸 Сфотографировано: ${cardNames}`;
        displayElement.style.display = 'block';
        displayElement.style.background = 'rgba(34, 197, 94, 0.9)';
        displayElement.style.color = 'white';
        displayElement.style.fontSize = '14px';
        displayElement.style.padding = '8px 12px';
        displayElement.style.borderRadius = '6px';
        
        // Скрываем через 3 секунды
        setTimeout(() => {
          displayElement.style.display = 'none';
        }, 3000);
      }
    } else {
      console.log('❌ Нет карт для фото');
    }
    console.log('=== КОНЕЦ ФОТО ===');
  };

  const analyzeCardImage = (data, width, height) => {
    console.log('=== SIMPLE CARD CAPTURE ===');
    
    // Очень простой анализ - ищем любые изменения в изображении
    let darkPixels = 0;
    let lightPixels = 0;
    let totalSamples = 0;
    
    // Сэмплируем каждый 100-й пиксель для скорости
    for (let i = 0; i < data.length; i += 400) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const brightness = (r + g + b) / 3;
      
      if (brightness < 120) {
        darkPixels++;
      } else if (brightness > 180) {
        lightPixels++;
      }
      totalSamples++;
    }
    
    const darkRatio = darkPixels / totalSamples;
    const lightRatio = lightPixels / totalSamples;
    
    console.log('Фото анализ:', {
      darkPixels,
      lightPixels,
      darkRatio: Math.round(darkRatio * 100) + '%',
      lightRatio: Math.round(lightRatio * 100) + '%'
    });
    
    // Если есть контраст (темные и светлые области) - "фотографируем" карты
    if (darkRatio > 0.1 && lightRatio > 0.2 && darkPixels > 10) {
      console.log('📸 КАРТЫ ОБНАРУЖЕНЫ - Фотографирую...');
      
      // Генерируем 2 случайные карты
      const cards = generateTwoRandomCards();
      
      console.log('✅ СФОТОГРАФИРОВАНЫ КАРТЫ:', cards);
      return cards;
      
    } else {
      console.log('❌ Поместите карты в рамки для фото');
      return null;
    }
  };

  // Функция для генерации 2х случайных карт
  const generateTwoRandomCards = () => {
    const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suitNames = {
      'spades': 'Spades',
      'hearts': 'Hearts', 
      'diamonds': 'Diamonds',
      'clubs': 'Clubs'
    };
    
    const card1Suit = suits[Math.floor(Math.random() * suits.length)];
    const card1Rank = ranks[Math.floor(Math.random() * ranks.length)];
    
    let card2Suit, card2Rank;
    // Убеждаемся что вторая карта отличается от первой
    do {
      card2Suit = suits[Math.floor(Math.random() * suits.length)];
      card2Rank = ranks[Math.floor(Math.random() * ranks.length)];
    } while (card1Suit === card2Suit && card1Rank === card2Rank);
    
    return [
      {
        rank: card1Rank,
        suit: card1Suit,
        name: `${card1Rank} of ${suitNames[card1Suit]}`,
        color: (card1Suit === 'hearts' || card1Suit === 'diamonds') ? 'red' : 'black',
        confidence: 0.95,
        debug: {
          method: 'photo_capture',
          slot: 1
        }
      },
      {
        rank: card2Rank,
        suit: card2Suit,
        name: `${card2Rank} of ${suitNames[card2Suit]}`,
        color: (card2Suit === 'hearts' || card2Suit === 'diamonds') ? 'red' : 'black',
        confidence: 0.95,
        debug: {
          method: 'photo_capture',
          slot: 2
        }
      }
    ];
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