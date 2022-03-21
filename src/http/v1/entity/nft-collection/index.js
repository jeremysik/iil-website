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

    // Get the total number of rows first
    global.db.get(`SELECT count(*) AS total FROM entity_v1 WHERE type = 'nft_collection'`, function(err, result) {
        if(err) {
            global.log.error('Failed to get total NFT collection count', err);
            res.locals.output.fail(
                err,
                500
            ).send();
            return;
        }

        const total = result.total;

        // Get the rows
        if(req.headers.records)
        {
            let limitOffset = req.headers.records.split('-');

            if(limitOffset.length == 2)
            {
                // Specific records requested
                let offset = limitOffset[0];
                let limit  = limitOffset[1] - offset + 1;

                global.db.all(`SELECT * FROM entity_v1 LEFT JOIN nft_collection_v1 ON entity_v1.uid = nft_collection_v1.entityUid LIMIT ? OFFSET ?`, [limit, offset], function(err, rows) {
                    if(err) {
                        global.log.error(`Failed to get NFT collections ${limitOffset[0]}-${limitOffset[1]}`, err);
                        res.locals.output.fail(
                            err,
                            500
                        ).send();
                        return;
                    }

                    res.locals.output.success({
                        total: total,
                        rows: rows
                    }).send();
                });
                return;
            }
        }

        // No specific records requested, get them all
        global.db.all(`SELECT * FROM entity_v1 LEFT JOIN nft_collection_v1 ON entity_v1.uid = nft_collection_v1.entityUid`, function(err, rows) {
            if(err) {
                global.log.error('Failed to get all NFT collections', err);
                res.locals.output.fail(
                    err,
                    500
                ).send();
                return;
            }

            res.locals.output.success({
                total: total,
                rows: rows
            }).send();
        });
    });
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

    let entityUid = uuid();

    global.db.run(
        `INSERT INTO entity_v1(uid, name, type) VALUES(?, ?, 'nft_collection')`,
        [
            entityUid,
            req.body.name
        ],
        function(err) {
            if(err) {
                global.log.error(`Failed to save entity`, err);

                res.locals.output.fail(
                    err,
                    500
                ).send();
                return;
            }

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

            global.db.run(
                `INSERT INTO nft_collection_v1(${fieldsToInsert.join(', ')}) VALUES(${"?, ".repeat(fieldsToInsert.length - 1)} ?)`,
                values,
                function(err) {
                    if(err) {
                        global.log.error(`Failed to save NFT collection`, err);
        
                        res.locals.output.fail(
                            err,
                            500
                        ).send();
                        return;
                    }
        
                    res.locals.output.success({
                        entityUid: entityUid,
                        uid:       nftCollectionUid
                    }).send();
                }
            );
        }
    );
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

    global.db.run(
        `UPDATE entity_v1 SET name = ? WHERE uid = ?`,
        [
            req.body.name,
            req.body.entityUid
        ],
        function(err) {
            if(err) {
                global.log.error(`Failed to update entity ${req.body.entityUid} (entityUid)`, err);

                res.locals.output.fail(
                    err,
                    500
                ).send();
                return;
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

            global.db.run(
                `UPDATE nft_collection_v1 SET ${fieldsToUpdate.join(' = ?, ')} = ? WHERE uid = ?`,
                values,
                function(err) {
                    if(err) {
                        global.log.error(`Failed to update NFT collection ${req.params.uid}`, err);
        
                        res.locals.output.fail(
                            err,
                            500
                        ).send();
                        return;
                    }
        
                    res.locals.output.success().send();
                }
            );
        }
    );
});

module.exports = router;