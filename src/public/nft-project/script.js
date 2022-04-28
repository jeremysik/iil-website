const urlParams                 = new URLSearchParams(window.location.search);
const entityUid                 = urlParams.get('entityUid');
let nftProjectReviewRowTemplate = null;

document.addEventListener('TemplatesLoaded', (event) => {

    Promise.all([
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
        const nftProjectBannerTemplate = res[0];
        const nftProjectRatingTemplate = res[1];
        const nftProject               = res[2].data.data;

        document.querySelector('div[template-container="nft-project-banner"]').innerHTML = Mustache.render(
            nftProjectBannerTemplate,
            Object.assign(
                Object.assign({}, nftProject),
                {
                    'markdown': function() {
                        return markdown();
                    },
                    'bannerImageUrl': nftProject.bannerImageUrl && nftProject.bannerImageUrl.includes('google') ? `${nftProject.bannerImageUrl}=h250` : nftProject.bannerImageUrl,
                    'logoImageUrl':   nftProject.logoImageUrl   && nftProject.logoImageUrl.includes('google')   ? `${nftProject.logoImageUrl}=h150`   : nftProject.logoImageUrl,
                }
            )
        );
        document.querySelector('div[template-container="nft-project-rating"]').innerHTML = Mustache.render(
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
                    'ratingPercentage':        (nftProject.rating              - 1) * 25,
                    'communityPercentage':     (nftProject.communityRating     - 1) * 25,
                    'originalityPercentage':   (nftProject.originalityRating   - 1) * 25,
                    'communicationPercentage': (nftProject.communicationRating - 1) * 25,
                    'consistencyPercentage':   (nftProject.consistencyRating   - 1)   * 25
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
            const row = res.data.data.rows[i];

            let totalRating         = row.rating;
            let optionalRatingCount = 0;
            if(row.communityRating != null) {
                optionalRatingCount++;
                totalRating += row.communityRating;
            }
            if(row.originalityRating != null) {
                optionalRatingCount++;
                totalRating += row.originalityRating;
            }
            if(row.communicationRating != null) {
                optionalRatingCount++;
                totalRating += row.communicationRating;
            }
            if(row.consistencyRating != null) {
                optionalRatingCount++;
                totalRating += row.consistencyRating;
            }
            totalRating /= (optionalRatingCount + 1);
            
            reviewRowsHtml += Mustache.render(
                reviewRowTemplate,
                Object.assign(
                    {
                        'roundRating': function() {
                            return round(3);
                        },
                        'totalRating': totalRating,
                        'date':        moment(row.created).format('D MMMM YYYY')
                    },
                    row
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
            network:             null,
            rating:              null,
            communityRating:     null,
            originalityRating:   null,
            communicationRating: null,
            consistencyRating:   null,
            comment:             null
        }
    };

    let ratingElement = document.querySelector('input[name="rating"]:checked');
    if(!ratingElement) {
        InfoModal.error('Oops!', 'Please select a "Personal" rating for this NFT project.');
        return;
    }

    payload.data.rating = ratingElement.value;

    let communityRatingElement = document.querySelector('input[name="community-rating"]:checked');
    if(communityRatingElement) payload.data.communityRating = communityRatingElement.value;

    let originalityRatingElement = document.querySelector('input[name="originality-rating"]:checked');
    if(originalityRatingElement) payload.data.originalityRating = originalityRatingElement.value;

    let communicationRatingElement = document.querySelector('input[name="communication-rating"]:checked');
    if(communicationRatingElement) payload.data.communicationRating = communicationRatingElement.value;

    let consistencyRatingElement = document.querySelector('input[name="consistency-rating"]:checked');
    if(consistencyRatingElement) payload.data.consistencyRating = consistencyRatingElement.value;

    let comment = document.getElementById('comment').value;
    if(comment != '') payload.data.comment = comment;

    const submitSpinner         = document.getElementById('submit-spinner');
    submitSpinner.style.display = 'block';

    return provider.getNetwork(
    ).then((network) => {
        payload.data.network = network.name;

        return provider.send(
            'eth_requestAccounts',
            []
        );
    }).then((addresses) => {
        payload.data.address = ethers.utils.getAddress(addresses[0]);     

        return provider.getSigner().signMessage(`Please sign this message to post your review, it's free and doesn't cost any gas.\n\n${JSON.stringify(payload.data)}`);
    }).then((signature) => {
        payload.signature = signature;

        return axios({
            method: 'post',
            url:    `/v1/nft-project/${entityUid}/review`,
            data:   payload
        });
    }).then(() => {
        submitSpinner.style.display = 'none';
        window.location.reload();

    }).catch((e) => {
        submitSpinner.style.display = 'none';

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

        if(e.code == 'NETWORK_ERROR' && e.event == 'changed') {
            InfoModal.error('Oops!', `You must use the Ethereum Mainnet network, please change this in MetaMask.`);
            return Promise.resolve();
        }

        InfoModal.error('Oops!', `An unexpected error occured, please contact our team if this issue persists.`);

        return Promise.reject(e);
    });
}

function onScroll() {
    let element = document.getElementById('infinite-review-row-container');
    var offset  = element.getBoundingClientRect().top - element.offsetParent.getBoundingClientRect().top;
    const top   = window.pageYOffset + window.innerHeight - offset;
    let spinner = document.getElementById('row-spinner');

    if(top + 150 >= element.scrollHeight && currentRow <= lastRow && spinner.style.display == 'none') {
        spinner.style.display = 'block';
        loadRows(10);
    }
}

window.addEventListener('touchmove', onScroll, { passive: false });
window.addEventListener('scroll',    onScroll, { passive: false });