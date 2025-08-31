const similarityForm = document.querySelector('#similarityForm');
const searchImageUpload = document.getElementById('searchImageUpload');
const searchImageUrlInput = document.getElementById('searchImageUrl');
const uploadedImagePreview = document.getElementById('uploadedImagePreview');

let searchImageFile = null;
let searchImageUrl = '';

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

if (similarityForm) {
    similarityForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Hide the original products container
        const originalProducts = document.getElementById('originalProducts');
        if (originalProducts) {
            originalProducts.style.display = 'none';
        }

        let imageData = searchImageFile;
        let isFile = true;

        if (searchImageUrl) {
            imageData = searchImageUrl;
            isFile = false;
        }

        if (!imageData) {
            console.error("Please select an image or enter a URL to search.");
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

        fetch('https://visual-matcher-api.onrender.com/find_similar', {
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
            displaySimilarProducts(data.results);
        })
        .catch(error => console.error('Error finding similar products:', error));
    });
}

function displaySimilarProducts(results) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) {
        console.error("Results container not found.");
        return;
    }

    resultsContainer.innerHTML = '';

    // Filter products with score >= value from slider
    const scoreFilter = document.getElementById('scoreFilter');
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

       col.innerHTML = `
    <div class="card h-100 shadow-sm">
        <img src="${product.image_path}" class="card-img-top" alt="${product.title}" style="height:200px;width:240px; object-fit:cover;" />
        <div class="card-body d-flex flex-column justify-content-between">
            <div class="text-center">
                <h6 class="card-title">${product.title || "Product"}</h6>
                <p class="mb-1">Score: ${product.score.toFixed(2)}</p>
                <p class="mb-1"><b>Price:</b> $${product.price ?? "N/A"}</p>
                <p class="mb-1 text-success"><b>Discount:</b> ${product.discountPercentage ?? 0}%</p>
            </div>
        </div>
    </div>
`;

        resultsContainer.appendChild(col);
    });
}
const scoreFilter = document.getElementById('scoreFilter');
const scoreValue = document.getElementById('scoreValue');
let cachedResults = [];

scoreFilter?.addEventListener('input', () => {
    const minScore = parseFloat(scoreFilter.value);
    scoreValue.textContent = minScore.toFixed(2);

    if (cachedResults.length > 0) {
        displaySimilarProducts(cachedResults);
    }
});

// In fetch handler, cache results after fetching
similarityForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    // ... existing fetch logic ...
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
    const mappedResults = data.products.map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        discountPercentage: product.discountPercentage,
        image_path: product.thumbnail,  // map thumbnail to image_path
        score: product.score !== undefined ? product.score : 1.0  // default score if missing
    }));

    cachedResults = mappedResults;
    displaySimilarProducts(cachedResults);
})
    .catch(error => console.error('Error finding similar products:', error));
});