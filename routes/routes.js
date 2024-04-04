const express = require('express');
const app = express();
const controller = require('../controllers/controller.js');

app.get('/', controller.getIndex);
app.get('/create', controller.getCreate);
app.get('/view', controller.getView);
app.get('/update', controller.getUpdate);
app.get('/delete', controller.getDelete);


//Error
app.get('/*', controller.getError);

module.exports = app;