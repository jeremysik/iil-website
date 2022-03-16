const router       = require('express').Router();
const bodyParser   = require('body-parser');
const { v4: uuid } = require('uuid');
router.use('/', bodyParser.json());

router.post('/transaction', (req, res) => {

    res.locals.output.success().send();

});

router.get('/mint-count', (req, res) => {

    global.db.get(`SELECT count(*) AS count FROM ${res.locals.table} WHERE minted = 1`, function(err, row) {
        if(err) {
            if(global.telegramBot) global.telegramBot.sendMessage(global.config.telegram.channel, `\u{1F6A8} (${req.socket.remoteAddress}) Mint count API request for Rosie the Red Panda #${req.params.tokenId} failed due to database ${err}`);

            global.log.error(`Failed to get mint count for rosietheredpanda`, err);
            res.locals.output.fail(
                err,
                500
            ).send();
            return;
        }

        row.count += 3;

        res.locals.output.success(row).send();
    });
});

/*
* Get metadata for a Rosie the Red Panda NFT
*/
router.get('/:tokenId', (req, res) => {

    res.locals.output.success().send();

});


router.post('/', (req, res) => {

    let missingParams = [];
    let fields        = ['email', 'password'];

    for(let field of fields) {
        if(!req.body.hasOwnProperty(field)) missingParams.push(field);
    }

    if(missingParams.length > 0) {
        return res.locals.output.fail(
            `The following required parameters are missing: ${missingParams.join(', ')}`,
            400
        ).send();
    }

    let uid = uuid();
    fields.push('uid');

    return bcrypt.hash(
        req.body.password, 
        global.config.database.password.saltRounds
    ).then((hash) => {

        global.db.run(
            `INSERT INTO ${res.locals.table}(${fields.join(', ')}) VALUES(?, ?, ?)`,
            [
                req.body.email,
                hash,
                uid
            ],
            function(err) {
                if(err) {
                    global.log.error(`Failed to save user`, err);
    
                    res.locals.output.fail(
                        err,
                        500
                    ).send();
                    return;
                }
    
                res.locals.output.success({
                    uid: uid
                }).send();
            }
        );
    });
});

module.exports = router;