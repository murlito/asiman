############## OpenCV Playing Card Detector for FastAPI Backend ###############
#
# Based on EdjeElectronics OpenCV-Playing-Card-Detector
# Adapted for React + FastAPI integration
#

import numpy as np
import cv2
import os
import base64

### Constants ###
# Adaptive threshold levels
BKG_THRESH = 60
CARD_THRESH = 30

# Width and height of card corner, where rank and suit are
CORNER_WIDTH = 32
CORNER_HEIGHT = 84

# Dimensions of rank train images
RANK_WIDTH = 70
RANK_HEIGHT = 125

# Dimensions of suit train images
SUIT_WIDTH = 70
SUIT_HEIGHT = 100

RANK_DIFF_MAX = 2000
SUIT_DIFF_MAX = 700

CARD_MAX_AREA = 120000
CARD_MIN_AREA = 25000

### Structures to hold query card and train card information ###

class Query_card:
    """Structure to store information about query cards in the camera image."""
    
    def __init__(self):
        self.contour = []  # Contour of card
        self.width, self.height = 0, 0  # Width and height of card
        self.corner_pts = []  # Corner points of card
        self.center = []  # Center point of card
        self.warp = []  # 200x300, flattened, grayed, blurred image
        self.rank_img = []  # Thresholded, sized image of card's rank
        self.suit_img = []  # Thresholded, sized image of card's suit
        self.best_rank_match = "Unknown"  # Best matched rank
        self.best_suit_match = "Unknown"  # Best matched suit
        self.rank_diff = 0  # Difference between rank image and best matched train rank image
        self.suit_diff = 0  # Difference between suit image and best matched train suit image

class Train_ranks:
    """Structure to store information about train rank images."""
    
    def __init__(self):
        self.img = []  # Thresholded, sized rank image loaded from hard drive
        self.name = "Placeholder"

class Train_suits:
    """Structure to store information about train suit images."""
    
    def __init__(self):
        self.img = []  # Thresholded, sized suit image loaded from hard drive
        self.name = "Placeholder"

### Functions ###

def load_ranks(filepath):
    """Loads rank images from directory specified by filepath. Stores
    them in a list of Train_ranks objects."""
    
    train_ranks = []
    i = 0
    
    for Rank in ['Ace','Two','Three','Four','Five','Six','Seven',
                 'Eight','Nine','Ten','Jack','Queen','King']:
        
        train_ranks.append(Train_ranks())
        train_ranks[i].name = Rank
        filename = Rank + '.jpg'
        train_ranks[i].img = cv2.imread(filepath + filename, cv2.IMREAD_GRAYSCALE)
        i = i + 1
        
    return train_ranks

def load_suits(filepath):
    """Loads suit images from directory specified by filepath. Stores
    them in a list of Train_suits objects."""
    
    train_suits = []
    i = 0
    
    for Suit in ['Spades','Diamonds','Clubs','Hearts']:
        train_suits.append(Train_suits())
        train_suits[i].name = Suit
        filename = Suit + '.jpg'
        train_suits[i].img = cv2.imread(filepath + filename, cv2.IMREAD_GRAYSCALE)
        i = i + 1
        
    return train_suits

def preprocess_image(image):
    """Returns a grayed, blurred, and adaptively thresholded camera image."""
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    
    # Adaptive threshold based on background sampling
    img_w, img_h = np.shape(image)[:2]
    bkg_level = gray[int(img_h/100)][int(img_w/2)]
    thresh_level = bkg_level + BKG_THRESH
    
    retval, thresh = cv2.threshold(blur, thresh_level, 255, cv2.THRESH_BINARY)
    
    return thresh

