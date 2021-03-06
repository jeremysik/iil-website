const path = require('path');
const glob = require('glob');

module.exports = function(app) {
    return new Promise(function(resolve) {
        // Load all routes from folder tree
        let apiRoutes = glob.sync(`${__dirname}/**/**/index.js`);

        let promises = [];
        
        apiRoutes.forEach((pathResult) => {
            promises.push(new Promise(function(resolve) {
                const relativeFile = path.relative(__dirname, pathResult); // e.g. 'v1/server/index.js'
                const pathParts    = relativeFile.split('/');
                const relativePath = pathParts.slice(0, pathParts.length - 1).join('/'); // e.g. 'v1/server'
                const versionName  = relativeFile.split('/')[0]; // e.g. 'v1'

                global.db.prepare(`PRAGMA foreign_keys = ON`).run();
        
                app.use(`/${relativePath}`, (req, res, next) => {
                    res.locals = {
                        output: new (require(`./${versionName}/payload`))(req, res)
                    };
    
                    next();
                });
    
                app.use(`/${relativePath}`, require(`./${relativeFile}`));

                global.log.info(`${relativePath} loaded endpoints successfully`);

                resolve();
            }));
        });

        resolve(Promise.all(promises));
    });
};