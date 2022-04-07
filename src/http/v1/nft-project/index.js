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

    let fieldsToInsert = fields.filter((field) => field != 'name' && field != 'logoImageUrl');

    let optionalFields = ['websiteUrl', 'openSeaUrl', 'twitterUrl', 'discordUrl', 'description'];
    for(let field of optionalFields) {
        if(req.body.hasOwnProperty(field)) fieldsToInsert.push(field);
    }

    let nftProjectvalues = fieldsToInsert.map((field) => req.body[field] == '' ? null : req.body[field]);

    let uid = uuid();
    fieldsToInsert.push('entityUid');
    nftProjectvalues.push(uid);

    const transaction = global.db.transaction(() => {
        const insertEntityStmt = global.db.prepare(`INSERT INTO entity_v1(uid, name, type, logoImageUrl) VALUES(?, ?, ?, ?)`);
        insertEntityStmt.run(uid, req.body.name, 'nft_project', req.body.logoImageUrl);

        const insertNftStmt = global.db.prepare(`INSERT INTO nft_project_v1(${fieldsToInsert.join(', ')}) VALUES(${"?, ".repeat(fieldsToInsert.length - 1)}?)`);
        insertNftStmt.run(nftProjectvalues);
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
        entityUid: uid
    }).send();
});

router.patch('/:entityUid', authorise.admin, (req, res) => {

    let entityFieldsToUpdate     = [];
    let entityOptionalFields     = ['name', 'logoImageUrl'];
    let nftProjectfieldsToUpdate = [];
    let nftProjectoptionalFields = ['featuredImageUrl', 'bannerImageUrl', 'websiteUrl', 'openSeaUrl', 'twitterUrl', 'discordUrl', 'description'];
    for(let field of entityOptionalFields) {
        if(req.body.hasOwnProperty(field)) entityFieldsToUpdate.push(field);
    }
    for(let field of nftProjectoptionalFields) {
        if(req.body.hasOwnProperty(field)) nftProjectfieldsToUpdate.push(field);
    }

    let entityValues     = entityFieldsToUpdate.map((field) => req.body[field] === '' ? null : req.body[field]);
    let nftProjectvalues = nftProjectfieldsToUpdate.map((field) => req.body[field] === '' ? null : req.body[field]);

    if(entityValues.length == 0 && nftProjectvalues.length == 0) {
        res.locals.output.success().send();
        return;
    }

    entityValues.push(req.params.entityUid);
    nftProjectvalues.push(req.params.entityUid);

    const transaction = global.db.transaction(() => {
        const updateEntityStmt = global.db.prepare(`UPDATE entity_v1 SET ${entityFieldsToUpdate.join(' = ?, ')} = ? WHERE uid = ?`);
        updateEntityStmt.run(entityValues);

        const updateNftStmt = global.db.prepare(`UPDATE nft_project_v1 SET ${nftProjectfieldsToUpdate.join(' = ?, ')} = ? WHERE entityUid = ?`);
        updateNftStmt.run(nftProjectvalues);
    });

    try {
        transaction();
    }
    catch(err) {
        global.log.error(`Failed to update NFT project "${req.params.entityUid}": ${err.message}`);

        res.locals.output.fail(
            `Failed to update NFT project: ${err.message}`,
            typeof err.code == 'number' ? err.code : 500
        ).send();
        return;
    }

    res.locals.output.success().send();
});

/*
* Get a list of reviews
* Headers:
* "records  = A-B", where A & B are index numbers of the records required
* "approved = X,X..", where X is -1 (rejected), 0 (waiting), 1 (approved)
* "user     = X", where X is 1, 0 indicating whether or not to include user name
*/
router.get('/:entityUid/review', (req, res) => {
    const countStmt = global.db.prepare(`SELECT count(*) AS total FROM nft_project_rating_v1 LEFT JOIN nft_project_v1 ON nft_project_rating_v1.entityUid = nft_project_v1.entityUid WHERE nft_project_v1.entityUid = ?`);
    const countRow  = countStmt.get(req.params.entityUid);

    if(!countRow) {
        global.log.error('Failed to get total NFT project review count', err);
        res.locals.output.fail(
            err,
            500
        ).send();
        return;
    }

    const total  = countRow.total;
    let approved = [0, 1];
    let user     = false;
    
    if(req.headers.hasOwnProperty('approved')) approved = req.headers.approved.split(',');
    if(req.headers.hasOwnProperty('user'))     user     = req.headers.user;

    // Get the rows
    if(req.headers.records) {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2) {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT nft_project_rating_v1.*, review_v1.comment, review_v1.approved${user ? ', user_v1.username ' : ' '}FROM nft_project_rating_v1 LEFT JOIN nft_project_v1 ON nft_project_rating_v1.entityUid = nft_project_v1.entityUid LEFT JOIN review_v1 ON review_v1.uid = nft_project_rating_v1.reviewUid${user ? ' LEFT JOIN user_v1 ON review_v1.userUid = user_v1.uid ' : ' '}WHERE nft_project_v1.entityUid = ? AND (${'approved = ? OR '.repeat(approved.length - 1) + ' approved = ?'}) ORDER BY created DESC LIMIT ? OFFSET ?`);            
            const limitRow  = limitStmt.all([req.params.entityUid].concat(approved).concat([limit, offset]));

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT nft_project_rating_v1.*, review_v1.comment, review_v1.approved${user ? ', user_v1.username ' : ' '}FROM nft_project_rating_v1 LEFT JOIN nft_project_v1 ON nft_project_rating_v1.entityUid = nft_project_v1.entityUid LEFT JOIN review_v1 ON review_v1.uid = nft_project_rating_v1.reviewUid${user ? ' LEFT JOIN user_v1 ON review_v1.userUid = user_v1.uid ' : ' '}WHERE nft_project_v1.entityUid = ? AND (${'approved = ? OR '.repeat(approved.length - 1) + ' approved = ?'}) ORDER BY created DESC`);
    const allRow  = allStmt.all([req.params.entityUid].concat(approved));

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

router.get('/:entityUid', (req, res) => {
    const stmt = global.db.prepare(`SELECT * FROM nft_project_v1 LEFT JOIN entity_v1 ON nft_project_v1.entityUid = entity_v1.uid WHERE nft_project_v1.entityUid = ?`);
    const row  = stmt.get(req.params.entityUid);

    if(!row) {
        res.locals.output.fail(
            `NFT project ${req.params.entityUid} not found`,
            404
        ).send();
        return;
    }

    res.locals.output.success(row).send();
});

module.exports = router;