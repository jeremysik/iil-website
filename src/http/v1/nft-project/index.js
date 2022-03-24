const router       = require('express').Router();
const bodyParser   = require('body-parser');
const { v4: uuid } = require('uuid');
const authorise    = require.main.require('./authorise');
router.use('/', bodyParser.json());

/*
* Get a list of NFT projects
* Headers:
* "records = A-B", where A & B are index numbers of the records required
* "order   = X", where X is desc or asc
*/
router.get('/', (req, res) => {

    const countStmt = global.db.prepare(`SELECT count(*) AS total FROM entity_v1 WHERE type = 'nft_project'`);
    const countRow  = countStmt.get();

    if(!countRow) {
        global.log.error('Failed to get total NFT project count', err);
        res.locals.output.fail(
            err,
            500
        ).send();
        return;
    }

    const total = countRow.total;
    let order = null;
    if(req.headers.order == 'asc' || req.headers.order == 'desc') order = req.headers.order;

    // Get the rows
    if(req.headers.records) {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2) {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT * FROM entity_v1 LEFT JOIN nft_project_v1 ON entity_v1.uid = nft_project_v1.entityUid ${order ? `ORDER BY rating ${order} ` : ''} LIMIT ? OFFSET ?`);
            const limitRow  = limitStmt.all(limit, offset);

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT * FROM entity_v1 LEFT JOIN nft_project_v1 ON entity_v1.uid = nft_project_v1.entityUid ${order ? `ORDER BY rating ${order} ` : ''}`);
    const allRow  = allStmt.all();

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

router.post('/', authorise.admin, (req, res) => {

    let missingParams = [];
    let fields        = ['name', 'logoImageUrl', 'featuredImageUrl', 'bannerImageUrl'];

    for(let field of fields) {
        if(!req.body.hasOwnProperty(field)) missingParams.push(field);
    }

    if(missingParams.length > 0) {
        return res.locals.output.fail(
            `The following required parameters are missing: ${missingParams.join(', ')}`,
            400
        ).send();
    }

    let fieldsToInsert = fields.filter((field) => field != 'name');

    let optionalFields = ['websiteUrl', 'openSeaUrl', 'twitterUrl', 'discordUrl', 'description'];
    for(let field of optionalFields) {
        if(req.body.hasOwnProperty(field)) fieldsToInsert.push(field);
    }

    let values = fieldsToInsert.map((field) => req.body[field] == '' ? null : req.body[field]);

    let nftProjectUid = uuid();
    fieldsToInsert.push('uid');
    values.push(nftProjectUid);

    let entityUid = uuid();
    fieldsToInsert.push('entityUid');
    values.push(entityUid);

    const transaction = global.db.transaction(() => {
        const insertEntityStmt = global.db.prepare(`INSERT INTO entity_v1(uid, name, type) VALUES(?, ?, 'nft_project')`);
        insertEntityStmt.run(entityUid, req.body.name);

        const insertNftStmt = global.db.prepare(`INSERT INTO nft_project_v1(${fieldsToInsert.join(', ')}) VALUES(${"?, ".repeat(fieldsToInsert.length - 1)}?)`);
        insertNftStmt.run(values);
    });

    try {
        transaction();
    }
    catch(err) {
        global.log.error(`Failed to insert NFT project "${req.body.name}": ${err.code}`);

        res.locals.output.fail(
            `Failed to insert NFT project "${req.body.name}": ${err.code}`,
            500
        ).send();
        return;
    }

    res.locals.output.success({
        entityUid: entityUid,
        uid:       nftProjectUid
    }).send();
});

router.patch('/:uid', authorise.admin, (req, res) => {

    let fieldsToUpdate = [];
    let optionalFields = ['logoImageUrl', 'featuredImageUrl', 'bannerImageUrl', 'websiteUrl', 'openSeaUrl', 'twitterUrl', 'discordUrl', 'description'];
    for(let field of optionalFields) {
        if(req.body.hasOwnProperty(field)) fieldsToUpdate.push(field);
    }

    let values = fieldsToUpdate.map((field) => req.body[field] === '' ? null : req.body[field]);

    if(values.length == 0) {
        res.locals.output.success().send();
        return;
    }

    values.push(req.params.uid);

    const transaction = global.db.transaction(() => {
        if(req.body.hasOwnProperty('name')) {
            const selectNftStmt = global.db.prepare(`SELECT * FROM nft_project_v1 WHERE uid = ?`);
            const selectNftRow  = selectNftStmt.get(req.params.uid);

            if(!selectNftRow) {
                throw({
                    code:    404,
                    message: `NFT project ${req.params.uid} couldn't be found`
                });
            }

            const updateEntityStmt = global.db.prepare(`UPDATE entity_v1 SET name = ? WHERE uid = ?`);
            updateEntityStmt.run(req.body.name, selectNftRow.entityUid);
        }

        const updateNftStmt = global.db.prepare(`UPDATE nft_project_v1 SET ${fieldsToUpdate.join(' = ?, ')} = ? WHERE uid = ?`);
        updateNftStmt.run(values);
    });

    try {
        transaction();
    }
    catch(err) {
        global.log.error(`Failed to update NFT project "${req.params.uid}": ${err.message}`);

        res.locals.output.fail(
            `Failed to update NFT project: ${err.message}`,
            typeof err.code == 'number' ? err.code : 500
        ).send();
        return;
    }

    res.locals.output.success().send();
});

module.exports = router;