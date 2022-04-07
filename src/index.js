process.env.NTBA_FIX_319 = 1;

const fs                = require('fs');
const express           = require('express');
const path              = require('path');
const bunyan            = require('bunyan');
const bunyanDebugStream = require('bunyan-debug-stream');
const http              = require('http');
const https             = require('https');
const betterSqlite3     = require('better-sqlite3');
const dotenv            = require('dotenv');
const TelegramBot       = require('node-telegram-bot-api/lib/telegram');
const app               = express();

process.title   = 'IsItLegit Website';
global.rootPath = __dirname;

const project  = require(path.normalize(`${global.rootPath}/../package.json`));
global.VERSION = `${project.version}-${process.version}`;

async function init() {

    // Load config
    global.config = require(`${process.cwd()}/config.json`);

    // Load env file
    dotenv.config();

    // Update paths in config
    function updatePaths(parent) {
        (Object.keys(parent)).forEach(key => {
            if(key == 'path') {
                parent[key] = path.normalize(`${global.rootPath}/../${parent[key]}`);
            } else if (typeof parent[key] == 'object') {
                updatePaths(parent[key]);
            }
        });

    }
    updatePaths(global.config);

    // Start and configure logger
    if(process.env.NODE_ENV != 'production') {
        global.log = bunyan.createLogger({
            name: process.title,
            streams: [{
                level:  'debug',
                type:   'raw',
                stream: bunyanDebugStream.create({
                    basepath:   global.rootPath,
                    forceColor: true
                })
            }],
            serializers: bunyanDebugStream.serializers
        });
    } else {
        global.log = bunyan.createLogger({
            name:    process.title,
            streams: global.config.log.streams
        });
    }

    global.log.info(`${process.title}: ${global.VERSION}`);

    global.log.info('Config loaded and logger configured');

    // Check for and set up database
    try {
        if(!fs.existsSync(global.config.database.path))
        {
            throw(`Database file ${global.config.database.path} does not exist`);
        }
    }
    catch(e) {
        global.log.error(e);
        process.exit(1);
    }

    global.log.info('Database file found');

    // Load database
    const db = new betterSqlite3(global.config.database.path);

    // Attach database object global.db
    global.db = db;

    global.log.info(`Database loaded`);

    // Check for Telegram bot token
    if(process.env.TELEGRAM_BOT_TOKEN) {
        global.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    }
    else {
        global.log.warn('Telegram bot token not found!')
    }

    // Set up HTTP endpoints
    await Promise.all([
        require('./system')(app),
        require('./http/load')(app),
    ]).catch((err) => {
        global.log.error(`Failed to attach HTTP endpoints.`, err);
    });

    global.log.info('Endpoints configured');

    if(process.env.NODE_ENV == 'production') {
        // Redirect from HTTP to HTTPS
        app.use((req, res, next) => {
            req.secure ? next() : res.redirect('https://' + req.headers.host + req.url)
        })
    }

    // Serve static files
    if(process.env.NODE_ENV == 'production') {
        app.use('/', express.static('./public'));
    }
    else {
        app.use('/', express.static('./src/public'));
    }

    if(process.env.NODE_ENV == 'production') {
        // HTTPS listener
        const credentials = {
            key:  fs.readFileSync(global.config.https.privateKey,  'utf8'),
            cert: fs.readFileSync(global.config.https.certificate, 'utf8'),
            ca:   fs.readFileSync(global.config.https.ca,          'utf8')
        }

        const httpsServer = https.createServer(credentials, app);
        httpsServer.listen(global.config.https.port, () => global.log.info(`HTTPS listening on port ${global.config.https.port}`));
    }

    // HTTP listener
    const httpServer = http.createServer(app);
    httpServer.listen(global.config.http.port, () => global.log.info(`HTTP listening on port ${global.config.http.port}`));

    // Ensure to forward port 80 to global.config.http.port and 443 to global.config.https.port
    // sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000
    // sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 3001
}

init().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`Fatal error while starting ${process.title}:`, e);
    process.exit(1);
});