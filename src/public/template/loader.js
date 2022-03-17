// Did I just build my own templating system on top of mustache.js?
// Sorry, I don't know React.js =P
document.querySelectorAll('div[template]').forEach((node) => {
    let templateLocation = `/template/${node.getAttribute('template')}.template.html`;
    fetch(
        templateLocation
    ).then((response) => response.text())
    .then((template) => {
        node.innerHTML = Mustache.render(template);
    });
});