const cuid = require('cuid');
const db = require('../models/db.js');
const rp = require('../models/replicator.js');
const nd = require('../models/nodes.js');
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

                setTimeout(async function() {
                    var nodes = await nd.getNodesToQueryRead();
                    var sql = "SELECT * FROM appointments"

                    if (nodes.length === 0) {
                        res.render('error', { errorMessage: 'All nodes are unreachable' });
                    } else {
                        let appointments = []

                        try {
                            for (let i = 0; i < nodes.length; i++) {
                                let appointmentsFromNode = await db.query_node(nodes[i], sql);
                                appointmentsFromNode.forEach(appointment => {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                    appointments.push(appointment);
                                });
                            }
                            res.render('view', { appointments: appointments });
                        } catch (error) {
                            res.render('error', { errorMessage: 'An error occurred while fetching appointments: ' + error.message });
                        }
                    }
                    console.log("Task getView() complete.");
                    done();
                }, 1000)
            },
            function(err, ret) {
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

    postCreate: async function(req, res) { // done
        if (req.body.appointmentId = null) {
            var appointmentId = cuid();
        } else if (req.body.appointmendId = "-1") {
            var appointmentId = -1;
        } else { var appointmentId = cuid(); }

        var patientAge = req.body.patientAge;
        var patientGender = req.body.patientGender;
        var hospitalName = req.body.hospitalName;
        var queueDate = req.body.queueDate;
        var city = req.body.city;
        var province = req.body.province;
        var regionName = req.body.regionName;
        var mainSpecialty = req.body.mainSpecialty;

        var sql = "INSERT INTO appointments (appt_id, age, gender, hospital_name, queue_date, city, province, region_name, main_specialty) VALUES ('" + appointmentId + "', '" + patientAge + "', '" + patientGender + "', '" + hospitalName + "', '" + queueDate + "', '" + city + "', '" + province + "', '" + regionName + "', '" + mainSpecialty + "')";
        console.log("[INFO] Executing postCreate()");
        lock.acquire(xKey, function(done) {
            console.log("[WARNING] Opening " + xKey + " lock for postCreate()");

            setTimeout(async function() {
                var target = ''
                if (luzonRegions.includes(regionName)) {
                    target = 'LUZON';
                } else if (visminRegions.includes(regionName)) {
                    target = 'VISMIN';
                }
                var nodesWithLog = await nd.getNodesToQueryWrite(target);
                var nodesToQuery = nodesWithLog[0];
                var nodesToReplicate = nodesWithLog[1];
                var nodesToLog = nodesWithLog[2];
                if (nodesToQuery.length === 0) {
                    res.render('error', { errorMessage: 'All nodes are unreachable' });
                } else {
                    try {
                        var transactionId = cuid();
                        var log = "INSERT INTO transaction_log (id, date, sql_statement, node, status) VALUES ('" + transactionId + "', NOW(), '" + sql.replace(/'/g, "''") + "', '" + nodesToLog[0] + "', false)";
                        if (nodesToQuery.length > 0) {
                            for (let i = 0; i < nodesToQuery.length; i++) {
                                await db.query_node(nodesToQuery[i], sql);
                            }
                        }

                        if (nodesToLog.length > 0) {
                            for (let i = 0; i < nodesToLog.length; i++) {
                                await db.query_node(nodesToQuery[0], log)
                            }
                        }

                        if (nodesToReplicate.length > 0) {
                            for (let i = 0; i < nodesToReplicate.length; i++) {
                                await rp.replicate(nodesToQuery[0], nodesToReplicate[i], sql, transactionId);
                            }
                        }
                        res.send(true)

                    } catch (error) {
                        res.render('error', { errorMessage: 'An error occurred while fetching appointments: ' + error.message });
                    }
                }

                console.log("[INFO] postCreate() operation complete.");
                done();
            }, 3000)
        }, function(err, ret) {
            console.log("[WARNING] " + xKey + " released.");
        }, {});
    },

    postDelete: async function(req, res) { // has locks
        var appointmentId = req.body.appointmentId;

        var sql = "DELETE FROM appointments WHERE appt_id = '" + appointmentId + "'";
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
                } else {
                    // Get the region of the recorded to be deleted
                    var target = '';
                    if (inLuzon) {
                        target = 'LUZON';
                    }
                    if (inVisMin) {
                        target = 'VISMIN';
                    } else {
                        var records = await db.query_node('CENTRAL', select);
                        if (luzonRegions.includes(records[0].region_name)) {
                            target = 'LUZON';
                        } else if (visminRegions.includes(records[0].region_name)) {
                            target = 'VISMIN';
                        }
                    }

                    var nodesWithLog = await nd.getNodesToQueryWrite(target);
                    var nodesToQuery = nodesWithLog[0];
                    var nodesToReplicate = nodesWithLog[1];
                    var nodesToLog = nodesWithLog[2];
                    if (nodesToQuery.length === 0) {
                        res.render('error', { errorMessage: 'All nodes are unreachable' });
                    } else {
                        try {
                            var transactionId = cuid();
                            var log = "INSERT INTO transaction_log (id, date, sql_statement, node, status) VALUES ('" + transactionId + "', NOW(), '" + sql.replace(/'/g, "''") + "', '" + nodesToLog[0] + "', false)";
                            if (nodesToQuery.length > 0) {
                                for (let i = 0; i < nodesToQuery.length; i++) {
                                    await db.query_node(nodesToQuery[i], sql);
                                }
                            }

                            if (nodesToLog.length > 0) {
                                for (let i = 0; i < nodesToLog.length; i++) {
                                    await db.query_node(nodesToQuery[0], log)
                                }
                            }

                            if (nodesToReplicate.length > 0) {
                                for (let i = 0; i < nodesToReplicate.length; i++) {
                                    await rp.replicate(nodesToQuery[0], nodesToReplicate[i], sql, transactionId);
                                }
                            }

                            console.log('[INFO] Deleted appointment with ID ' + appointmentId);
                            res.send(true)

                        } catch (error) {
                            res.render('error', { errorMessage: 'An error occurred while fetching appointments: ' + error.message });
                        }
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
                var select = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";
                var inCentral = ((await db.ping_node('CENTRAL')) && (await db.query_node('CENTRAL', select)).length > 0)
                var inLuzon = ((await db.ping_node('LUZON')) && (await db.query_node('LUZON', select)).length > 0)
                var inVisMin = ((await db.ping_node('VISMIN')) && (await db.query_node('VISMIN', select)).length > 0)

                if (!(inCentral || inLuzon || inVisMin)) {
                    const error = new Error('No appointments found.');
                    res.status(500).json({ error: error.message });
                } else {
                    var sql = "SELECT * FROM appointments WHERE appt_id = '" + appointmentId + "'";
                    var nodes = await nd.getNodesToQueryRead();
                    let appointments = []
                    try {
                        for (let i = 0; i < nodes.length; i++) {
                            let appointmentsFromNode = await db.query_node(nodes[i], sql);
                            if (appointmentsFromNode.length > 0) {
                                console.log(appointmentsFromNode)
                                appointmentsFromNode.forEach(appointment => {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                    appointments.push(appointment);
                                });
                            }

                        }
                        console.log(appointments)
                        const queueDate = new Date(appointments[0].queue_date);
                        appointments[0].queue_date = queueDate.toISOString().split('T')[0];
                        res.render('updateForm', { appointment: appointments[0] });
                    } catch (error) {
                        res.render('error', { errorMessage: 'An error occurred while fetching appointments: ' + error.message });
                    }
                }
                console.log("[INFO] getUpdateForm() operation complete.")
                done();
            }, 3000)
        }, function(err, ret) {
            console.log("[WARNING] " + sKey + " released.");
        }, { shared: true });
    },

    postUpdate: async function(req, res) { // locks done
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
        console.log("[INFO] Executing postUpdate()");
        lock.acquire(xKey, function(done) {
            console.log("[WARNING] Opening " + xKey + " lock for postUpdate()");

            setTimeout(async function() {
                var target = ''
                if (luzonRegions.includes(regionName)) {
                    target = 'LUZON';
                } else if (visminRegions.includes(regionName)) {
                    target = 'VISMIN';
                }
                var nodesWithLog = await nd.getNodesToQueryWrite(target);
                var nodesToQuery = nodesWithLog[0];
                var nodesToReplicate = nodesWithLog[1];
                var nodesToLog = nodesWithLog[2];
                if (nodesToQuery.length === 0) {
                    res.render('error', { errorMessage: 'All nodes are unreachable' });
                } else {
                    try {
                        var transactionId = cuid();
                        var log = "INSERT INTO transaction_log (id, date, sql_statement, node, status) VALUES ('" + transactionId + "', NOW(), '" + sql.replace(/'/g, "''") + "', '" + nodesToLog[0] + "', false)";
                        if (nodesToQuery.length > 0) {
                            for (let i = 0; i < nodesToQuery.length; i++) {
                                await db.query_node(nodesToQuery[i], sql);
                            }
                        }

                        if (nodesToLog.length > 0) {
                            for (let i = 0; i < nodesToLog.length; i++) {
                                await db.query_node(nodesToQuery[0], log)
                            }
                        }

                        if (nodesToReplicate.length > 0) {
                            for (let i = 0; i < nodesToReplicate.length; i++) {
                                await rp.replicate(nodesToQuery[0], nodesToReplicate[i], sql, transactionId);
                            }
                        }
                        res.send(true)

                    } catch (error) {
                        res.render('error', { errorMessage: 'An error occurred while fetching appointments: ' + error.message });
                    }
                }

                console.log("[INFO] postUpdate() operation complete.")
                done();
            }, 3000)
        }, function(err, ret) {
            console.log("[WARNING] " + xKey + " released.");
        }, {});
    },

    getReport: async function(req, res) {
        var nodes = await nd.getNodesToQueryRead();
        var sql = "SELECT * FROM appointments"

        if (nodes.length === 0) {
            res.render('error', { errorMessage: 'All nodes are unreachable' });
        } else {
            let appointments = []

            try {
                for (let i = 0; i < nodes.length; i++) {
                    let appointmentsFromNode = await db.query_node(nodes[i], sql);
                    appointmentsFromNode.forEach(appointment => {
                        appointment.queue_date = appointment.queue_date.toDateString();
                        appointments.push(appointment);
                    });
                }

                // Total appointments by hospital
                const appointmentsByHospital = {};
                appointments.forEach(appointment => {
                    const hospital = appointment.hospital_name;
                    appointmentsByHospital[hospital] = (appointmentsByHospital[hospital] || 0) + 1;
                });

                // Percentage of appointments by specialty
                const totalAppointments = appointments.length;
                const appointmentsBySpecialty = {};
                appointments.forEach(appointment => {
                    const specialty = appointment.main_specialty;
                    appointmentsBySpecialty[specialty] = (appointmentsBySpecialty[specialty] || 0) + 1;
                });
                for (const specialty in appointmentsBySpecialty) {
                    appointmentsBySpecialty[specialty] = (appointmentsBySpecialty[specialty] / totalAppointments) * 100;
                }

                // Total Doctors by Region and Specialty
                const doctorsByRegionAndSpecialty = {};
                appointments.forEach(appointment => {
                    const region = appointment.region_name;
                    const specialty = appointment.main_specialty;
                    if (!doctorsByRegionAndSpecialty[region]) {
                        doctorsByRegionAndSpecialty[region] = {};
                    }
                    doctorsByRegionAndSpecialty[region][specialty] = (doctorsByRegionAndSpecialty[region][specialty] || 0) + 1;
                });

                res.render('report', {
                    appointmentsByHospital,
                    appointmentsBySpecialty,
                    doctorsByRegionAndSpecialty
                });
            } catch (error) {
                res.render('error', { errorMessage: 'An error occurred while fetching appointments: ' + error.message });
            }
        }
    },

    getSearch: async function(req, res) {
        var value = req.params.value;
        var field = req.params.field;

        console.log("[INFO] Executing getView()");
        lock.acquire(sKey, function(done) {
                console.log("[WARNING] Opening " + sKey + " lock for getView()...");

                setTimeout(async function() {
                    var nodes = await nd.getNodesToQueryRead();
                    var sql = "SELECT * FROM appointments WHERE " + field + "=" + "'" + value + "'";
                    console.log(sql);

                    if (nodes.length === 0) {
                        res.render('error', { errorMessage: 'All nodes are unreachable' });
                    } else {
                        let appointments = []

                        try {
                            for (let i = 0; i < nodes.length; i++) {
                                let appointmentsFromNode = await db.query_node(nodes[i], sql);
                                appointmentsFromNode.forEach(appointment => {
                                    appointment.queue_date = appointment.queue_date.toDateString();
                                    appointments.push(appointment);
                                });
                            }
                            res.render('view', { appointments: appointments });
                        } catch (error) {
                            res.render('error', { errorMessage: 'An error occurred while fetching appointments: ' + error.message });
                        }
                    }
                    console.log("Task getSearch() complete.");
                    done();
                }, 1000)
            },
            function(err, ret) {
                console.log("[WARNING] " + sKey + "lock released...");
            }, { shared: true });

    }

};


module.exports = controller;