const path = require('path');

module.exports = function(app) {
    return new Promise(function(resolve) {
        app.get('/version', (req, res) => {
            const project = require(path.normalize(`${global.rootPath}/../package.json`));
            res.json({name: project.name, version: project.version});
        });

        resolve(app);
    });
};