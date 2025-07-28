const productModel = require('../models/productModel');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

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

    // Upload to Cloudinary for fast CDN delivery
    let cloudinaryUrl = null;
    try {
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'saigame-products',
            transformation: [
              { width: 800, height: 600, crop: 'fill' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', result.secure_url);
              resolve(result.secure_url);
            }
          }
        );
        uploadStream.end(req.file.buffer);
      });

      cloudinaryUrl = await uploadPromise;
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError);
    }

    // Save file to disk for backup (existing logic)
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = 'image-' + Date.now() + path.extname(req.file.originalname);
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    req.file.filename = filename;

    // Use Cloudinary URL if available, otherwise fallback to local path
    const imageUrl = cloudinaryUrl || `/uploads/${filename}`;
    
    const product = await productModel.createProduct(req.body, req.file, imageUrl);
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
