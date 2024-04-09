const cuid = require('cuid');
const db = require('../models/db.js');
const dotenv = require('dotenv');
const mysql = require('mysql');
dotenv.config('../.env');

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

    getView: function(req, res) {
        var sql = "SELECT * FROM appointments";

        if (deployedOn === 'CENTRAL') {
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

    postCreate: function(req, res) {
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
        var log = "INSERT INTO transaction_logs (date, sql_statement, node, status) VALUES (NOW(), '" + sql.replace(/'/g, "''") + "', 1, false)";

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
    },

    postDelete: function(req, res) {
        var appointmentId = req.body.appointmentId;

        var sql = "DELETE FROM appointments WHERE appt_id = '" + appointmentId + "'";
        var log = "INSERT INTO transaction_logs (date, sql_statement, node, status) VALUES (NOW(), '" + sql.replace(/'/g, "''") + "', 1, false)";

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
    },

    getUpdateForm: function(req, res) {
        var appointmentId = req.params.id;

        var sql = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";

        if (deployedOn === 'CENTRAL') {
            if (db.ping_node('CENTRAL')) {
                db.query_node('CENTRAL', sql, function(err, appointment) {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error fetching appointment data');
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
                db.query_node('LUZON', sql, function(err, appointment) {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error fetching appointment data');
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
                    console.log(appointment);
                    appointment[0].queue_date = appointment[0].queue_date.toISOString().split('T')[0]
                    res.render('updateForm', { appointment: appointment[0] });
                });
            }


        } else if (deployedOn === 'VISMIN') {
            if (db.ping_node('VISMIN')) {
                db.query_node('VISMIN', sql, function(err, appointment) {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error fetching appointment data');
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
                    console.log(appointment);
                    appointment[0].queue_date = appointment[0].queue_date.toISOString().split('T')[0]
                    res.render('updateForm', { appointment: appointment[0] });
                });
            }
        }
    },

    postUpdate: function(req, res) {
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
        var log = "INSERT INTO transaction_logs (date, sql_statement, node, status) VALUES (NOW(), '" + sql.replace(/'/g, "''") + "', 1, false)";

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
    }

};


module.exports = controller;