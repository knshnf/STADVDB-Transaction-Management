const controller = {
    /* current home page is establishments-list */
    getIndex: function(req, res) {
        res.render('index');
    },

    redirectRoot: function(req, res) {
        res.redirect('/');
    },

    /* login page will be the root unless logged in */
    getRoot: function(req, res) {
        if (req.session.user)
            res.redirect('/establishments-list');
        else
            res.render('login');
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