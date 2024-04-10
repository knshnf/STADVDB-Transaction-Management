const cuid = require('cuid');
const db = require('../models/db.js');
const dotenv = require('dotenv');
const mysql = require('mysql');
dotenv.config('../.env');

const AsyncLock = require('async-lock');
var lock = new AsyncLock();

const xKey = "exclusive";
const sKey = "shared";

// CENTRAL, LUZON, VISMIN
const deployedOn = process.env.DEPLOYED;

const luzonRegions = ['National Capital Region (NCR)', 'CALABARZON (IV-A)', 'Ilocos Region (I)', 'Bicol Region (V)', 'Central Luzon (III)']
const luzonRegionsSQL = luzonRegions.map(region => mysql.escape(region)).join(',');
const visminRegions = ['Central Visayas (VII)', 'Eastern Visayas (VIII)', 'Western Visayas (VI)', 'SOCCSKSARGEN (Cotabato Region) (XII)', 'Northern Mindanao (X)']
const visminRegionsSQL = visminRegions.map(region => mysql.escape(region)).join(',');

const controller = {
    getIndex: function(req, res) {
        res.render('index');
    },

    redirectRoot: function(req, res) {
        res.redirect('/');
    },

    getCreate: function(req, res) {
        res.render('create');
    },

    getView: function(req, res) { // has locks
        console.log("[INFO] Executing getView()");
        lock.acquire(sKey, function(done) {
            console.log("[WARNING] Opening " + sKey + " lock for getView()...");

            setTimeout(function() {
                if (deployedOn === 'CENTRAL') {
                    var sql = "SELECT * FROM appointments";
                    if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql, function(err, appointments) {
                            if (err) {
                                res.render('error');
                            } else {
                                // Format date
                                appointments.forEach(function(appointment) {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                });
                                res.render('view', { appointments: appointments });
                            }
                        });
                    }
                    // TODO: What if central is down?

                } else if (deployedOn === 'LUZON') {
                    var sql = "SELECT * FROM appointments";
                    if (db.ping_node('LUZON')) {
                        db.query_node('LUZON', sql, function(err, appointments) {
                            if (err) {
                                res.render('error');
                            } else {
                                // Format date
                                appointments.forEach(function(appointment) {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                });
                                res.render('view', { appointments: appointments });
                            }
                        });
                    } else if (db.ping_node('CENTRAL')) {
                        var sql = `SELECT * FROM appointments WHERE region_name IN (${luzonRegionsSQL})`;

                        db.query_node('CENTRAL', sql, function(err, appointments) {
                            if (err) {
                                res.render('error');
                            } else {
                                // Format date
                                appointments.forEach(function(appointment) {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                });
                                res.render('view', { appointments: appointments });
                            }
                        });
                    }


                } else if (deployedOn === 'VISMIN') {
                    var sql = "SELECT * FROM appointments";
                    if (db.ping_node('VISMIN')) {
                        db.query_node('VISMIN', sql, function(err, appointments) {
                            if (err) {
                                res.render('error');
                            } else {
                                // Format date
                                appointments.forEach(function(appointment) {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                });
                                res.render('view', { appointments: appointments });
                            }
                        });
                    } else if (db.ping_node('CENTRAL')) {
                        var sql = `SELECT * FROM appointments WHERE region_name IN (${visminRegionsSQL})`;

                        db.query_node('CENTRAL', sql, function(err, appointments) {
                            if (err) {
                                res.render('error');
                            } else {
                                // Format date
                                appointments.forEach(function(appointment) {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                });
                                res.render('view', { appointments: appointments });
                            }
                        });
                    }
                }
                console.log("Task getView() complete.");
                done();
            }, 1000)
        }, function(err, ret) {
            console.log("[WARNING] " + sKey + "lock released...");
        }, { shared: true });
    },

    getUpdate: function(req, res) {
        res.render('update');
    },

    getDelete: function(req, res) {
        res.render('delete');
    },

    getError: function(req, res) {
        error = {
            code: 404,
            error: 'There is nothing to see here...'
        }
        res.render('error', error);
    },

    postCreate: function(req, res) { // done
        var appointmentId = cuid();
        var patientAge = req.body.patientAge;
        var patientGender = req.body.patientGender;
        var hospitalName = req.body.hospitalName;
        var queueDate = req.body.queueDate;
        var city = req.body.city;
        var province = req.body.province;
        var regionName = req.body.regionName;
        var mainSpecialty = req.body.mainSpecialty;

        var sql = "INSERT INTO appointments (appt_id, age, gender, hospital_name, queue_date, city, province, region_name, main_specialty) VALUES ('" + appointmentId + "', '" + patientAge + "', '" + patientGender + "', '" + hospitalName + "', '" + queueDate + "', '" + city + "', '" + province + "', '" + regionName + "', '" + mainSpecialty + "')";
        var log = "INSERT INTO transaction_log (date, sql_statement, node, status) VALUES (NOW(), '" + sql.replace(/'/g, "''") + "', '" + deployedOn + "', false)";

        console.log("[INFO] Executing postCreate()");
        lock.acquire(xKey, function(done) {
            console.log("[WARNING] Opening " + xKey + " lock for postCreate()");


            setTimeout(function() {
                if (deployedOn === 'CENTRAL') {
                    if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                    } else if (luzonRegions.includes(regionName) && db.ping_node('LUZON')) {
                        db.query_node('LUZON', sql)
                        db.query_node('LUZON', log);
                    } else if (visminRegions.includes(regionName) && db.ping_node('VISMIN')) {
                        db.query_node('VISMIN', sql)
                        db.query_node('VISMIN', log);
                    }

                } else if (deployedOn === 'LUZON') {
                    if (db.ping_node('LUZON')) {
                        db.query_node('LUZON', sql)
                    } else if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                        db.query_node('CENTRAL', log);
                    }

                } else if (deployedOn === 'VISMIN') {
                    if (db.ping_node('VISMIN')) {
                        db.query_node('VISMIN', sql)
                    } else if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                        db.query_node('CENTRAL', log);
                    }
                }
                console.log("[INFO] postCreate() operation complete.");
                done();
                res.send(true);
            }, 3000)
        }, function(err, ret) {
            console.log("[WARNING] " + xKey + " released.");
        }, {});
    },

    postDelete: function(req, res) { // has locks
        var appointmentId = req.body.appointmentId;

        var sql = "DELETE FROM appointments WHERE appt_id = '" + appointmentId + "'";
        var log = "INSERT INTO transaction_log (date, sql_statement, node, status) VALUES (NOW(), '" + sql.replace(/'/g, "''") + "', '" + deployedOn + "', false)";
        console.log("[INFO] Executing postDelete()");
        lock.acquire(xKey, function(done) {
            console.log("[WARNING] Opening " + xKey + " lock for postDelete()");

            setTimeout(async function() {
                // Check if the appointment exists
                var select = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";
                var inCentral = ((await db.ping_node('CENTRAL')) && (await db.query_node('CENTRAL', select)).length > 0)
                var inLuzon = ((await db.ping_node('LUZON')) && (await db.query_node('LUZON', select)).length > 0)
                var inVisMin = ((await db.ping_node('VISMIN')) && (await db.query_node('VISMIN', select)).length > 0)

                if (!(inCentral || inLuzon || inVisMin)) {
                    const error = new Error('No appointments found.');
                    res.status(500).json({ error: error.message });
                } else if (deployedOn === 'CENTRAL') {
                    if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql);
                        res.send(true);
                    } else if (luzonRegions.includes(regionName) && db.ping_node('LUZON')) {
                        db.query_node('LUZON', sql);
                        db.query_node('LUZON', log);
                        res.send(true);
                    } else if (visminRegions.includes(regionName) && db.ping_node('VISMIN')) {
                        db.query_node('VISMIN', sql);
                        db.query_node('VISMIN', log);
                        res.send(true);
                    } else {
                        const error = new Error('Nodes are unreachable');
                        res.status(500).json({ error: error.message });
                    }

                } else if (deployedOn === 'LUZON') {
                    if (db.ping_node('LUZON')) {
                        db.query_node('LUZON', sql)
                        res.send(true);
                    } else if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                        db.query_node('CENTRAL', log);
                        res.send(true);
                    } else {
                        const error = new Error('Nodes are unreachable');
                        res.status(500).json({ error: error.message });
                    }

                } else if (deployedOn === 'VISMIN') {
                    if (db.ping_node('VISMIN')) {
                        db.query_node('VISMIN', sql)
                        res.send(true);
                    } else if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                        db.query_node('CENTRAL', log);
                        res.send(true);
                    } else {
                        const error = new Error('Nodes are unreachable');
                        res.status(500).json({ error: error.message });
                    }
                }
                console.log("[INFO] postDelete() operation complete.")
                done();
            }, 3000)
        }, function(err, ret) {
            console.log("[WARNING] " + xKey + " released.");
        }, {});
    },

    getUpdateForm: function(req, res) {
        var appointmentId = req.params.id;

        console.log("[INFO] Executing getUpdateForm()");
        lock.acquire(sKey, function(done) {
            console.log("[WARNING] Opening " + sKey + " lock for getUpdateForm()");
            setTimeout(async function() {
                // Check if the appointment exists
                // Check if the appointment exists
                var select = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";
                var inCentral = ((await db.ping_node('CENTRAL')) && (await db.query_node('CENTRAL', select)).length > 0)
                var inLuzon = ((await db.ping_node('LUZON')) && (await db.query_node('LUZON', select)).length > 0)
                var inVisMin = ((await db.ping_node('VISMIN')) && (await db.query_node('VISMIN', select)).length > 0)

                if (!(inCentral || inLuzon || inVisMin)) {
                    const error = new Error('No appointments found.');
                    res.status(500).json({ error: error.message });
                } else if (deployedOn === 'CENTRAL') {
                    var sql = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";
                    if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql, function(err, appointment) {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error fetching appointment data');
                                return;
                            }

                            if (appointment.length === 0) {
                                return;
                            }

                            console.log(appointment);
                            appointment[0].queue_date = appointment[0].queue_date.toISOString().split('T')[0]
                            res.render('updateForm', { appointment: appointment[0] });
                        });
                    }
                    // TODO: What if central is down?

                } else if (deployedOn === 'LUZON') {
                    if (db.ping_node('LUZON')) {
                        var sql = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";
                        db.query_node('LUZON', sql, function(err, appointment) {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error fetching appointment data');
                                return;
                            }

                            if (appointment.length === 0) {
                                return;
                            }

                            console.log(appointment);
                            appointment[0].queue_date = appointment[0].queue_date.toISOString().split('T')[0]
                            res.render('updateForm', { appointment: appointment[0] });
                        });
                    } else if (db.ping_node('CENTRAL')) {
                        var sql = `SELECT * FROM appointments WHERE region_name IN (${luzonRegionsSQL})`;

                        db.query_node('CENTRAL', sql, function(err, appointment) {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error fetching appointment data');
                                return;
                            }

                            if (appointment.length === 0) {
                                return;
                            }

                            console.log(appointment);
                            appointment[0].queue_date = appointment[0].queue_date.toISOString().split('T')[0]
                            res.render('updateForm', { appointment: appointment[0] });
                        });
                    }


                } else if (deployedOn === 'VISMIN') {
                    if (db.ping_node('VISMIN')) {
                        var sql = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";
                        db.query_node('VISMIN', sql, function(err, appointment) {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error fetching appointment data');
                                return;
                            }

                            if (appointment.length === 0) {
                                return;
                            }

                            console.log(appointment);
                            appointment[0].queue_date = appointment[0].queue_date.toISOString().split('T')[0]
                            res.render('updateForm', { appointment: appointment[0] });
                        });
                    } else if (db.ping_node('CENTRAL')) {
                        var sql = `SELECT * FROM appointments WHERE region_name IN (${visminRegionsSQL})`;

                        db.query_node('CENTRAL', sql, function(err, appointment) {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error fetching appointment data');
                                return;
                            }

                            if (appointment.length === 0) {
                                return;
                            }

                            console.log(appointment);
                            appointment[0].queue_date = appointment[0].queue_date.toISOString().split('T')[0]
                            res.render('updateForm', { appointment: appointment[0] });
                        });
                    }
                }
                console.log("[INFO] getUpdateForm() operation complete.")
                done();
            }, 3000)
        }, function(err, ret) {
            console.log("[WARNING] " + sKey + " released.");
        }, { shared: true });
    },

    postUpdate: function(req, res) { // locks done
        var appointmentId = req.body.appointmentId;
        var patientAge = req.body.patientAge;
        var patientGender = req.body.patientGender;
        var hospitalName = req.body.hospitalName;
        var queueDate = req.body.queueDate;
        var city = req.body.city;
        var province = req.body.province;
        var regionName = req.body.regionName;
        var mainSpecialty = req.body.mainSpecialty;

        var sql = "UPDATE appointments SET age = '" + patientAge + "', gender = '" + patientGender + "', hospital_name = '" + hospitalName + "', queue_date = '" + queueDate + "', city = '" + city + "', province = '" + province + "', region_name = '" + regionName + "', main_specialty = '" + mainSpecialty + "' WHERE appt_id = '" + appointmentId + "'";
        var log = "INSERT INTO transaction_log (date, sql_statement, node, status) VALUES (NOW(), '" + sql.replace(/'/g, "''") + "', '" + deployedOn + "', false)";

        console.log("[INFO] Executing postUpdate()");
        lock.acquire(xKey, function(done) {
            console.log("[WARNING] Opening " + xKey + " lock for postUpdate()");

            setTimeout(function() {
                if (deployedOn === 'CENTRAL') {
                    if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                    } else if (luzonRegions.includes(regionName) && db.ping_node('LUZON')) {
                        db.query_node('LUZON', sql)
                        db.query_node('LUZON', log);
                    } else if (visminRegions.includes(regionName) && db.ping_node('VISMIN')) {
                        db.query_node('VISMIN', sql)
                        db.query_node('VISMIN', log);
                    }

                } else if (deployedOn === 'LUZON') {
                    if (db.ping_node('LUZON')) {
                        db.query_node('LUZON', sql)
                    } else if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                        db.query_node('CENTRAL', log);
                    }

                } else if (deployedOn === 'VISMIN') {
                    if (db.ping_node('VISMIN')) {
                        db.query_node('VISMIN', sql)
                    } else if (db.ping_node('CENTRAL')) {
                        db.query_node('CENTRAL', sql)
                        db.query_node('CENTRAL', log);
                    }
                }

                console.log("[INFO] postUpdate() operation complete.")
                done();
                res.send(true);
            }, 3000)
        }, function(err, ret) {
            console.log("[WARNING] " + xKey + " released.");
        }, {});
    },

    getReport: function(req, res) {
        res.render('report');
    }

};


module.exports = controller;