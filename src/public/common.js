function searchEntities(e) {
    e.preventDefault();
    
    let searchTerm = e.srcElement.querySelector('input').value;
    console.log(`Searching: ${searchTerm}`);
    // TODO: Implement me
}

document.addEventListener('TemplatesLoaded', function() {
    // Set the correct menu item active
    [].forEach.call(document.getElementsByClassName('navigation-link'), (element) => {
        if(window.location.pathname == element.pathname) {
            element.classList.add('active');
            [].forEach.call(element.getElementsByClassName('navigation-icon'), (iconElement) => {
                iconElement.classList.remove('svg-white');
                iconElement.classList.add('svg-cyan');
            });
        } 
    });
});