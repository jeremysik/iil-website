const router       = require('express').Router();
const bodyParser   = require('body-parser');
const { v4: uuid } = require('uuid');
const authorise    = require.main.require('./authorise');
const bcrypt       = require('bcrypt');
router.use('/', bodyParser.json());

function generatePassword() {
    const characters = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-+=`;
    let password     = ''; 
    for(let i = 0; i < 16; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return password;
}

router.post('/admin', authorise.admin, (req, res) => {

    let missingParams = [];
    let fields        = ['entityUid', 'rating', 'username', 'review'];

    for(let field of fields) {
        if(!req.body.hasOwnProperty(field)) missingParams.push(field);
    }

    if(missingParams.length > 0) {
        return res.locals.output.fail(
            `The following required parameters are missing: ${missingParams.join(', ')}`,
            400
        ).send();
    }

    // This is inefficient, what if we're adding multiple reviews for 1 user?
    // I think for the sake of simplicity, we just do it anyways. We probably won't use it on the same user too many times.
    // In the end, this route is just to get initial content on the site.
    return bcrypt.hash(
        generatePassword(), 
        global.config.database.password.saltRounds
    ).then((hash) => {

        const reviewUid = uuid();

        const transaction = global.db.transaction(() => {
            const insertUserStmt = global.db.prepare(`INSERT OR IGNORE INTO user_v1(uid, username, password) VALUES(?, ?, ?)`);
            insertUserStmt.run(uuid(), req.body.username, hash);

            const selectUserStmt = global.db.prepare(`SELECT * FROM user_v1 WHERE username = ?`);
            const selectUserRow  = selectUserStmt.get(req.body.username);
            
            const insertReviewStmt = global.db.prepare(`INSERT INTO review_v1(uid, entityUid, userUid, rating, review, approved) VALUES(?, ?, ?, ?, ?, ?)`);
            let insertReviewInfo;
            try {
                insertReviewInfo = insertReviewStmt.run([
                    reviewUid,
                    req.body.entityUid,
                    selectUserRow.uid,
                    req.body.rating,
                    req.body.review,
                    1
                ]);
            }
            catch(err) {
                throw({
                    code:    400,
                    message: `Couldn't save review: ${err.message}`
                });
            }
    
            const updateTokensStmt = global.db.prepare(`UPDATE user_v1 SET tokenBalance = tokenBalance + 1, tokenTotal = tokenTotal + 1 WHERE uid = ?`);
            updateTokensStmt.run(selectUserRow.uid);
        });

        try {
            transaction();
        }
        catch(err) {
            global.log.error(err.message);
    
            res.locals.output.fail(
                err.message,
                typeof err.code == 'number' ? err.code : 500
            ).send();
            return;
        }
    
        res.locals.output.success({uid: reviewUid}).send();
    });
});

/*
* Get a list of reviews
* Headers:
* "records  = A-B", where A & B are index numbers of the records required
* "approved = X", where X is 1, 0 indicating true or false
* "entity   = X", where X is 1, 0 indicating whether or not to include entity information
* "user     = X", where X is 1, 0 indicating whether or not to include user information
*/
router.get('/', (req, res) => {

    const countStmt = global.db.prepare(`SELECT count(*) AS total FROM review_v1`);
    const countRow  = countStmt.get();

    if(!countRow) {
        global.log.error('Failed to get total review count', err);
        res.locals.output.fail(
            err,
            500
        ).send();
        return;
    }

    const total  = countRow.total;
    let approved = 1
    
    if(req.headers.hasOwnProperty('approved')) approved = req.headers.approved;

    // Get the rows
    if(req.headers.records) {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2) {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT * FROM review_v1 WHERE approved = ? LIMIT ? OFFSET ?`);
            const limitRow  = limitStmt.all(approved, limit, offset);

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT * FROM review_v1 WHERE approved = ?`);
    const allRow  = allStmt.all(approved);

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

module.exports = router;