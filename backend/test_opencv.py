#!/usr/bin/env python3
"""
Test the OpenCV card scanner with a simple test image
"""

import cv2
import numpy as np
import base64
import requests
import json

def create_test_card_image():
    """Create a simple test image with a white card-like rectangle"""
    # Create black background
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Draw white rectangle (card)
    cv2.rectangle(img, (200, 150), (350, 300), (255, 255, 255), -1)
    
    # Add black border 
    cv2.rectangle(img, (200, 150), (350, 300), (0, 0, 0), 3)
    
    # Add some text to simulate card
    cv2.putText(img, 'A', (250, 200), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 3)
    cv2.putText(img, '♠', (250, 250), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 0), 3)
    
    return img

def test_opencv_api():
    """Test the OpenCV API endpoint"""
    
    # Create test image
    test_img = create_test_card_image()
    
    # Save test image for debugging
    cv2.imwrite('/app/backend/test_card.jpg', test_img)
    print("✅ Test card image saved as test_card.jpg")
    
    # Convert to base64
    _, buffer = cv2.imencode('.jpg', test_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    frame_data = f"data:image/jpeg;base64,{img_base64}"
    
    # Test API
    try:
        response = requests.post(
            'http://localhost:8001/api/scan-cards',
            json={'frame_data': frame_data},
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Response:")
            print(json.dumps(result, indent=2))
            
            if result['cards']:
                print(f"\n🎯 Detected {len(result['cards'])} card(s):")
                for i, card in enumerate(result['cards']):
                    print(f"  {i+1}. {card['name']} ({card['confidence']*100:.1f}%)")
            else:
                print("❌ No cards detected")
                
        else:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    print("🧪 Testing OpenCV Card Scanner API...")
    test_opencv_api()