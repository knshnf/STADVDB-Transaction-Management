const mysql = require('mysql');
const dotenv = require('dotenv');

dotenv.config('../.env');

const central_node = mysql.createPool({
    host: process.env.MYSQLHOST1,
    port: process.env.MYSQLPORT1,
    user: process.env.MYSQLUSER1,
    password: process.env.MYSQLPASS1,
    database: process.env.MYSQLNAME1,
});

const luzon_node = mysql.createPool({
    host: process.env.MYSQLHOST2,
    port: process.env.MYSQLPORT2,
    user: process.env.MYSQLUSER2,
    password: process.env.MYSQLPASS2,
    database: process.env.MYSQLNAME2,
});

const vismin_node = mysql.createPool({
    host: process.env.MYSQLHOST3,
    port: process.env.MYSQLPORT3,
    user: process.env.MYSQLUSER3,
    password: process.env.MYSQLPASS3,
    database: process.env.MYSQLNAME3,
});

const database = {
    connect_node: async function(node) {
        switch (node) {
            case 1:
                central_node.getConnection();
            case 2:
                luzon_node.getConnection();
            case 3:
                vismin_node.getConnection();
        }
    },

    ping_node: async function(node) {
        return new Promise((resolve, reject) => {
            switch (node) {
                case 'CENTRAL':
                    central_node.getConnection((err, connection) => {
                        if (err) {
                            reject(err);
                        } else {
                            connection.ping(err => {
                                connection.release();
                                if (err) {
                                    console.log("Central Node is unavailable.")
                                    resolve(false);
                                } else {
                                    console.log("Central Node is available.")
                                    resolve(true);
                                }
                            });
                        }
                    });
                    break;
                case 'LUZON':
                    luzon_node.getConnection((err, connection) => {
                        if (err) {
                            reject(err);
                        } else {
                            connection.ping(err => {
                                connection.release();
                                if (err) {
                                    console.log("Luzon Node is unavailable.")
                                    resolve(false);
                                } else {
                                    console.log("Luzon Node is available.")
                                    resolve(true);
                                }
                            });
                        }
                    });
                    break;
                case 'VISMIN':
                    vismin_node.getConnection((err, connection) => {
                        if (err) {
                            reject(err);
                        } else {
                            connection.ping(err => {
                                connection.release();
                                if (err) {
                                    console.log("VisMin Node is unavailable.")
                                    resolve(false);
                                } else {
                                    console.log("VisMin Node is available.")
                                    resolve(true);
                                }
                            });
                        }
                    });
                    break;
                default:
                    resolve(false);
                    break;
            }
        });
    },

    query_node: async function(node, query, callback) {
        return new Promise((resolve, reject) => {
            switch (node) {
                case 'CENTRAL':
                    central_node.query(query, (err, result) => {
                        if (err) {
                            if (callback && typeof callback === 'function') {
                                callback(err, null);
                            }
                            reject(err);
                        } else {
                            if (callback && typeof callback === 'function') {
                                callback(null, result);
                            }
                            resolve(result);
                        }
                    });
                    break;
                case 'LUZON':
                    luzon_node.query(query, (err, result) => {
                        if (err) {
                            if (callback && typeof callback === 'function') {
                                callback(err, null);
                            }
                            reject(err);
                        } else {
                            if (callback && typeof callback === 'function') {
                                callback(null, result);
                            }
                            resolve(result);
                        }
                    });
                    break;
                case 'VISMIN':
                    vismin_node.query(query, (err, result) => {
                        if (err) {
                            if (callback && typeof callback === 'function') {
                                callback(err, null);
                            }
                            reject(err);
                        } else {
                            if (callback && typeof callback === 'function') {
                                callback(null, result);
                            }
                            resolve(result);
                        }
                    });
                    break;
                default:
                    const error = new Error('Invalid node');
                    if (callback && typeof callback === 'function') {
                        callback(error, null);
                    }
                    reject(error);
                    break;
            }
        });
    }


}
module.exports = database;