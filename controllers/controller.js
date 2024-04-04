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
        res.render('view');
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
    }
};


module.exports = controller;