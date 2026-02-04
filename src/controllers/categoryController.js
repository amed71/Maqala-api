const { Category, Article } = require('../models');
const { Op } = require('sequelize');

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { parentId: null },
      include: [{
        model: Category,
        as: 'subcategories'
      }]
    });

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: Category, as: 'subcategories' },
        {
          model: Article,
          as: 'articles',
          where: { status: 'published' },
          required: false,
          limit: 10,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentId } = req.body;
    const slug = generateSlug(name);

    const category = await Category.create({
      name,
      slug,
      description,
      parentId
    });

    res.status(201).json({ category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const { name, description, parentId } = req.body;

    if (name) {
      category.name = name;
      category.slug = generateSlug(name);
    }

    category.description = description || category.description;
    category.parentId = parentId || category.parentId;

    await category.save();
    res.json({ category });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has articles
    const articleCount = await Article.count({ where: { categoryId: category.id } });
    if (articleCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with articles' });
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
