const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config('../.env');
dbhost = process.env.MYSQLHOST;
dbport = process.env.MYSQLPORT;
dbuser = process.env.MYSQLUSER;
dbpass = process.env.MYSQLPASS;
dbname = process.env.MYSQLNAME;

const con = mysql.createConnection({
    host: dbhost,
    user: dbuser,
    password: dbpass,
    port: dbport,
    database: dbname
});

const database = {
    connect: function() {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected to MySQL!");
        });
    },

    execute_query: function(query) {
        con.query(query, function(err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    }


}
module.exports = database;