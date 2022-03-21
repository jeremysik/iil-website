const router                     = require('express').Router();
const bodyParser                 = require('body-parser');
const { validate: validateUuid } = require('uuid');
const authorise                  = require.main.require('./authorise');
router.use('/', bodyParser.json());

router.get('/:uid', (req, res, next) => {

    if(!validateUuid(req.params.uid)) {
        next();
        return;
    }

    const stmt = global.db.prepare(`SELECT * FROM ${res.locals.table} WHERE uid = ?`);
    const row  = stmt.get(req.params.uid);

    if(!row) {
        res.locals.output.fail(
            `Entity with uid ${req.params.uid} doesn't exist`,
            404
        ).send();
        return;
    }

    res.locals.output.success(row).send();
});

router.delete('/:uid', authorise.admin, (req, res) => {

    const transaction = global.db.transaction(() => {
        const selectStmt = global.db.prepare(`SELECT * FROM ${res.locals.table} WHERE uid = ?`);
        const selectRow  = selectStmt.get(req.params.uid);

        if(!selectRow) {
            throw({
                code:    404,
                message: `Failed to get entity ${req.params.uid} for deletion`
            });
        }
        
        const deleteTypeStmt = global.db.prepare(`DELETE FROM ${selectRow.type}_v1 WHERE entityUid = ?`);
        const deleteTypeInfo = deleteTypeStmt.run(req.params.uid);

        if(deleteTypeInfo.changes != 1) {
            throw({
                code:    500,
                message: `Failed to delete ${selectRow.type} entity ${req.params.uid} (entityUid)`
            });
        }

        const deleteEntityStmt = global.db.prepare(`DELETE FROM ${res.locals.table} WHERE uid = ?`);
        const deleteEntityInfo = deleteEntityStmt.run(req.params.uid);

        if(deleteEntityInfo.changes != 1) {
            throw({
                code:    500,
                message: `Failed to delete entity ${req.params.uid}`
            });
        }
    });

    try {
        transaction();
    }
    catch(err) {
        global.log.error(err.message);

        console.error(err.code);

        res.locals.output.fail(
            err.message,
            err.code
        ).send();
        return;
    }

    res.locals.output.success().send();
});

module.exports = router;