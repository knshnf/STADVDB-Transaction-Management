const cuid = require('cuid');
const db = require('../models/db.js');
const app = require('../routes/routes.js');

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
        db.execute_query(sql, function(err, appointments) {
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
        db.execute_query(sql);
    },

    postDelete: function(req, res) {
        var appointmentId = req.body.appointmentId;

        var sql = "DELETE FROM appointments WHERE appt_id = '" + appointmentId + "'";
        db.execute_query(sql);
    },
};


module.exports = controller;