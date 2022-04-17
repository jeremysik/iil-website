// -------- Template Functions --------
function truncate(charCount) {
    return function(text, render) {
        let renderedText = render(text);
        if(renderedText.length < charCount - 3) return renderedText;
        return renderedText.substr(0, charCount - 3) + '...';
    }
}

function round(precision) {
    return function(text, render) {
        let rating = Number.parseFloat(render(text));
        if(Number.isNaN(rating)) return '-';
        return rating.toPrecision(precision);
    }
}
// -------- Template Functions --------

// Sorry, it was faster for me to build a templating system on Mustache.js than to learn React.js =P
const templatesLoadedEvent = new Event('TemplatesLoaded');
let promises               = [];

document.querySelectorAll('div[template]').forEach((node) => {
    promises.push(
        fetch(
            `/template/${node.getAttribute('template')}.template.html`
        ).then((response) => response.text())
        .then((template) => {
            node.innerHTML = Mustache.render(template);
        })
    );
});

Promise.all(
    promises
).then(() => {
    document.dispatchEvent(templatesLoadedEvent);
});