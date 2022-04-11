const fs         = require('fs');
const glob       = require('glob');
const HTMLParser = require('node-html-parser');

const src = `${process.cwd()}/src/public`;

function snakeToCamel(string) {
    return string.toLowerCase(
    ).replace(/([-_][a-z])/g, (group) => {
        return group.toUpperCase(
        ).replace(
            '-',
            ''
        ).replace(
            '_', 
            ''
        );
    });
}

glob.sync(`${src}/**/index.html`).forEach((file) => {
    let html = HTMLParser.parse(
        fs.readFileSync(file).toString(),
        {
            comment: true
        }
    );

    ['template', 'template-container'].forEach((templateType) => {
        // Remove all CSS files
        html.querySelectorAll(`link[${templateType}]`).forEach((node) => {
            node.parentNode.removeChild(node);
        });

        // Remove all JS files
        html.querySelectorAll(`script[${templateType}]`).forEach((node) => {
            node.parentNode.removeChild(node);
        });
    });
        
    html.querySelector('head').innerHTML = `\n    ${html.querySelector('head').innerHTML.trim()}`;
    html.querySelector('head').innerHTML += '\n';
    
    html.querySelector('body').innerHTML = `\n    ${html.querySelector('body').innerHTML.trim()}`;
    html.querySelector('body').innerHTML += '\n';

    ['template', 'template-container'].forEach((templateType) => {
        let cssAdded = false;
        let jsAdded  = false;
        
        // Templates
        html.querySelectorAll(`div[${templateType}]`).forEach((node) => {
            let template  = node.getAttribute(templateType);
            let camelCase = snakeToCamel(template);
        
            if(fs.existsSync(`${src}/template/${camelCase}.css`)) {
                if(!cssAdded) {
                    html.querySelector('head').innerHTML += '\n';
                    cssAdded = true;
                }
                html.querySelector('head').innerHTML += `    <link ${templateType}="${template}" rel="stylesheet" href="/template/${camelCase}.css">\n`;
            }
        
            if(fs.existsSync(`${src}/template/${camelCase}.js`)) {
                if(!jsAdded) {
                    html.querySelector('body').innerHTML += '\n';
                    jsAdded = true;
                }
                html.querySelector('body').innerHTML += `    <script ${templateType}="${template}" src="/template/${camelCase}.js" type="application/javascript" defer></script>\n`;
            }
        });
    });
    
    fs.writeFileSync(file, html.toString());
});