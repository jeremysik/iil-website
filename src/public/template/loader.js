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

function preserveLineBreaks() {
    return function(text, render) {
        return render(text).replaceAll('\n', '<br>');
    }
}

function markdown(remove = false) {
    return function(text, render) {
        let renderedText = render(text);

        const linkRegex = /\[([^\[]+)\]\(([^\)]+)\)/g;
        [...renderedText.matchAll(linkRegex)].forEach((match) => {
            renderedText = renderedText.replaceAll(match[0], remove ? '' : `<a target="_blank" href="${match[2]}">${match[1]}</a>`);
        });

        const strongRegex = /(\*\*|__)(.*?)(\*?)\1/g;
        [...renderedText.matchAll(strongRegex)].forEach((match) => {
            renderedText = renderedText.replaceAll(match[0], remove ? '' : `<b>${match[2]}</b>`);
        });

        return renderedText.replaceAll('\n', remove ? '' : '<br>');
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