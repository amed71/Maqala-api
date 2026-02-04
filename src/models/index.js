const sequelize = require('../config/database');
const User = require('./User');
const Article = require('./Article');
const Category = require('./Category');
const Comment = require('./Comment');

// Define associations
User.hasMany(Article, { foreignKey: 'authorId', as: 'articles' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Category.hasMany(Article, { foreignKey: 'categoryId', as: 'articles' });
Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Category.hasMany(Category, { foreignKey: 'parentId', as: 'subcategories' });

Article.hasMany(Comment, { foreignKey: 'articleId', as: 'comments' });
Comment.belongsTo(Article, { foreignKey: 'articleId', as: 'article' });

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

module.exports = {
  sequelize,
  User,
  Article,
  Category,
  Comment
};
