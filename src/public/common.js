document.addEventListener('TemplatesLoaded', function() {
    // Set the correct menu item active
    let navLinks = document.querySelector('header').querySelectorAll('a');
    [].forEach.call(navLinks, (element) => {
        if(window.location.pathname == element.pathname) element.classList.add('active');
    });
});