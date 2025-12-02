import os
import tensorflow as tf
from flask import Flask, request, jsonify, render_template
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
import numpy as np
from PIL import Image
import io
import gdown

app = Flask(__name__)

# Define global model variable
model = None

def load_model_once():
    global model
    if model is None:  # Check if the model is already loaded
        file_id = '1Q8YCGdl16MNrTaMlZnCHcd1eQnHM-CXx'
        output = 'potato_model.h5'
        
        # Download the model file from Google Drive if not already downloaded
        gdown.download(f'https://drive.google.com/uc?id={file_id}', output, quiet=False)
        
        # Load the model after downloading
        model = tf.keras.models.load_model(output)
        print("Model loaded successfully.")
    return model

@app.route('/')
def index():
    return render_template('index.html')

img_height = 256  # Adjust as needed (model input size)
img_width = 256   # Adjust as needed (model input size)
class_labels = {1: 'potato_healthy', 0: 'potato_early_blight', 2: 'potato_late_blight'}

@app.route('/predict', methods=['POST'])
def predict():
    # Load the model once (if not already loaded)
    model = load_model_once()

    # Get the uploaded image file
    file = request.files['image']
    
    # Load the image using PIL
    img = Image.open(io.BytesIO(file.read()))
    
    # If the image has an alpha channel, remove it (convert to RGB)
    if img.mode == 'RGBA':
        img = img.convert('RGB')

    # Resize the image to the required input size for the model
    img = img.resize((img_width, img_height))  # Resize to match model input size
    
    # Convert the image to a numpy array (uint8 format - range 0-255)
    img = img_to_array(img)  # Automatically converts to uint8 format
    img = img.astype('float32') / 255.0  # Normalize to range [0, 1]
    img = np.expand_dims(img, axis=0)  # Add batch dimension
    
    # Make the prediction using the trained model
    predictions = model.predict(img)
    
    # Get the predicted class label and corresponding probability
    predicted_label = np.argmax(predictions[0])  # Index of the class with the highest confidence
    probability = predictions[0][predicted_label]
    
    # Map the predicted label index to the class label
    predicted_class = class_labels[predicted_label]
    
    # Return the predicted class and probability as JSON
    return jsonify({'prediction': predicted_class, 'probability': float(probability)})