//module.exports = {

let ensureAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
    return next();
    }
    req.flash('error_msg', 'Please log in to view that resource');
    res.redirect('/user/login');
}

let forwardAuthenticated = function(req, res, next) {
    if (!req.isAuthenticated()) {
    return next();
    }
    res.redirect('/lobby');      
}
export { ensureAuthenticated, forwardAuthenticated }