const router       = require('express').Router();
const bodyParser   = require('body-parser');
const { v4: uuid } = require('uuid');
const authorise    = require.main.require('./authorise');
const ethers       = require('ethers');
const axios        = require('axios');
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
    
    if(req.headers.hasOwnProperty('approved')) approved = req.headers.approved.split(',');

    // Get the rows
    if(req.headers.records) {
        let limitOffset = req.headers.records.split('-');

        if(limitOffset.length == 2) {
            // Specific records requested
            let offset = limitOffset[0];
            let limit  = limitOffset[1] - offset + 1;

            const limitStmt = global.db.prepare(`SELECT nft_project_rating_v1.*, review_v1.rating, review_v1.comment, review_v1.userAddress, review_v1.approved FROM nft_project_rating_v1 LEFT JOIN nft_project_v1 ON nft_project_rating_v1.entityUid = nft_project_v1.entityUid LEFT JOIN review_v1 ON review_v1.uid = nft_project_rating_v1.reviewUid WHERE nft_project_v1.entityUid = ? AND (${'approved = ? OR '.repeat(approved.length - 1) + ' approved = ?'}) ORDER BY created DESC LIMIT ? OFFSET ?`);            
            const limitRow  = limitStmt.all([req.params.entityUid].concat(approved).concat([limit, offset]));

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`SELECT nft_project_rating_v1.*, review_v1.rating, review_v1.comment, review_v1.userAddress, review_v1.approved FROM nft_project_rating_v1 LEFT JOIN nft_project_v1 ON nft_project_rating_v1.entityUid = nft_project_v1.entityUid LEFT JOIN review_v1 ON review_v1.uid = nft_project_rating_v1.reviewUid WHERE nft_project_v1.entityUid = ? AND (${'approved = ? OR '.repeat(approved.length - 1) + ' approved = ?'}) ORDER BY created DESC`);
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

router.post('/:entityUid/review', (req, res) => {

    if(!req.body.data || !req.body.signature) {
        return res.locals.output.fail(
            `Payload format incorrect. Please contact our team to resolve this issue.`,
            400
        ).send();
    }

    const signer = ethers.utils.verifyMessage(JSON.stringify(req.body.data), req.body.signature);
    if(signer != req.body.data.address) {
        return res.locals.output.fail(
            `Couldn't verify message signature. Please try again or contact our team if this issue persists.`,
            400
        ).send();
    }

    return axios({
        method: 'get',
        url:    `https://api.etherscan.io/api?module=account&action=balance&address=${signer}&tag=latest&apikey=${global.config.etherscan.apiToken}`
    }).then((balanceRes) => {
        if(!balanceRes.data.result) {
            return Promise.reject({code: 500, message: `Couldn't contact EtherScan to validate your wallet balance. Please try again or contact our team if this issue persists.`});
        }

        let balance = balanceRes.data.result * Math.pow(10, -18);
        if(balance >= 0.01) {
            return Promise.resolve();
        }

        return axios({
            method: 'get',
            url:    `https://api.etherscan.io/api?module=account&action=txlist&address=${signer}&page=1&offset=10&sort=asc&apikey=${global.config.etherscan.apiToken}`
        }).then((txRes) => {
            if(!txRes.data.result) {
                return Promise.reject({code: 500, message: `Couldn't contact EtherScan to validate your wallet transactions. Please try again or contact our team if this issue persists.`});
            }
    
            if(txRes.data.result.length < 10) {
                return Promise.reject({code: 400, message: `Your wallet must have at least 0.01 ETH or made 10 transactions to post a review.`});
            }           
        });
    }).then(() => {
        let missingParams = [];
        let fields        = ['rating'];

        for(let field of fields) {
            if(!req.body.data.hasOwnProperty(field)) missingParams.push(field);
        }

        if(missingParams.length > 0) {
            return Promise.reject({code: 400, message: `The following required parameters are missing: ${missingParams.join(', ')}`});
        }

        let reviewFields         = fields;
        let optionalReviewFields = ['comment'];
        for(let field of optionalReviewFields) {
            if(req.body.data.hasOwnProperty(field)) reviewFields.push(field);
        }

        let nftRatingFields         = [];
        let optionalNftRatingFields = ['communityRating', 'originalityRating', 'communicationRating', 'consistencyRating'];
        for(let field of optionalNftRatingFields) {
            if(req.body.data.hasOwnProperty(field)) nftRatingFields.push(field);
        }

        let reviewValues    = reviewFields.map((field) => req.body.data[field] === '' ? null : req.body.data[field]);
        let nftRatingValues = nftRatingFields.map((field) => req.body.data[field] === '' ? null : req.body.data[field]);

        let uid = uuid();
        reviewFields.push('uid');
        reviewValues.push(uid);
        reviewFields.push('entityUid');
        reviewValues.push(req.params.entityUid);
        reviewFields.push('userAddress');
        reviewValues.push(signer);

        nftRatingFields.push('reviewUid');
        nftRatingValues.push(uid);
        nftRatingFields.push('entityUid');
        nftRatingValues.push(req.params.entityUid);


        const transaction = global.db.transaction(() => {
            // Create user if required
            const insertUserStmt = global.db.prepare(`INSERT OR IGNORE INTO user_v1(address) VALUES(?)`);
            insertUserStmt.run(signer);

            const insertReviewStmt = global.db.prepare(`INSERT INTO review_v1(${reviewFields.join(', ')}) VALUES(${"?, ".repeat(reviewValues.length - 1)}?)`);
            insertReviewStmt.run(reviewValues);

            const insertNftRatingStmt = global.db.prepare(`INSERT INTO nft_project_rating_v1(${nftRatingFields.join(', ')}) VALUES(${"?, ".repeat(nftRatingValues.length - 1)}?)`);
            insertNftRatingStmt.run(nftRatingValues);

            // Update ratings
            let ratings = {};

            const ratingSumStmt = db.prepare(`SELECT CAST(SUM(rating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM review_v1 WHERE entityUid = ?`);
            ratings.rating      = ratingSumStmt.get(req.params.entityUid);

            const communitySumStmt = db.prepare(`SELECT CAST(SUM(communityRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE communityRating NOT NULL AND entityUid = ?`);
            ratings.community      = communitySumStmt.get(req.params.entityUid);
            
            const originalitySumStmt = db.prepare(`SELECT CAST(SUM(originalityRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE originalityRating NOT NULL AND entityUid = ?`);
            ratings.originality      = originalitySumStmt.get(req.params.entityUid);

            const communicationSumStmt = db.prepare(`SELECT CAST(SUM(communicationRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE communicationRating NOT NULL AND entityUid = ?`);
            ratings.communication      = communicationSumStmt.get(req.params.entityUid);

            const consistencySumStmt = db.prepare(`SELECT CAST(SUM(consistencyRating) AS REAL) / COUNT(*) AS rating, COUNT(*) AS count FROM nft_project_rating_v1 WHERE consistencyRating NOT NULL AND entityUid = ?`);
            ratings.consistency      = consistencySumStmt.get(req.params.entityUid);

            ratings.total = (ratings.rating.rating + ratings.community.rating + ratings.originality.rating + ratings.communication.rating + ratings.consistency.rating) / 5;

            const updateEntityStmt = db.prepare(`UPDATE entity_v1 SET rating = ?, reviewCount = (SELECT count(*) FROM review_v1 WHERE entityUid = ?) WHERE uid = ?`);
            updateEntityStmt.run(
                ratings.total,
                req.params.entityUid,
                req.params.entityUid
            );

            const updateNFTProjectStmt = db.prepare(`UPDATE nft_project_v1 SET communityRating = ?, originalityRating = ?, communicationRating = ?, consistencyRating = ? WHERE entityUid = ?`);
            updateNFTProjectStmt.run(
                ratings.community.rating,
                ratings.originality.rating,
                ratings.communication.rating,
                ratings.consistency.rating,
                req.params.entityUid
            );
        });

        try {
            transaction();
        }
        catch(err) {
            if(err.code == 'SQLITE_CONSTRAINT_UNIQUE') {
                return Promise.reject({code: 400, message: `You have already submitted a review for this NFT project.`});
            }

            const errorMessage = `Failed to insert NFT review on project ${req.params.entityUid} for user ${signer}: ${err}`;
            global.log.error(errorMessage);

            return Promise.reject({code: 500, message: errorMessage});
        }

        res.locals.output.success({
            uid: uid
        }).send();
        
    }).catch((err) => {
        res.locals.output.fail(
            err.message,
            err.code
        ).send();
    });
});

module.exports = router;