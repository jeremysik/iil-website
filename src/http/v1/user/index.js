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

module.exports = router;