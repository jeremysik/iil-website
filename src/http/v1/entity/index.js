const router                     = require('express').Router();
const bodyParser                 = require('body-parser');
const { validate: validateUuid } = require('uuid');
router.use('/', bodyParser.json());

router.get('/:uid', (req, res, next) => {

    if(!validateUuid(req.params.uid)) {
        next();
        return;
    }

    global.db.get(`SELECT * FROM ${res.locals.table} WHERE uid = ?`, [req.params.uid], function(err, row) {
        if(err) {
            global.log.error(`Failed to get entity ${req.params.uid}`, err);
            res.locals.output.fail(
                err,
                500
            ).send();
            return;
        }

        if(!row) {
            res.locals.output.fail(
                `Entity with uid ${req.params.uid} doesn't exist`,
                404
            ).send();
            return;
        }

        res.locals.output.success(row).send();
    });
});

module.exports = router;