const { Article, User, Category } = require('../models');
const { Op } = require('sequelize');

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + '-' + Date.now();
};

exports.getArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, status = 'published' } = req.query;
    const offset = (page - 1) * limit;

    const where = { status };
    if (category) {
      const cat = await Category.findOne({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      articles: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getArticle = async (req, res) => {
  try {
    const article = await Article.findOne({
      where: { slug: req.params.slug },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar', 'bio'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment views
    article.viewsCount += 1;
    await article.save();

    res.json({ article });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const { title, content, excerpt, categoryId, featuredImage } = req.body;
    
    const slug = generateSlug(title);
    
    const article = await Article.create({
      title,
      slug,
      content,
      excerpt,
      categoryId,
      featuredImage,
      authorId: req.user.id,
      status: 'pending'
    });

    const fullArticle = await Article.findByPk(article.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ]
    });

    res.status(201).json({ article: fullArticle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, content, excerpt, categoryId, featuredImage, status } = req.body;
    
    if (title) {
      article.title = title;
      article.slug = generateSlug(title);
    }
    
    article.content = content || article.content;
    article.excerpt = excerpt || article.excerpt;
    article.categoryId = categoryId || article.categoryId;
    article.featuredImage = featuredImage || article.featuredImage;
    
    if (status && req.user.role === 'admin') {
      article.status = status;
      if (status === 'published') {
        article.publishedAt = new Date();
      }
    }

    await article.save();

    const fullArticle = await Article.findByPk(article.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ]
    });

    res.json({ article: fullArticle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await article.destroy();
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMyArticles = async (req, res) => {
  try {
    const articles = await Article.findAll({
      where: { authorId: req.user.id },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ articles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
