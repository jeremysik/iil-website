const router       = require('express').Router();
const bodyParser   = require('body-parser');
const { v4: uuid } = require('uuid');
const authorise    = require.main.require('./authorise');
router.use('/', bodyParser.json());

/*
* Get a list of NFT collections
* Headers:
* "records = A-B", where A & B are index numbers of the records required
*/
router.get('/', (req, res) => {

    const countStmt = global.db.prepare(`SELECT count(*) AS total FROM entity_v1 WHERE type = 'nft_collection'`);
    const countRow  = countStmt.get();

    if(!countRow) {
        global.log.error('Failed to get total NFT collection count', err);
        res.locals.output.fail(
            err,
            500
        ).send();
        return;
    }

    const total = countRow.total;

    // Get the rows
    if(req.headers.records)
    {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2)
        {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT * FROM entity_v1 LEFT JOIN nft_collection_v1 ON entity_v1.uid = nft_collection_v1.entityUid LIMIT ? OFFSET ?`);
            const limitRow  = limitStmt.all(limit, offset);

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT * FROM entity_v1 LEFT JOIN nft_collection_v1 ON entity_v1.uid = nft_collection_v1.entityUid`);
    const allRow  = allStmt.all();

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

router.post('/', authorise.admin, (req, res) => {

    let missingParams = [];
    let fields        = ['name', 'bannerImageUrl'];

    for(let field of fields) {
        if(!req.body.hasOwnProperty(field)) missingParams.push(field);
    }

    if(missingParams.length > 0) {
        return res.locals.output.fail(
            `The following required parameters are missing: ${missingParams.join(', ')}`,
            400
        ).send();
    }

    let entityUid      = uuid();
    let fieldsToInsert = [];
    let optionalFields = ['websiteUrl', 'openSeaUrl', 'twitterUrl', 'discordUrl', 'description'];
    for(let field of optionalFields) {
        if(req.body.hasOwnProperty(field)) fieldsToInsert.push(field);
    }

    let values = fieldsToInsert.map((field) => req.body[field]);

    let nftCollectionUid = uuid();
    fieldsToInsert.push('uid');
    values.push(nftCollectionUid);

    fieldsToInsert.push('entityUid');
    values.push(entityUid);

    fieldsToInsert.push('bannerImageUrl');
    values.push(req.body.bannerImageUrl);

    const transaction = global.db.transaction(() => {
        const insertEntityStmt = global.db.prepare(`INSERT INTO entity_v1(uid, name, type) VALUES(?, ?, 'nft_collection')`);
        insertEntityStmt.run(entityUid, req.body.name);

        const insertNftStmt = global.db.prepare(`INSERT INTO nft_collection_v1(${fieldsToInsert.join(', ')}) VALUES(${"?, ".repeat(fieldsToInsert.length - 1)} ?)`);
        insertNftStmt.run(values);
    });

    try {
        transaction();
    }
    catch(err) {
        global.log.error(`Failed to insert NFT collection "${req.body.name}": ${err.code}`);

        res.locals.output.fail(
            `Failed to insert NFT collection "${req.body.name}": ${err.code}`,
            500
        ).send();
        return;
    }

    res.locals.output.success({
        entityUid: entityUid,
        uid:       nftCollectionUid
    }).send();
});

router.patch('/:uid', authorise.admin, (req, res) => {

    let missingParams = [];
    let fields        = ['name', 'bannerImageUrl'];

    for(let field of fields) {
        if(!req.body.hasOwnProperty(field)) missingParams.push(field);
    }

    if(missingParams.length > 0) {
        return res.locals.output.fail(
            `The following required parameters are missing: ${missingParams.join(', ')}`,
            400
        ).send();
    }

    let fieldsToUpdate = [];
    let optionalFields = ['websiteUrl', 'openSeaUrl', 'twitterUrl', 'discordUrl', 'description'];
    for(let field of optionalFields) {
        if(req.body.hasOwnProperty(field)) fieldsToUpdate.push(field);
    }

    let values = fieldsToUpdate.map((field) => req.body[field]);

    fieldsToUpdate.push('bannerImageUrl');
    values.push(req.body.bannerImageUrl);

    values.push(req.params.uid);

    const transaction = global.db.transaction(() => {
        const updateEntityStmt = global.db.prepare(`UPDATE entity_v1 SET name = ? WHERE uid = ?`);
        const updateEntityInfo = updateEntityStmt.run(req.body.name, req.body.entityUid);

        if(updateEntityInfo.changes != 1) {
            throw(`Failed to update entity ${req.body.entityUid}`);
        }

        const updateNftStmt = global.db.prepare(`UPDATE nft_collection_v1 SET ${fieldsToUpdate.join(' = ?, ')} = ? WHERE uid = ?`);
        const updateNftInfo = updateNftStmt.run(values);

        if(updateNftInfo.changes != 1) {
            throw(`Failed to update NFT collection ${req.params.uid}`);
        }
    });

    try {
        transaction();
    }
    catch(err) {
        global.log.error(`Failed to update NFT collection "${req.params.uid}": ${err.message}`);

        res.locals.output.fail(
            `Failed to update NFT collection: ${err.message}`,
            500
        ).send();
        return;
    }

    res.locals.output.success().send();
});

module.exports = router;