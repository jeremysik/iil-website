function getAccessToken()
{
    let match = document.cookie.match(new RegExp('(^| )accessToken=([^;]+)'));
    if(!match) {
        return false;
    }

    return match[2];
}

function addNFTCollection(e) {
    e.preventDefault();
    

}

document.addEventListener('DOMContentLoaded', (event) => {
    let accessToken = getAccessToken();
    if(!accessToken) {
        return window.location.replace('/'); 
    }

    console.log(accessToken);
});