const router     = require('express').Router();
const bodyParser = require('body-parser');
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

module.exports = router;