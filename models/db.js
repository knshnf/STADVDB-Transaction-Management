const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config('../.env');
dbhost = process.env.MYSQLHOST;
dbport = process.env.MYSQLPORT;
dbuser = process.env.MYSQLUSER;
dbpass = process.env.MYSQLPASS;

const con = mysql.createConnection({
    host: dbhost,
    user: dbuser,
    password: dbpass,
    port: dbport
});

const database = {
    connect: function() {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected to MySQL!");
        });
    }
}

module.exports = database;