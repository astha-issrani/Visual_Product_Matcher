from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import clip
from PIL import Image
import numpy as np
import pickle
from sklearn.metrics.pairwise import cosine_similarity
import os
import requests 
from io import BytesIO 

app = Flask(__name__)
CORS(app)

# --- Load all necessary components on startup ---
device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device, jit=False, download_root=".")

# Load pre-computed embeddings and valid paths (which are now URLs)
with open("product_embeddings.pkl", "rb") as f:
    data = pickle.load(f)
    embeddings = data['embeddings']
    valid_paths = data['paths']

# --- API endpoint for finding similar images ---
@app.route('/find_similar', methods=['POST'])
def find_similar_images():
    image = None
    try:
        if request.headers.get('Content-Type') == 'application/json':
            # Handle URL input
            data = request.get_json()
            if 'url' not in data or not data['url']:
                return jsonify({"error": "No URL provided"}), 400
            
            image_url = data['url']
            response = requests.get(image_url, timeout=10)
            image_data = BytesIO(response.content)
            image = Image.open(image_data)
        else:
            # Handle file upload
            if 'file' not in request.files:
                return jsonify({"error": "No file part in the request"}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No selected file"}), 400
            
            image = Image.open(file.stream)

        # Process the image with the CLIP model
        preprocessed_image = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            query_feat = model.encode_image(preprocessed_image)
        query_feat /= query_feat.norm(dim=-1, keepdim=True)

        # Calculate cosine similarity
        sims = cosine_similarity(query_feat.cpu().numpy(), embeddings)[0]
        top_k = 5
        top_idx = sims.argsort()[-top_k:][::-1]

        # Prepare the list of results
        results = []
        for i in top_idx:
            results.append({
                "image_path": valid_paths[i],
                "score": float(sims[i])
            })
        
        return jsonify({"results": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)