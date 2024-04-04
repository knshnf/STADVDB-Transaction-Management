const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/routes.js');
const hbs = require(`hbs`);
const app = express();
const mysql = require('mysql');

app.set('view engine', 'hbs');
app.use(express.static('public'));
app.use(express.static('files'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/', routes);

dotenv.config();
port = process.env.PORT;
hostname = process.env.HOSTNAME;
dbhost = process.env.MYSQLHOST;
dbport = process.env.MYSQLPORT;
dbuser = process.env.MYSQLUSER;
dbpass = process.env.MYSQLPASS;

var con = mysql.createConnection({
    host: dbhost,
    user: dbuser,
    password: dbpass,
    port: dbport
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to MySQL!");
});

app.listen(port, function() {
    console.log('Server running at: ' + port);
});