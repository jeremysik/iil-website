function getAccessToken() {
    let match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    if(!match) {
        return false;
    }

    return match[2];
}

// Why wait for the DOM to load?
const accessToken = getAccessToken();
if(!accessToken) window.location.replace('/');