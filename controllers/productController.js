const productModel = require('../models/productModel');

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
    const product = await productModel.createProduct(req.body, req.file);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error in createProduct:', error, req.body, req.file);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await productModel.updateProduct(req.params.id, req.body, req.file);
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