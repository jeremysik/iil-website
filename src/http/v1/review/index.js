const router     = require('express').Router();
const bodyParser = require('body-parser');
const authorise  = require.main.require('./authorise');
router.use('/', bodyParser.json());

/*
* Get a list of reviews
* Headers:
* "records  = A-B", where A & B are index numbers of the records required
* "approved = X,X..", where X is -1 (rejected), 0 (waiting), 1 (approved)
* "entity   = X", where X is 1, 0 indicating whether or not to include entity name and type
* "user     = X", where X is 1, 0 indicating whether or not to include user name
*/
router.get('/', authorise.admin, (req, res) => {

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
    let approved = [0, 1];
    let entity   = false;
    let user     = false;
    
    if(req.headers.hasOwnProperty('approved')) approved = req.headers.approved.split(',');
    if(req.headers.hasOwnProperty('entity'))   entity   = req.headers.entity;
    if(req.headers.hasOwnProperty('user'))     user     = req.headers.user;

    // Get the rows
    if(req.headers.records) {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2) {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT review_v1.*${entity ? ', entity_v1.name, entity_v1.type ' : ' '}${user ? ', user_v1.username ' : ' '}FROM review_v1${entity ? ' LEFT JOIN entity_v1 ON review_v1.entityUid = entity_v1.uid ' : ' '}${user ? ' LEFT JOIN user_v1 ON review_v1.userUid = user_v1.uid ' : ' '}WHERE ${'approved = ? OR '.repeat(approved.length - 1) + ' approved = ?'} LIMIT ? OFFSET ?`);
            const limitRow  = limitStmt.all(approved.concat([limit, offset]));

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT review_v1.*${entity ? ', entity_v1.name, entity_v1.type ' : ' '}${user ? ', user_v1.username ' : ' '}FROM review_v1${entity ? ' LEFT JOIN entity_v1 ON review_v1.entityUid = entity_v1.uid ' : ''}${user ? ' LEFT JOIN user_v1 ON review_v1.userUid = user_v1.uid ' : ' '}WHERE ${'approved = ? OR '.repeat(approved.length - 1) + ' approved = ?'}`);
    const allRow  = allStmt.all(approved);

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

router.patch('/:uid', authorise.admin, (req, res) => {

    let fieldsToUpdate = [];
    let optionalFields = ['approved'];
    for(let field of optionalFields) {
        if(req.body.hasOwnProperty(field)) fieldsToUpdate.push(field);
    }

    let values = fieldsToUpdate.map((field) => req.body[field] === '' ? null : req.body[field]);

    if(values.length == 0) {
        res.locals.output.success().send();
        return;
    }

    values.push(req.params.uid);

    const stmt = global.db.prepare(`UPDATE review_v1 SET ${fieldsToUpdate.join(' = ?, ')} = ? WHERE uid = ?`);
    try {
        stmt.run(values);
    }
    catch(err) {
        global.log.error(`Failed to update review ${req.params.uid}: ${err.code}`);
        res.locals.output.fail(
            `Failed to update review ${req.params.uid}: ${err.code}`,
            500
        ).send();
        return;
    }

    res.locals.output.success().send();
});

module.exports = router;