const jwt = require('jsonwebtoken');

function authorise(req, res, next, admin) {

    if(!req.headers.authorization) {
        return res.locals.output.fail(
            `Unauthorised`,
            401
        ).send();
    }

    const split = req.headers.authorization.split(' ');
    if(split.length != 2 || split[0] != 'Bearer') {
        return res.locals.output.fail(
            `Invalid authorisation type`,
            401
        ).send();
    }

    const accessToken = split[1];
    let decoded       = null;
    try { // TODO: Hide secret
        decoded = jwt.verify(accessToken, 'secret'); // This checks expiry too!
        if(admin && !decoded.admin) throw('Admin privileges required!');
    }
    catch(err) {
        return res.locals.output.fail(
            typeof err == 'string' ? err : `Unauthorised!`,
            401
        ).send();
    }

    next();
}

module.exports = {
    member: function(req, res, next) { authorise(req, res, next, false); },
    admin:  function(req, res, next) { authorise(req, res, next, true); }
};