const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { auth, authorize } = require('../middlewares/auth');

router.get('/', articleController.getArticles);
router.get('/:slug', articleController.getArticle);
router.get('/user/my-articles', auth, articleController.getMyArticles);

// Allow any authenticated user to create articles
router.post('/', auth, articleController.createArticle);
router.put('/:id', auth, articleController.updateArticle);
router.delete('/:id', auth, articleController.deleteArticle);

// Admin-only routes
router.put('/:id/status', auth, authorize('admin'), async (req, res) => {
  const { status } = req.body;
  const { Article } = require('../models');
  const article = await Article.findByPk(req.params.id);
  if (article) {
    article.status = status;
    if (status === 'published') {
      article.publishedAt = new Date();
    }
    await article.save();
    res.json({ article });
  } else {
    res.status(404).json({ error: 'Article not found' });
  }
});

module.exports = router;
