'use strict';
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const logger = require('./logger');

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

let products = JSON.parse(fs.readFileSync('./products.json'));

app.get('/', (req, res) => {
    res.render('index', { user: null, products });
});

app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.products.find(p => p.id === id);

    let similarProducts = [];
    if (product) {
        similarProducts = products.products.filter(p => 
            p.id !== product.id && 
            (p.category === product.category || p.brand === product.brand)
        );
    }
    res.render('product', { user: null, product, similarProducts });
});

app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
});