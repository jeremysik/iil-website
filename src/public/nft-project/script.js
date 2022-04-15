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
                    'communityPercentage':     (nftProject.communityRating     - 1) * 25,
                    'originalityPercentage':   (nftProject.originalityRating   - 1) * 25,
                    'communicationPercentage': (nftProject.communicationRating - 1) * 25,
                    'consistencyPercentage':   (nftProject.consistencyRating - 1)   * 25
                },
                nftProject
            )
        );

        init();

    }).catch((err) => {
        if(err.response) {
            InfoModal.error('Oops!', JSON.stringify(err.response.data));
            return Promise.resolve();
        }
        
        InfoModal.error('Oops!', err);
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
                approved: '0,1'
            }
        });
    }).then((res) => {
        let reviewRowsHtml = '';
        lastRow            = res.data.data.total - 1;

        for(let i = 0; i < res.data.data.rows.length; i++) {
            let totalRating         = res.data.data.rows[i].rating;
            let optionalRatingCount = 0;
            if(res.data.data.rows[i].communityRating != null) {
                optionalRatingCount++;
                totalRating += res.data.data.rows[i].communityRating;
            }
            if(res.data.data.rows[i].originalityRating != null) {
                optionalRatingCount++;
                totalRating += res.data.data.rows[i].originalityRating;
            }
            if(res.data.data.rows[i].communicationRating != null) {
                optionalRatingCount++;
                totalRating += res.data.data.rows[i].communicationRating;
            }
            if(res.data.data.rows[i].consistencyRating != null) {
                optionalRatingCount++;
                totalRating += res.data.data.rows[i].consistencyRating;
            }
            totalRating /= (optionalRatingCount + 1);
            
            reviewRowsHtml += Mustache.render(
                reviewRowTemplate,
                Object.assign(
                    {
                        'totalRating': totalRating.toPrecision(3),
                        'date':        moment(res.data.data.rows[i].created).format('D MMMM YYYY')
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
        lastRow    = 0;
        currentRow = 1;

        if(err.response) {
            InfoModal.error('Oops!', JSON.stringify(err.response.data));
            return Promise.resolve();
        }
        
        InfoModal.error('Oops!', err);
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

function addReview(e) {
    e.preventDefault();

    if(!provider) {
        InfoModal.warn('Hmm...', `MetaMask not detected. Please try again with a different browser or make sure your wallet is connected.`);
        return Promise.resolve();
    }

    let payload = {
        signature: null,
        data: {
            address:             null,
            rating:              null,
            communityRating:     null,
            originalityRating:   null,
            communicationRating: null,
            consistencyRating:   null,
            comment:             null
        }
    };

    let ratingElement = document.querySelector('input[name="nft-rating"]:checked');
    if(!ratingElement) {
        InfoModal.error('Oops!', 'Please select an "Overall" rating for this NFT project.');
        return;
    }

    payload.data.rating = ratingElement.value;

    let communityRatingElement = document.querySelector('input[name="nft-community-rating"]:checked');
    if(communityRatingElement) payload.data.communityRating = communityRatingElement.value;

    let originalityRatingElement = document.querySelector('input[name="nft-originality-rating"]:checked');
    if(originalityRatingElement) payload.data.originalityRating = originalityRatingElement.value;

    let communicationRatingElement = document.querySelector('input[name="nft-communication-rating"]:checked');
    if(communicationRatingElement) payload.data.communicationRating = communicationRatingElement.value;

    let consistencyRatingElement = document.querySelector('input[name="nft-consistency-rating"]:checked');
    if(consistencyRatingElement) payload.data.consistencyRating = consistencyRatingElement.value;

    let comment = document.getElementById('nft-comment').value;
    if(comment != '') payload.data.comment = comment;

    return provider.send(
        'eth_requestAccounts',
        []
    ).then((addresses) => {
        payload.data.address = ethers.utils.getAddress(addresses[0]);     

        return provider.getSigner().signMessage(JSON.stringify(payload.data));
    }).then((signature) => {
        payload.signature = signature;

        return axios({
            method: 'post',
            url:    `/v1/nft-project/${entityUid}/review`,
            data:   payload
        });
    }).catch((e) => {
        if(e.code == -32002) {
            InfoModal.warn('Hmm...', `Please check MetaMask and unlock your wallet if necessary.`);
            return Promise.resolve();
        }

        if(e.code == 4001) {
            InfoModal.error('Oops!', `To submit your review please sign the message via MetaMask. Don't worry, it's free and doesn't cost any gas, we do this to verify that your review is legit.`);
            return Promise.resolve();
        }

        if(e.response && e.response.data && e.response.data.error) {
            InfoModal.error('Oops!', e.response.data.error);
            return Promise.resolve();
        }

        return Promise.reject(e);
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