def find_cards(thresh_image):
    """Finds all card-sized contours in a thresholded camera image.
    Returns the number of cards, and a list of card contours sorted
    from largest to smallest."""
    
    # Find contours and sort their indices by contour size
    try:
        contours, hierarchy = cv2.findContours(thresh_image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    except:
        # For older OpenCV versions
        dummy, contours, hierarchy = cv2.findContours(thresh_image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    index_sort = sorted(range(len(contours)), key=lambda i : cv2.contourArea(contours[i]), reverse=True)
    
    # If there are no contours, do nothing
    if len(contours) == 0:
        return [], []
    
    # Otherwise, initialize empty sorted contour and hierarchy lists
    cnts_sort = []
    hier_sort = []
    cnt_is_card = np.zeros(len(contours), dtype=int)
    
    # Fill empty lists with sorted contour and sorted hierarchy
    for i in index_sort:
        cnts_sort.append(contours[i])
        hier_sort.append(hierarchy[0][i])
    
    # Determine which of the contours are cards by applying criteria:
    # 1) Smaller area than the maximum card size
    # 2) Bigger area than the minimum card size
    # 3) Have no parents
    # 4) Have four corners
    for i in range(len(cnts_sort)):
        size = cv2.contourArea(cnts_sort[i])
        peri = cv2.arcLength(cnts_sort[i], True)
        approx = cv2.approxPolyDP(cnts_sort[i], 0.01*peri, True)
        
        if ((size < CARD_MAX_AREA) and (size > CARD_MIN_AREA) 
            and (hier_sort[i][3] == -1) and (len(approx) == 4)):
            cnt_is_card[i] = 1
            
    return cnts_sort, cnt_is_card

def preprocess_card(contour, image):
    """Uses contour to find information about the query card. Isolates rank
    and suit images from the card."""
    
    # Initialize new Query_card object
    qCard = Query_card()
    qCard.contour = contour
    
    # Find perimeter of card and use it to approximate corner points
    peri = cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, 0.01*peri, True)
    pts = np.float32(approx)
    qCard.corner_pts = pts
    
    # Find width and height of card's bounding rectangle
    x,y,w,h = cv2.boundingRect(contour)
    qCard.width, qCard.height = w, h
    
    # Find center point of card by taking x and y average of the four corners
    average = np.sum(pts, axis=0)/len(pts)
    cent_x = int(average[0][0])
    cent_y = int(average[0][1])
    qCard.center = [cent_x, cent_y]
    
    # Warp card into 200x300 flattened image using perspective transform
    qCard.warp = flattener(image, pts, w, h)
    
    # Grab corner of warped card image and do a 4x zoom
    Qcorner = qCard.warp[0:CORNER_HEIGHT, 0:CORNER_WIDTH]
    Qcorner_zoom = cv2.resize(Qcorner, (0,0), fx=4, fy=4)
    
    # Sample known white pixel intensity to determine good threshold level
    white_level = Qcorner_zoom[15, int((CORNER_WIDTH*4)/2)]
    thresh_level = white_level - CARD_THRESH
    if (thresh_level <= 0):
        thresh_level = 1
        
    retval, query_thresh = cv2.threshold(Qcorner_zoom, thresh_level, 255, cv2.THRESH_BINARY_INV)
    
    # Split in to top and bottom half (top shows rank, bottom shows suit)
    Qrank = query_thresh[20:185, 0:128]
    Qsuit = query_thresh[186:336, 0:128]
    
    # Find rank contour and bounding rectangle, isolate and find largest contour
    try:
        Qrank_cnts, hier = cv2.findContours(Qrank, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    except:
        dummy, Qrank_cnts, hier = cv2.findContours(Qrank, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    Qrank_cnts = sorted(Qrank_cnts, key=cv2.contourArea, reverse=True)
    
    # Find bounding rectangle for largest contour, use it to resize query rank
    # image to match dimensions of the train rank image
    if len(Qrank_cnts) != 0:
        x1,y1,w1,h1 = cv2.boundingRect(Qrank_cnts[0])
        Qrank_roi = Qrank[y1:y1+h1, x1:x1+w1]
        Qrank_sized = cv2.resize(Qrank_roi, (RANK_WIDTH,RANK_HEIGHT), 0, 0)
        qCard.rank_img = Qrank_sized
        
    # Find suit contour and bounding rectangle, isolate and find largest contour
    try:
        Qsuit_cnts, hier = cv2.findContours(Qsuit, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    except:
        dummy, Qsuit_cnts, hier = cv2.findContours(Qsuit, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    Qsuit_cnts = sorted(Qsuit_cnts, key=cv2.contourArea, reverse=True)
    
    # Find bounding rectangle for largest contour, use it to resize query suit
    # image to match dimensions of the train suit image
    if len(Qsuit_cnts) != 0:
        x2,y2,w2,h2 = cv2.boundingRect(Qsuit_cnts[0])
        Qsuit_roi = Qsuit[y2:y2+h2, x2:x2+w2]
        Qsuit_sized = cv2.resize(Qsuit_roi, (SUIT_WIDTH, SUIT_HEIGHT), 0, 0)
        qCard.suit_img = Qsuit_sized
        
    return qCard

def match_card(qCard, train_ranks, train_suits):
    """Finds best rank and suit matches for the query card. Differences
    the query card rank and suit images with the train rank and suit images.
    The best match is the rank or suit image that has the least difference."""
    
    best_rank_match_diff = 10000
    best_suit_match_diff = 10000
    best_rank_match_name = "Unknown"
    best_suit_match_name = "Unknown"
    
    # If no contours were found in query card in preprocess_card function,
    # the img size is zero, so skip the differencing process
    # (card will be left as Unknown)
    if (len(qCard.rank_img) != 0) and (len(qCard.suit_img) != 0):
        
        # Difference the query card rank image from each of the train rank images,
        # and store the result with the least difference
        for Trank in train_ranks:
            diff_img = cv2.absdiff(qCard.rank_img, Trank.img)
            rank_diff = int(np.sum(diff_img)/255)
            
            if rank_diff < best_rank_match_diff:
                best_rank_match_diff = rank_diff
                best_rank_name = Trank.name
                
        # Same process with suit images
        for Tsuit in train_suits:
            diff_img = cv2.absdiff(qCard.suit_img, Tsuit.img)
            suit_diff = int(np.sum(diff_img)/255)
            
            if suit_diff < best_suit_match_diff:
                best_suit_match_diff = suit_diff
                best_suit_name = Tsuit.name
                
        # Combine best rank match and best suit match to get query card's identity
        # If the best matches have too high of a difference value, card identity
        # is still Unknown
        if (best_rank_match_diff < RANK_DIFF_MAX):
            best_rank_match_name = best_rank_name
            
        if (best_suit_match_diff < SUIT_DIFF_MAX):
            best_suit_match_name = best_suit_name
            
    # Return the identity of the card and the quality of the suit and rank match
    return best_rank_match_name, best_suit_match_name, best_rank_match_diff, best_suit_match_diff

def flattener(image, pts, w, h):
    """Flattens an image of a card into a top-down 200x300 perspective.
    Returns the flattened, re-sized, grayed image."""
    
    temp_rect = np.zeros((4,2), dtype="float32")
    
    s = np.sum(pts, axis=2)
    tl = pts[np.argmin(s)]
    br = pts[np.argmax(s)]
    
    diff = np.diff(pts, axis=-1)
    tr = pts[np.argmin(diff)]
    bl = pts[np.argmax(diff)]
    
    # Need to create an array listing points in order of
    # [top left, top right, bottom right, bottom left]
    # before doing the perspective transform
    
    if w <= 0.8*h:  # If card is vertically oriented
        temp_rect[0] = tl
        temp_rect[1] = tr
        temp_rect[2] = br
        temp_rect[3] = bl
        
    if w >= 1.2*h:  # If card is horizontally oriented
        temp_rect[0] = bl
        temp_rect[1] = tl
        temp_rect[2] = tr
        temp_rect[3] = br
        
    # If the card is 'diamond' oriented, a different algorithm
    # has to be used to identify which point is top left, top right
    # bottom left, and bottom right.
    
    if w > 0.8*h and w < 1.2*h:  # If card is diamond oriented
        # If furthest left point is higher than furthest right point,
        # card is tilted to the left.
        if pts[1][0][1] <= pts[3][0][1]:
            # If card is titled to the left, approxPolyDP returns points
            # in this order: top right, top left, bottom left, bottom right
            temp_rect[0] = pts[1][0]  # Top left
            temp_rect[1] = pts[0][0]  # Top right
            temp_rect[2] = pts[3][0]  # Bottom right
            temp_rect[3] = pts[2][0]  # Bottom left
            
        # If furthest left point is lower than furthest right point,
        # card is tilted to the right
        if pts[1][0][1] > pts[3][0][1]:
            # If card is titled to the right, approxPolyDP returns points
            # in this order: top left, bottom left, bottom right, top right
            temp_rect[0] = pts[0][0]  # Top left
            temp_rect[1] = pts[3][0]  # Top right
            temp_rect[2] = pts[2][0]  # Bottom right
            temp_rect[3] = pts[1][0]  # Bottom left
            
    maxWidth = 200
    maxHeight = 300
    
    # Create destination array, calculate perspective transform matrix,
    # and warp card image
    dst = np.array([[0,0],[maxWidth-1,0],[maxWidth-1,maxHeight-1],[0, maxHeight-1]], np.float32)
    M = cv2.getPerspectiveTransform(temp_rect, dst)
    warp = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    warp = cv2.cvtColor(warp, cv2.COLOR_BGR2GRAY)
    
    return warp

def decode_base64_image(frame_data):
    """Decode base64 frame data to OpenCV image"""
    try:
        # Remove data URL prefix if present
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(frame_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        
        # Decode image
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return frame
        
    except Exception as e:
        print(f"Frame decoding failed: {e}")
        return None

def detect_cards_from_frame(frame_data, train_ranks=None, train_suits=None):
    """Main function to detect cards from base64 frame data"""
    
    # Decode frame
    image = decode_base64_image(frame_data)
    if image is None:
        return []
    
    # Preprocess image (gray, blur, threshold)
    pre_proc = preprocess_image(image)
    
    # Find and sort the contours of all cards in the image
    cnts_sort, cnt_is_card = find_cards(pre_proc)
    
    detected_cards = []
    
    # If there are contours, process them
    if len(cnts_sort) != 0:
        
        # For each contour detected:
        for i in range(len(cnts_sort)):
            if (cnt_is_card[i] == 1):
                
                # Create a card object from the contour
                card = preprocess_card(cnts_sort[i], image)
                
                # Find the best rank and suit match for the card
                if train_ranks and train_suits:
                    card.best_rank_match, card.best_suit_match, card.rank_diff, card.suit_diff = match_card(card, train_ranks, train_suits)
                
                # Convert to format for JSON response
                detected_card = {
                    'rank': convert_rank_name(card.best_rank_match),
                    'suit': convert_suit_name(card.best_suit_match),
                    'name': f"{convert_rank_name(card.best_rank_match)} of {convert_suit_name(card.best_suit_match)}",
                    'color': get_card_color(convert_suit_name(card.best_suit_match)),
                    'confidence': calculate_confidence(card.rank_diff, card.suit_diff),
                    'center': card.center,
                    'debug': {
                        'rank_diff': card.rank_diff,
                        'suit_diff': card.suit_diff,
                        'method': 'opencv_contour'
                    }
                }
                
                detected_cards.append(detected_card)
    
    return detected_cards

def convert_rank_name(rank_name):
    """Convert rank name from training format to standard format"""
    conversions = {
        'Ace': 'A',
        'Two': '2',
        'Three': '3', 
        'Four': '4',
        'Five': '5',
        'Six': '6',
        'Seven': '7',
        'Eight': '8',
        'Nine': '9',
        'Ten': '10',
        'Jack': 'J',
        'Queen': 'Q',
        'King': 'K',
        'Unknown': 'Unknown'
    }
    return conversions.get(rank_name, rank_name)

def convert_suit_name(suit_name):
    """Convert suit name from training format to standard format"""
    conversions = {
        'Spades': 'spades',
        'Hearts': 'hearts',
        'Diamonds': 'diamonds', 
        'Clubs': 'clubs',
        'Unknown': 'unknown'
    }
    return conversions.get(suit_name, suit_name.lower())

def get_card_color(suit):
    """Get card color based on suit"""
    red_suits = ['hearts', 'diamonds']
    return 'red' if suit in red_suits else 'black'

def calculate_confidence(rank_diff, suit_diff):
    """Calculate confidence score based on difference values"""
    # Lower difference = higher confidence
    max_diff = RANK_DIFF_MAX + SUIT_DIFF_MAX
    total_diff = rank_diff + suit_diff
    
    # Convert to confidence score (0-1)
    confidence = max(0, 1 - (total_diff / max_diff))
    return round(confidence, 3)