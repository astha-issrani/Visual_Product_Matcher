import json
import torch
import clip
from PIL import Image
import numpy as np
from tqdm import tqdm
import pickle
import requests
from io import BytesIO

# Load data from your products.json file
with open('../shop_app/shop_app/products.json', 'r') as f:
    products_data = json.load(f)

# Create a list of image URLs from the product data
product_images = []
for p in products_data['products']:
    product_images.append({
        'id': p['id'],
        'url': p['thumbnail']
    })

print("✅ Loaded product data from products.json")
print("Total products:", len(product_images))

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)
print("✅ CLIP model loaded on", device)

embeddings = []
valid_paths = []

for product in tqdm(product_images):
    try:
        # Download the image from the URL
        response = requests.get(product['url'], timeout=10)
        
        # Raise an exception for bad status codes (4xx or 5xx)
        response.raise_for_status() 
        
        image = Image.open(BytesIO(response.content))

        preprocessed_image = preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            features = model.encode_image(preprocessed_image)
        features /= features.norm(dim=-1, keepdim=True) # normalize
        embeddings.append(features.cpu().numpy())
        valid_paths.append(product['url']) # Use the URL as the path

    except Exception as e:
        print("❌ Error with product ID:", product['id'], "URL:", product['url'], e)
        # Use a continue statement to skip to the next product if there's an error
        continue

embeddings = np.vstack(embeddings)
print("✅ Embeddings shape:", embeddings.shape)

with open("product_embeddings.pkl", "wb") as f:
    pickle.dump({"paths": valid_paths, "embeddings": embeddings}, f)

print("✅ Embeddings saved to product_embeddings.pkl")