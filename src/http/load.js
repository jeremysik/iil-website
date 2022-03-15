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
                let table          = `${relativeFile.split('/')[1]}_${versionName}`; 

                // Check to see if the table exists before loading endpoints
                global.db.get(`SELECT count(*) AS count FROM sqlite_master WHERE type='table' AND name=?;`, table, function(err, row) {
                    if(err) {
                        global.log.error(err);
                        return resolve();
                    }

                    if(row.count == 0)
                    {
                        global.log.info(`Database table ${table} not found, loading ${versionName} endpoints anyway`);
                        table = null;
                    }
                    else
                    {
                        global.log.info(`Database table ${table} exists, loading ${relativePath} endpoints successfully`);
                        global.db.get('PRAGMA foreign_keys = ON');
                    }
            
                    app.use(`/${relativePath}`, (req, res, next) => {
                        res.locals = {
                            table: table,
                            output: new (require(`./${versionName}/payload`))(req, res)
                        };
        
                        next();
                    });
        
                    app.use(`/${relativePath}`, require(`./${relativeFile}`));

                    global.log.info(`${relativePath} loaded endpoints successfully`);

                    resolve();
                });
            }));
        });

        resolve(Promise.all(promises));
    });
};