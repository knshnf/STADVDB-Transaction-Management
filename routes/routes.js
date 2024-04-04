const express = require('express');
const app = express();
const controller = require('../controllers/controller.js');

app.get('/', controller.getIndex);
app.get('/create', controller.getCreate);


//Error
app.get('/*', controller.getError);

module.exports = app;