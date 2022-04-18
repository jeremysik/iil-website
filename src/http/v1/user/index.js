const router       = require('express').Router();
const bodyParser   = require('body-parser');
const jwt          = require('jsonwebtoken');
const ethers       = require('ethers');
router.use('/', bodyParser.json());

router.post('/login', (req, res) => {

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

    const stmt = global.db.prepare(`SELECT * FROM user_v1 WHERE admin = 1 AND address = ?`);
    const row  = stmt.get(signer);

    if(!row) {
        return res.locals.output.fail(
            `${signer} doesn't exist or isn't an admin.`,
            404
        ).send();
    }

    let accessToken = jwt.sign(
        {
            exp:   Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hour expiry
            email: req.body.email,
            admin: row.admin
        },
        'secret' // TODO: Hide me
    );

    res.locals.output.success({
        accessToken: accessToken
    }).send();
});

/*
* Get reviews for user
* Headers:
* "records = A-B", where A & B are index numbers of the records required
* "type    = X", where X is entity type
*/
router.get('/:address/review', (req, res) => {
    let type = null;
    const validTypes = ['nft_project'];
    if(validTypes.includes(req.headers.type)) type = req.headers.type;

    const reviewRatingTableJoin = type ? `LEFT JOIN entity_v1 ON entity_v1.uid = review_v1.entityUId LEFT JOIN ${type}_review_rating_v1 AS r_r ON review_v1.uid = r_r.reviewUid` : '';

    const countStmt = global.db.prepare(`
        SELECT 
            count(*) AS total
        FROM review_v1
        ${reviewRatingTableJoin}
        WHERE
            userAddress = ?
            ${type ? `AND type = '${type}'` : ''}
    `);

    const countRow = countStmt.get(req.params.address);

    if(!countRow) {
        global.log.error(`Failed to get total review count for user with address: ${req.params.address}`, err);
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

            const limitStmt = global.db.prepare(`
                SELECT
                    *
                FROM review_v1
                ${reviewRatingTableJoin}
                WHERE
                    userAddress = ?
                ${type ? `AND type = '${type}'` : ''}
                LIMIT ? OFFSET ?
            `);
            const limitRow  = limitStmt.all(req.params.address, limit, offset);

            res.locals.output.success({
                total: total,
                rows:  limitRow
            }).send();
            return;
        }
    }

    const allStmt = global.db.prepare(`
        SELECT
            *
        FROM review_v1
        ${reviewRatingTableJoin}
        WHERE
            userAddress = ?
        ${type ? `AND type = '${type}'` : ''}
    `);
    const allRow  = allStmt.all(req.params.address);

    res.locals.output.success({
        total: total,
        rows:  allRow
    }).send();
});

module.exports = router;