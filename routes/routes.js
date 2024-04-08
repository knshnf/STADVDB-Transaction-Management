const express = require('express');
const app = express();
const controller = require('../controllers/controller.js');

app.get('/', controller.getIndex);
app.get('/create', controller.getCreate);
app.get('/view', controller.getView);
app.get('/update', controller.getUpdate);
app.get('/update/:id', controller.getUpdateForm);
app.get('/delete', controller.getDelete);
app.post('/create', controller.postCreate);
app.post('/delete', controller.postDelete);
app.post('/update', controller.postUpdate);


//Error
app.get('/*', controller.getError);

module.exports = app;