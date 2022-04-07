function searchEntities(e) {
    e.preventDefault();
    let searchTerm = e.srcElement.querySelector('input').value;
    
    window.location.href = `/search/?q=${encodeURIComponent(searchTerm)}`;
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