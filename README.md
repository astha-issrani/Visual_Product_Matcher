## Project Title: Visual Product Matcher

## Description: A full-stack web application that uses a Python backend with the CLIP model to find visually similar products. The Node.js frontend allows users to upload an image or provide a URL, and the Python microservice returns a list of similar products from a pre-defined JSON file.

## Table of Contents

1. Project Description

2. Features

3. Technology Stack

4. Setup and Installation

5. Usage

## Features

~Image-based Search: Users can search for products by uploading an image or providing a URL.

~Visual Similarity: The Python backend uses the CLIP model to find visually similar products.

~Dynamic UI: The Node.js frontend dynamically displays the search results and hides the original product list.

## Technology Stack

# Frontend:

Node.js: As the server environment.

Express.js: For routing and serving the web application.

EJS: For templating the web pages.

HTML, CSS, JavaScript: For the core frontend experience.

Bootstrap: For responsive styling and UI components.

# Backend (Microservice):

Python: To run the machine learning model.

Flask: A micro web framework for the API endpoint.

PyTorch/Torchvision: The deep learning framework for the CLIP model.

CLIP (by OpenAI): The model used to generate image embeddings.

scikit-learn: For calculating cosine similarity between image embeddings.

Pandas & NumPy: For data handling and numerical operations.

## Setup and Installation

~Clone the Repository:

Bash

git clone https://github.com/astha-issrani/Visual_Product_Matcher.git
cd Visual_Product_Matcher

~Set up the Node.js Frontend:

Bash

cd Shop_App
npm install
~Set up the Python Backend:

Bash

cd ../recommender-service
pip install -r requirements.txt
Note: You will need to create a requirements.txt file by running pip freeze > requirements.txt in your Python directory.

Generate Image Embeddings:

Bash

python generate_embeddings.py
This will download the images from the products.json file and create the product_embeddings.pkl file.

Run Both Servers:

Terminal 1 (Python):

Bash

cd recommender-service
python app.py
Terminal 2 (Node.js):

Bash

cd ../Shop_App
node server.js

## Usage

Open your web browser and navigate to http://localhost:3000.

Use the form to either upload an image or paste an image URL.

Click "Search" to view the similar products.
