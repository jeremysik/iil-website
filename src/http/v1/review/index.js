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

        global.db.run(
            `INSERT OR IGNORE INTO user_v1(username, password) VALUES(?, ?)`,
            [
                req.body.username,
                hash
            ],
            function(err) {
                if(err) {
                    global.log.error(`Failed to create new user (admin add review)`, err);
    
                    res.locals.output.fail(
                        err,
                        500
                    ).send();
                    return;
                }
    
                let uid = uuid();
    
                global.db.run(
                    `INSERT INTO ${res.locals.table}(uid, entityUid, username, rating, review, approved) VALUES(?, ?, ?, ?, ?, ?)`,
                    [
                        uid,
                        req.body.entityUid,
                        req.body.username,
                        req.body.rating,
                        req.body.review,
                        1
                    ],
                    function(err) {
                        if(err) {
                            global.log.error(`Failed to save review (admin)`, err);
            
                            res.locals.output.fail(
                                err,
                                500
                            ).send();
                            return;
                        }

                        global.db.run(
                            `UPDATE user_v1 SET tokenBalance = tokenBalance + 1, tokenTotal = tokenTotal + 1 WHERE username = ?`,
                            [
                                req.body.username
                            ],
                            function(err) {
                                if(err) {
                                    global.log.error(`Failed to update user's token balance (admin add review)`, err);
                    
                                    res.locals.output.fail(
                                        err,
                                        500
                                    ).send();
                                    return;
                                }
                            
                                res.locals.output.success({
                                    entityUid: req.body.entityUid,
                                    uid:       uid
                                }).send();
                            }
                        );
                    }
                );
            }
        );
    });
});

module.exports = router;