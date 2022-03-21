const router       = require('express').Router();
const bodyParser   = require('body-parser');
const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');
router.use('/', bodyParser.json());

router.post('/login', (req, res) => {

    let missingParams = [];
    let fields        = ['username', 'password'];

    for(let field of fields) {
        if(!req.body.hasOwnProperty(field) || !req.body[field]) missingParams.push(field);
    }

    if(missingParams.length > 0) {
        return res.locals.output.fail(
            `The following required parameters are missing: ${missingParams.join(', ')}`,
            400
        ).send();
    }

    const stmt = global.db.prepare(`SELECT * FROM ${res.locals.table} WHERE username = ?`);
    const row  = stmt.get(req.body.username);

    if(!row) {
        return res.locals.output.fail(
            `${req.body.username} doesn't exist`,
            404
        ).send();
    }

    return bcrypt.compare(
        req.body.password, 
        row.password
    ).then((result) => {

        if(!result) {
            return res.locals.output.fail(
                `Invalid login credentials`,
                401
            ).send();
        }

        let accessToken = jwt.sign(
            {
                exp:   Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hour expiry
                email: req.body.email,
                admin: row.admin
            },
            'secret' // TODO: Hide me
        );

        res.locals.output.success({
            accessToken: accessToken
        }).send();
    })
});

router.post('/', (req, res) => {

    if(process.env.NODE_ENV == 'production') {
        return res.locals.output.fail(
            `Unauthorised`,
            401
        ).send();
    }

    let missingParams = [];
    let fields        = ['username', 'password'];

    for(let field of fields) {
        if(!req.body.hasOwnProperty(field)) missingParams.push(field);
    }

    if(missingParams.length > 0) {
        return res.locals.output.fail(
            `The following required parameters are missing: ${missingParams.join(', ')}`,
            400
        ).send();
    }

    return bcrypt.hash(
        req.body.password, 
        global.config.database.password.saltRounds
    ).then((hash) => {

        const stmt = global.db.prepare(`INSERT INTO ${res.locals.table}(${fields.join(', ')}) VALUES(?, ?)`);
        try {
            stmt.run(req.body.username, hash);
        }
        catch(err) {
            global.log.error(`Failed to save user ${req.body.username}: ${err.code}`);
            res.locals.output.fail(
                `Failed to save user`,
                500
            ).send();
            return;
        }

        res.locals.output.success().send();
    });
});

module.exports = router;