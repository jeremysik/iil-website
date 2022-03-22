const router       = require('express').Router();
const bodyParser   = require('body-parser');
const bcrypt       = require('bcrypt');
const jwt          = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const authorise    = require.main.require('./authorise');
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

    const stmt = global.db.prepare(`SELECT * FROM user_v1 WHERE username = ?`);
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

// TODO: Route temporarily locked to admin's only!
router.post('/', authorise.admin, (req, res) => {

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

        fields.push('uid');
        const uid  = uuid();
        const stmt = global.db.prepare(`INSERT INTO user_v1(${fields.join(', ')}) VALUES(?, ?, ?)`);
        try {
            stmt.run(req.body.username, hash, uid);
        }
        catch(err) {
            global.log.error(`Failed to save user ${req.body.username}: ${err.code}`);
            res.locals.output.fail(
                `Failed to save user ${req.body.username}: ${err.code}`,
                400
            ).send();
            return;
        }

        res.locals.output.success({uid: uid}).send();
    });
});

router.post('/admin', (req, res) => {

    if(process.env.NODE_ENV == 'production') {
        return res.locals.output.fail(
            `Unauthorised`,
            401
        ).send();
    }

    let missingParams = [];
    let fields        = ['username', 'password', 'admin'];

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
        req.body.password.toString(), 
        global.config.database.password.saltRounds
    ).then((hash) => {

        fields.push('uid');
        const uid  = uuid();
        const stmt = global.db.prepare(`INSERT INTO user_v1(${fields.join(', ')}) VALUES(?, ?, ?, ?)`);
        try {
            stmt.run(req.body.username, hash, req.body.admin, uid);
        }
        catch(err) {
            global.log.error(`Failed to save user ${req.body.username}: ${err.code}`);
            res.locals.output.fail(
                `Failed to save user ${req.body.username}: ${err.code}`,
                400
            ).send();
            return;
        }

        res.locals.output.success({uid: uid}).send();
    });
});

/*
* Get a list of users
* Headers:
* "records = A-B", where A & B are index numbers of the records required
*/
router.get('/', authorise.admin, (req, res) => {

    const countStmt = global.db.prepare(`SELECT count(*) AS total FROM user_v1`);
    const countRow  = countStmt.get();

    if(!countRow) {
        global.log.error('Failed to get total user count', err);
        res.locals.output.fail(
            err,
            500
        ).send();
        return;
    }

    const total = countRow.total;

    // Get the rows
    if(req.headers.records) {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2) {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT * FROM user_v1 LIMIT ? OFFSET ?`);
            const limitRow  = limitStmt.all(limit, offset);

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT * FROM user_v1`);
    const allRow  = allStmt.all();

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

router.patch('/:uid', authorise.admin, (req, res) => {

    let fieldsToUpdate = [];
    let optionalFields = ['username'];
    for(let field of optionalFields) {
        if(req.body.hasOwnProperty(field)) fieldsToUpdate.push(field);
    }

    let values = fieldsToUpdate.map((field) => req.body[field] ? req.body[field] : null);

    if(req.body.hasOwnProperty('password')) {

        return bcrypt.hash(
            req.body.password.toString(), 
            global.config.database.password.saltRounds
        ).then((hash) => {
    
            fieldsToUpdate.push('password');
            values.push(hash);
            values.push(req.params.uid);

            const stmt = global.db.prepare(`UPDATE user_v1 SET ${fieldsToUpdate.join(' = ?, ')} = ? WHERE uid = ?`);
            let row;
            try {
                row = stmt.run(values);
            }
            catch(err) {
                global.log.error(`Failed to update user ${req.body.username}: ${err.code}`);
                res.locals.output.fail(
                    `Failed to update user ${req.body.username}: ${err.code}`,
                    500
                ).send();
                return;
            }

            if(row.changes != 1) {
                res.locals.output.fail(
                    `User ${req.params.uid} doesn't exist`,
                    404
                ).send();
                return;
            }
    
            res.locals.output.success().send();
        });
    }

    values.push(req.params.uid);

    const stmt = global.db.prepare(`UPDATE user_v1 SET ${fieldsToUpdate.join(' = ?, ')} = ? WHERE uid = ?`);
    let row;
    try {
        row = stmt.run(values);
    }
    catch(err) {
        global.log.error(`Failed to update user ${req.body.username}: ${err.code}`);
        res.locals.output.fail(
            `Failed to update user ${req.body.username}: ${err.code}`,
            500
        ).send();
        return;
    }

    if(row.changes != 1) {
        res.locals.output.fail(
            `User ${req.params.uid} doesn't exist`,
            404
        ).send();
        return;
    }

    res.locals.output.success().send();
});

module.exports = router;