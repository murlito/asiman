#!/usr/bin/env python3
"""
Create simple training images for card detection
This creates basic black text on white background images for ranks and suits
"""

import cv2
import numpy as np
import os

# Create Card_Imgs directory if it doesn't exist
os.makedirs('/app/backend/Card_Imgs', exist_ok=True)

def create_rank_image(rank_name, rank_symbol):
    """Create a rank training image"""
    # Create white background
    img = np.ones((125, 70), dtype=np.uint8) * 255
    
    # Add text
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 2.0
    color = 0  # Black
    thickness = 3
    
    # Get text size to center it
    text_size = cv2.getTextSize(rank_symbol, font, font_scale, thickness)[0]
    text_x = (img.shape[1] - text_size[0]) // 2
    text_y = (img.shape[0] + text_size[1]) // 2
    
    # Put text on image
    cv2.putText(img, rank_symbol, (text_x, text_y), font, font_scale, color, thickness)
    
    # Save image
    filename = f'/app/backend/Card_Imgs/{rank_name}.jpg'
    cv2.imwrite(filename, img)
    print(f"Created {filename}")

def create_suit_image(suit_name, suit_symbol):
    """Create a suit training image"""
    # Create white background
    img = np.ones((100, 70), dtype=np.uint8) * 255
    
    # Add text
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 2.5
    color = 0  # Black
    thickness = 4
    
    # Get text size to center it
    text_size = cv2.getTextSize(suit_symbol, font, font_scale, thickness)[0]
    text_x = (img.shape[1] - text_size[0]) // 2
    text_y = (img.shape[0] + text_size[1]) // 2
    
    # Put text on image
    cv2.putText(img, suit_symbol, (text_x, text_y), font, font_scale, color, thickness)
    
    # Save image
    filename = f'/app/backend/Card_Imgs/{suit_name}.jpg'
    cv2.imwrite(filename, img)
    print(f"Created {filename}")

# Create rank images
ranks = [
    ('Ace', 'A'),
    ('Two', '2'),
    ('Three', '3'),
    ('Four', '4'),
    ('Five', '5'),
    ('Six', '6'),
    ('Seven', '7'),
    ('Eight', '8'),
    ('Nine', '9'),
    ('Ten', '10'),
    ('Jack', 'J'),
    ('Queen', 'Q'),
    ('King', 'K')
]

print("Creating rank training images...")
for rank_name, rank_symbol in ranks:
    create_rank_image(rank_name, rank_symbol)

# Create suit images
suits = [
    ('Spades', '♠'),
    ('Hearts', '♥'),
    ('Diamonds', '♦'),
    ('Clubs', '♣')
]

print("\nCreating suit training images...")
for suit_name, suit_symbol in suits:
    create_suit_image(suit_name, suit_symbol)

print("\nAll training images created successfully!")