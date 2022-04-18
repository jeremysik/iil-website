const path              = require('path');
const fs                = require('fs');
const glob              = require('glob');
const htmlMinifier      = require('html-minifier').minify;
const { minify:terser } = require('terser');
const CleanCSS          = require('clean-css');

const src          = `${process.cwd()}/src/public`;
const outputFolder = `${process.cwd()}/public`;

// Delete the source folder
fs.rmdirSync(outputFolder, {recursive: true, force: true});

// First make all the folders necessary
glob.sync(`${src}/**`).forEach((entity) => {
    if(entity.includes('.')) return; // It's a file, ignore it

    const relativeFolder = path.relative(src, entity);
    fs.mkdirSync(`${outputFolder}/${relativeFolder}`, {recursive: true});
});

// Copy over all the assets
glob.sync(`${src}/asset/**`).forEach((entity) => {
    if(!entity.includes('.')) return; // It's a folder, ignore it

    const relativeFile = path.relative(src, entity);

    fs.copyFileSync(entity, `${outputFolder}/${relativeFile}`);
});

let htmlFiles = glob.sync(`${src}/**/*.html`);
htmlFiles.forEach((htmlFile) => {
    const relativeFile = path.relative(src, htmlFile);
    const contents     = fs.readFileSync(htmlFile, 'utf8');
    fs.writeFileSync(`${outputFolder}/${relativeFile}`, htmlMinifier(contents, {
        caseSensitive: true,
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        minifyCSS: false,
        minifyJS: true,
        minifyURLs: true,
        removeAttributeQuotes: true,
        removeComments: true,
        removeEmptyAttributes: true,
        sortAttributes: true,
        sortClassName: false,
        trimCustomFragments: true
    }));
});

let jsFiles = glob.sync(`${src}/**/*.js`);
jsFiles.forEach((jsFile) => {
    const relativeFile = path.relative(src, jsFile);
    const contents     = fs.readFileSync(jsFile, 'utf8');

    terser(
        contents
    ).then((output) => {
        fs.writeFileSync(`${outputFolder}/${relativeFile}`, output.code);
    });
});

let cssFiles = glob.sync(`${src}/**/*.css`);
cssFiles.forEach((cssFile) => {
    const relativeFile = path.relative(src, cssFile);
    const contents     = fs.readFileSync(cssFile, 'utf8');

    let output = new CleanCSS().minify(contents);
    fs.writeFileSync(`${outputFolder}/${relativeFile}`, output.styles);
});