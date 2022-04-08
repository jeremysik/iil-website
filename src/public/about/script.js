document.addEventListener('TemplatesLoaded', (event) => {
    [].forEach.call(document.getElementsByClassName('title-title'), (element) => {
        element.innerHTML = 'About';
    });
});