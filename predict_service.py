import sys
import joblib
import numpy as np
import json
import base64
from io import BytesIO
from PIL import Image

def predict_from_pixels(pixel_data):
    """
    pixel_data: A flattened list of 64 normalized pixel values (0-1).
    """
    import os
    model_path = os.path.join(os.path.dirname(__file__), 'svm_digit_model.joblib')
    model = joblib.load(model_path)
    prediction = model.predict(np.array(pixel_data).reshape(1, -1))
    
    probabilities = model.predict_proba(np.array(pixel_data).reshape(1, -1))
    confidence = np.max(probabilities)
        
    return int(prediction[0]), float(confidence)

if __name__ == "__main__":
    # Expecting JSON input via stdin
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        # If we get a pixel array directly
        if 'pixels' in data:
            pixels = data['pixels']
            pred, conf = predict_from_pixels(pixels)
            print(json.dumps({"prediction": pred, "confidence": conf}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
