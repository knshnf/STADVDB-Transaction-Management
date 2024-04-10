const dotenv = require('dotenv');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const routes = require('./routes/routes.js');
const hbs = require(`hbs`);
const app = express();
const db = require('./models/db.js');
const rc = require('./models/recoverer.js');

app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.static('files'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/', routes);
hbs.registerPartials(__dirname + '/views/partials');
hbs.registerHelper('eq', (a, b) => a == b)

rc.update_node(process.env.DEPLOYED)

dotenv.config();
port = process.env.PORT;
hostname = process.env.HOSTNAME;

app.listen(port, function() {
    console.log('[INFO] Server running at: ' + port);
});