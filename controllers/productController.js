const productModel = require('../models/productModel');
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads');

exports.getProducts = async (req, res) => {
  try {
    const products = await productModel.getProducts(req.query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Product image is required.' });
    }
    // Save file to disk for old logic
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = 'image-' + Date.now() + path.extname(req.file.originalname);
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    req.file.filename = filename; // for old logic
    // req.file.buffer is already set for BLOB
    const product = await productModel.createProduct(req.body, req.file);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error in createProduct:', error, req.body, req.file);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    let file = req.file;
    if (file) {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = 'image-' + Date.now() + path.extname(file.originalname);
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, file.buffer);
      file.filename = filename;
    }
    const product = await productModel.updateProduct(req.params.id, req.body, file);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const success = await productModel.deleteProduct(req.params.id);
    if (!success) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
