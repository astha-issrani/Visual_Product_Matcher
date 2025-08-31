const similarityForm = document.querySelector('#similarityForm');
const searchImageUpload = document.getElementById('searchImageUpload');
const searchImageUrlInput = document.getElementById('searchImageUrl');
const uploadedImagePreview = document.getElementById('uploadedImagePreview');
const scoreFilter = document.getElementById('scoreFilter');
const scoreValue = document.getElementById('scoreValue');
const resultsContainer = document.getElementById('searchResults');
const originalProducts = document.getElementById('originalProducts');

let searchImageFile = null;
let searchImageUrl = '';
let cachedResults = [];

// Show preview when a file is selected
if (searchImageUpload) {
    searchImageUpload.addEventListener('change', (e) => {
        searchImageFile = e.target.files[0];
        if (searchImageUrlInput) {
            searchImageUrlInput.value = '';
            searchImageUrl = '';
        }
        if (searchImageFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                if (uploadedImagePreview) {
                    uploadedImagePreview.src = event.target.result;
                    uploadedImagePreview.style.display = 'block';
                }
            };
            reader.readAsDataURL(searchImageFile);
        } else if (uploadedImagePreview) {
            uploadedImagePreview.style.display = 'none';
            uploadedImagePreview.src = '';
        }
    });
}

// Show preview when a URL is entered
if (searchImageUrlInput) {
    searchImageUrlInput.addEventListener('input', (e) => {
        searchImageUrl = e.target.value;
        if (searchImageUpload) {
            searchImageUpload.value = '';
            searchImageFile = null;
        }
        if (uploadedImagePreview) {
            if (searchImageUrl) {
                uploadedImagePreview.src = searchImageUrl;
                uploadedImagePreview.style.display = 'block';
            } else {
                uploadedImagePreview.style.display = 'none';
                uploadedImagePreview.src = '';
            }
        }
    });
}

// Combined event listener for form submission and caching results
if (similarityForm) {
    similarityForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Show a loader and hide original products
        if (originalProducts) {
            originalProducts.style.display = 'none';
        }
        if (resultsContainer) {
            resultsContainer.innerHTML = '<h4>Searching for similar products...</h4>';
        }

        let imageData = searchImageFile;
        let isFile = true;
        if (searchImageUrl) {
            imageData = searchImageUrl;
            isFile = false;
        }

        if (!imageData) {
            console.error("Please select an image or enter a URL to search.");
            if (resultsContainer) {
                resultsContainer.innerHTML = '';
            }
            return;
        }

        let body;
        let headers = {};
        if (isFile) {
            body = new FormData();
            body.append('file', imageData);
        } else {
            body = JSON.stringify({ 'url': imageData });
            headers['Content-Type'] = 'application/json';
        }

        fetch('http://localhost:5000/find_similar', {
            method: 'POST',
            headers: headers,
            body: body,
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => {
                    throw new Error(error.error || 'Unknown error');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Similar products:', data.results);
            cachedResults = data.results; // Cache the results
            displaySimilarProducts(cachedResults);
        })
        .catch(error => {
            console.error('Error finding similar products:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = `<p class="text-danger">An error occurred: ${error.message}</p>`;
            }
        });
    });
}

function displaySimilarProducts(results) {
    if (!resultsContainer) {
        console.error("Results container not found.");
        return;
    }
    
    resultsContainer.innerHTML = '';

    let minScore = 0.40;
    if (scoreFilter) {
        minScore = parseFloat(scoreFilter.value);
    }

    const filteredResults = results.filter(product => product.score >= minScore);

    if (filteredResults.length === 0) {
        resultsContainer.innerHTML = `<p>No similar products found with a score above ${minScore.toFixed(2)}.</p>`;
        return;
    }

    filteredResults.forEach(product => {
        const col = document.createElement('div');
        col.className = 'product col';
        
        // Correctly handle the case where title, price, or discount might be missing
        const title = product.title || "Product";
        const price = product.price !== undefined ? `$${product.price}` : "N/A";
        const discount = product.discountPercentage !== undefined ? `${product.discountPercentage}%` : "0%";

        col.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${product.image_path}" class="card-img-top" alt="${title}" style="height:200px;width:240px; object-fit:cover;" />
                <div class="card-body d-flex flex-column justify-content-between">
                    <div class="text-center">
                        <h6 class="card-title">${title}</h6>
                        <p class="mb-1">Score: ${product.score.toFixed(2)}</p>
                        <p class="mb-1"><b>Price:</b> ${price}</p>
                        <p class="mb-1 text-success"><b>Discount:</b> ${discount}</p>
                    </div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(col);
    });
}

// Event listener for the score filter slider
scoreFilter?.addEventListener('input', () => {
    const minScore = parseFloat(scoreFilter.value);
    scoreValue.textContent = minScore.toFixed(2);
    if (cachedResults.length > 0) {
        displaySimilarProducts(cachedResults);
    }
});