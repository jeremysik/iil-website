const router     = require('express').Router();
const bodyParser = require('body-parser');
const authorise  = require.main.require('./authorise');
router.use('/', bodyParser.json());

/*
* Search entities
* Headers:
* "records = A-B", where A & B are index numbers of the records required
* "type    = X", where X is entity type
*/
router.get('/search/:query', (req, res) => {
    let type = null;
    const validTypes = ['nft_project'];
    if(validTypes.includes(req.headers.type)) type = req.headers.type;

    const countStmt = global.db.prepare(`SELECT count(*) AS total FROM entity_v1 WHERE name LIKE ? ${type ? `AND type = '${type}'` : ''}`);
    const countRow  = countStmt.get(`%${req.params.query}%`);

    if(!countRow) {
        global.log.error(`Failed to get total entity count for search term: ${req.params.query}`, err);
        res.locals.output.fail(
            err,
            500
        ).send();
        return;
    }

    const total = countRow.total;
    if(total == 0) {
        res.locals.output.success({
            total: total,
            rows:  []
        }).send();
        return;
    }

    // Get the rows
    if(req.headers.records) {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2) {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT * FROM entity_v1 WHERE name LIKE ? ${type ? `AND type = '${type}'` : ''} LIMIT ? OFFSET ?`);
            const limitRow  = limitStmt.all(`%${req.params.query}%`, limit, offset);

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT * FROM entity_v1 WHERE name LIKE ? ${type ? `AND type = '${type}'` : ''}`);
    const allRow  = allStmt.all(`%${req.params.query}%`);

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

router.delete('/:uid', authorise.admin, (req, res) => {

    const transaction = global.db.transaction(() => {
        const selectStmt = global.db.prepare(`SELECT * FROM entity_v1 WHERE uid = ?`);
        const selectRow  = selectStmt.get(req.params.uid);

        if(!selectRow) {
            throw({
                code:    404,
                message: `Failed to get entity ${req.params.uid} for deletion`
            });
        }

        const deleteTypeRatingStmt = global.db.prepare(`DELETE FROM ${selectRow.type}_rating_v1 WHERE entityUid = ?`);
        deleteTypeRatingStmt.run(req.params.uid);

        const deleteReviewStmt = global.db.prepare(`DELETE FROM review_v1 WHERE entityUid = ?`);
        deleteReviewStmt.run(req.params.uid);
        
        const deleteTypeStmt = global.db.prepare(`DELETE FROM ${selectRow.type}_v1 WHERE entityUid = ?`);
        const deleteTypeInfo = deleteTypeStmt.run(req.params.uid);

        if(deleteTypeInfo.changes != 1) {
            throw({
                code:    500,
                message: `Failed to delete ${selectRow.type} entity ${req.params.uid} (entityUid)`
            });
        }

        const deleteEntityStmt = global.db.prepare(`DELETE FROM entity_v1 WHERE uid = ?`);
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
            typeof err.code == 'number' ? err.code : 500
        ).send();
        return;
    }

    res.locals.output.success().send();
});

module.exports = router;