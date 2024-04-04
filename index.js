const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/routes.js');
const hbs = require(`hbs`);
const app = express();
const db = require('./models/db.js');

app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.static('files'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routes);

dotenv.config();
port = process.env.PORT;
hostname = process.env.HOSTNAME;

app.listen(port, function() {
    console.log('Server running at: ' + port);
});

db.connect();