import cv2
import mediapipe as mp
import easyocr
import numpy as np
import re

mp_face_detection = mp.solutions.face_detection
reader = easyocr.Reader(['en'])

def detect_and_mask(image_path, output_path):
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError("Could not read image")
    
    h, w, _ = image.shape
    mask_regions = []

    # 1. Face Detection
    with mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5) as face_detection:
        results = face_detection.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        if results.detections:
            for detection in results.detections:
                bbox = detection.location_data.relative_bounding_box
                x1 = int(bbox.xmin * w)
                y1 = int(bbox.ymin * h)
                x2 = int((bbox.xmin + bbox.width) * w)
                y2 = int((bbox.ymin + bbox.height) * h)
                
                # Clip to image bounds
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                
                mask_regions.append((x1, y1, x2, y2))

    # 2. Text Detection (Aadhaar, ID numbers)
    results = reader.readtext(image)
    aadhaar_pattern = re.compile(r'\d{4}\s\d{4}\s\d{4}|\d{12}')
    
    for (bbox, text, prob) in results:
        # Check for Aadhaar or generic long numbers
        clean_text = text.replace(" ", "")
        if aadhaar_pattern.search(text) or (len(clean_text) >= 10 and clean_text.isdigit()):
            (tl, tr, br, bl) = bbox
            x1, y1 = int(tl[0]), int(tl[1])
            x2, y2 = int(br[0]), int(br[1])
            mask_regions.append((x1, y1, x2, y2))
        
        # Also mask common labels like "Aadhaar", "License", "ID"
        low_text = text.lower()
        if any(keyword in low_text for keyword in ["aadhaar", "card", "number", "dob", "birth", "signature"]):
             (tl, tr, br, bl) = bbox
             x1, y1 = int(tl[0]), int(tl[1])
             x2, y2 = int(br[0]), int(br[1])
             mask_regions.append((x1, y1, x2, y2))

    # 3. Apply Masking (Irreversible Blur)
    masked_image = image.copy()
    for (x1, y1, x2, y2) in mask_regions:
        # Increase region slightly to ensure full coverage
        pad = 5
        x1, y1 = max(0, x1-pad), max(0, y1-pad)
        x2, y2 = min(w, x2+pad), min(h, y2+pad)
        
        roi = masked_image[y1:y2, x1:x2]
        # Strong Gaussian Blur
        blurred_roi = cv2.GaussianBlur(roi, (99, 99), 30)
        masked_image[y1:y2, x1:x2] = blurred_roi
        
        # Optional: Add a dark overlay to signify masking
        cv2.rectangle(masked_image, (x1, y1), (x2, y2), (0, 0, 0), 1)

    cv2.imwrite(output_path, masked_image)
    return mask_regions
