'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    dialect: config.dialect,
    host: config.host,
    // Add other Sequelize configuration options here as needed
  }
);

const models = {
  User: sequelize.import('./user'),       // Adjust the paths to your model files
  Post: sequelize.import('./post'),       // Adjust the paths to your model files
  Comment: sequelize.import('./comment'), // Adjust the paths to your model files
  Reply: sequelize.import('./reply'),     // Adjust the paths to your model files
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
