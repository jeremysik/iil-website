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
        return rating.toPrecision(precision);
    }
}
// -------- Template Functions --------

const urlParams                 = new URLSearchParams(window.location.search);
const uid                       = urlParams.get('uid');
let nftProjectReviewRowTemplate = null;

document.addEventListener('TemplatesLoaded', (event) => {

    Promise.all([
        fetch(
            `/template/nft-project-banner.template.html`
        ).then((response) => response.text()),

        fetch(
            `/template/nft-project-rating.template.html`
        ).then((response) => response.text()),

        fetch(
            `/template/nft-project-review-form.template.html`
        ).then((response) => response.text()),

        axios({
            method: 'get',
            url:    `/v1/nft-project/${uid}`
        })
    ]).then((res) => {
        const nftProjectBannerTemplate     = res[0];
        const nftProjectRatingTemplate     = res[1];
        const nftProjectReviewFormTemplate = res[2];
        const nftProject                   = res[3].data.data;

        document.getElementById('nft-project-banner-container').innerHTML = Mustache.render(nftProjectBannerTemplate, nftProject);
    }).catch((err) => {
        alert(err);
    });
});