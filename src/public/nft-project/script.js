const urlParams                 = new URLSearchParams(window.location.search);
const entityUid                 = urlParams.get('entityUid');
let nftProjectReviewRowTemplate = null;

document.addEventListener('TemplatesLoaded', (event) => {

    Promise.all([
        fetch(
            `/template/mobile-nft-project-banner.template.html`
        ).then((response) => response.text()),

        fetch(
            `/template/nft-project-banner.template.html`
        ).then((response) => response.text()),

        fetch(
            `/template/nft-project-rating.template.html`
        ).then((response) => response.text()),

        axios({
            method: 'get',
            url:    `/v1/nft-project/${entityUid}`
        })
    ]).then((res) => {
        const mobileNftProjectBannerTemplate = res[0];
        const nftProjectBannerTemplate       = res[1];
        const nftProjectRatingTemplate       = res[2];
        const nftProject                     = res[3].data.data;

        document.getElementById('mobile-nft-project-banner-container').innerHTML = Mustache.render(mobileNftProjectBannerTemplate, nftProject);
        document.getElementById('nft-project-banner-container').innerHTML        = Mustache.render(nftProjectBannerTemplate, nftProject);
        document.getElementById('nft-project-rating-container').innerHTML        = Mustache.render(
            nftProjectRatingTemplate, 
            Object.assign(
                {
                    'roundRating': function() {
                        return round(3);
                    },
                    'ratingToColour': function() {
                        return function(text, render) {
                            let rating = Number.parseFloat(render(text));
                            if(rating >= 4) return 'very-high-rating';
                            if(rating >= 3) return 'high-rating';
                            if(rating >= 2) return 'low-rating';
                            if(rating >= 1) return 'very-low-rating';
                        }
                    },
                    'originalityPercentage':   (nftProject.originalityRating   - 1) * 25,
                    'communityPercentage':     (nftProject.communityRating     - 1) * 25,
                    'communicationPercentage': (nftProject.communicationRating - 1) * 25
                },
                nftProject
            )
        );

        init();

    }).catch((err) => {
        alert(err);
    });
});

let reviewRowTemplate = null;
let currentRow        = 0;
let lastRow           = null;

function loadRows(count) {

    let promises = [];
    if(!reviewRowTemplate) {
        promises.push(
            fetch(
                `/template/nft-project-review-row.template.html`
            ).then((response) => response.text())
        );
    }

    return Promise.all(
        promises
    ).then((res) => {
        if(res.length != 0) {
            reviewRowTemplate = res[0];
        }

        return axios({
            method: 'get',
            url:    `/v1/nft-project/${entityUid}/review`,
            headers: {
                records:  `${currentRow}-${currentRow + count - 1}`,
                user:     1,
                approved: '0,1'
            }
        });
    }).then((res) => {
        let reviewRowsHtml = '';
        lastRow            = res.data.data.total - 1;

        for(let i = 0; i < res.data.data.rows.length; i++) {
            reviewRowsHtml += Mustache.render(
                reviewRowTemplate,
                Object.assign(
                    {
                        'rating': ((res.data.data.rows[i].communityRating + res.data.data.rows[i].originalityRating + res.data.data.rows[i].communicationRating) / 3).toPrecision(3),
                        'date':   moment(res.data.data.rows[i].created).format('D MMMM YYYY')
                    },
                    res.data.data.rows[i]
                )
            );
            currentRow++;
        }

        document.getElementById('infinite-review-row-container').innerHTML += reviewRowsHtml;
        document.getElementById('row-spinner').style.display               = 'none';

        if(currentRow >= lastRow) document.getElementById('last-message').style.display = 'block';

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

function init() {
    return loadRows(
        10
    ).then(() => {
        // Keep loading until we have something to scroll (the screen could be really tall and not very wide)
        if(currentRow <= lastRow && document.body.scrollHeight <= window.innerHeight) return init();
    });
}

window.addEventListener('scroll', () => {
    let element = document.getElementById('infinite-review-row-container');
    var offset  = element.getBoundingClientRect().top - element.offsetParent.getBoundingClientRect().top;
    const top   = window.pageYOffset + window.innerHeight - offset;
    let spinner = document.getElementById('row-spinner');

    if(top >= element.scrollHeight && currentRow <= lastRow && spinner.style.display == 'none') {
        spinner.style.display = 'block';
        loadRows(10);
    }
}, { passive: false });