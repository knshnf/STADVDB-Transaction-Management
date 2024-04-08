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

    execute_query: function(query, callback) {
        if (callback && typeof callback === 'function') {
            con.query(query, function(err, result, fields) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        } else {
            return con.query(query);
        }
    }
}
module.exports = database;