const categoryModel = require('../models/categoryModel');

exports.getCategories = async (req, res) => {
  try {
    const categories = await categoryModel.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = await categoryModel.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await categoryModel.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const success = await categoryModel.deleteCategory(req.params.id);
    if (!success) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubcategories = async (req, res) => {
  try {
    const subcategories = await categoryModel.getSubcategories(req.params.categoryId);
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSubcategory = async (req, res) => {
  try {
    const subcategory = await categoryModel.createSubcategory(req.params.categoryId, req.body);
    res.status(201).json(subcategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const subcategory = await categoryModel.updateSubcategory(req.params.id, req.body);
    if (!subcategory) return res.status(404).json({ error: 'Subcategory not found' });
    res.json(subcategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const success = await categoryModel.deleteSubcategory(req.params.id);
    if (!success) return res.status(404).json({ error: 'Subcategory not found' });
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
