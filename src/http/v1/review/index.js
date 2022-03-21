const router       = require('express').Router();
const bodyParser   = require('body-parser');
const { v4: uuid } = require('uuid');
const password     = require('generate-password');
const authorise    = require.main.require('./authorise');
const bcrypt       = require('bcrypt');
router.use('/', bodyParser.json());

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

    return bcrypt.hash(
        password.generate({length: 16, numbers: true, symbols: true}), 
        global.config.database.password.saltRounds
    ).then((hash) => {

        let uid = uuid();

        const transaction = global.db.transaction(() => {
            const insertUserStmt = global.db.prepare(`INSERT OR IGNORE INTO user_v1(username, password) VALUES(?, ?)`);
            insertUserStmt.run(req.body.username, hash);
            
            const insertReviewStmt = global.db.prepare(`INSERT INTO ${res.locals.table}(uid, entityUid, username, rating, review, approved) VALUES(?, ?, ?, ?, ?, ?)`);
            const insertReviewInfo = insertReviewStmt.run([
                uid,
                req.body.entityUid,
                req.body.username,
                req.body.rating,
                req.body.review,
                1
            ]);
    
            if(insertReviewInfo.changes != 1) {
                throw({
                    code:    500,
                    message: `Failed to save review (admin)`
                });
            }
    
            const updateTokensStmt = global.db.prepare(`UPDATE user_v1 SET tokenBalance = tokenBalance + 1, tokenTotal = tokenTotal + 1 WHERE username = ?`);
            const updateTokensInfo = updateTokensStmt.run(req.body.username);
    
            if(updateTokensInfo.changes != 1) {
                throw({
                    code:    500,
                    message: `Failed to update user's token balance (admin add review)`
                });
            }
        });

        try {
            transaction();
        }
        catch(err) {
            global.log.error(err.message);
    
            res.locals.output.fail(
                err.message,
                err.code
            ).send();
            return;
        }
    
        res.locals.output.success().send();
    });
});

module.exports = router;