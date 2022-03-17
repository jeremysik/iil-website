const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    console.log('wat da hell');

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
    try {
        decoded = jwt.verify(accessToken, 'secret'); // This checks expiry too!
    }
    catch(err) {
        return res.locals.output.fail(
            `Unauthorised!`,
            401
        ).send();
    }

    next();
}