function searchProject(e) {
    // TODO: Implement me
}

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

let tripleEntityCardTemplate  = null;
let entityCardTemplate        = null;
let mobileEntityRowTemplate   = null;
let entityRowTemplate         = null;
let currentRow                = 0;
let lastRow                   = null;

function loadRows(count) {

    let promises = [];
    if(!tripleEntityCardTemplate || !entityCardTemplate || !mobileEntityRowTemplate || !entityRowTemplate) {
        promises.push(
            fetch(
                `/template/triple-entity-card.template.html`
            ).then((response) => response.text())
        );
        promises.push(
            fetch(
                `/template/entity-card.template.html`
            ).then((response) => response.text())
        );
        promises.push(
            fetch(
                `/template/mobile-entity-row.template.html`
            ).then((response) => response.text())
        );
        promises.push(
            fetch(
                `/template/entity-row.template.html`
            ).then((response) => response.text())
        );
    }

    return Promise.all(
        promises
    ).then((res) => {
        if(res.length != 0) {
            tripleEntityCardTemplate  = res[0];
            entityCardTemplate        = res[1];
            mobileEntityRowTemplate   = res[2];
            entityRowTemplate         = res[3];
        }

        return axios({
            method: 'get',
            url:    `/v1/nft-project`,
            headers: {
                records: `${currentRow}-${currentRow + count - 1}`,
                order: 'desc'
            }
        });
    }).then((res) => {

        let mobileEntityRowsHtml = '';
        let entityCardsHtml      = {};
        let entityRowsHtml       = '';
        lastRow                  = res.data.data.total - 1;

        for(let i = 0; i < res.data.data.rows.length; i++) {
            
            mobileEntityRowsHtml += Mustache.render(
                mobileEntityRowTemplate,
                Object.assign(
                    {
                        'truncateName': function() {
                            return truncate(50);
                        },
                        'roundRating': function() {
                            return round(3);
                        },
                        'rank':      currentRow + 1,
                        'entityUrl': `/nft-project/?uid=${res.data.data.rows[i].uid}` 
                    },
                    res.data.data.rows[i]
                )
            );

            if(currentRow < 3) {
                entityCardsHtml[`card${i}`] = Mustache.render(
                    entityCardTemplate,
                    Object.assign(
                        {
                            'truncateName': function() {
                                return truncate(50);
                            },
                            'truncateDescription': function() {
                                return truncate(100);
                            },
                            'roundRating': function() {
                                return round(3);
                            },
                            'medalImageUrl': `/asset/medal-${currentRow}.svg`,
                            'entityUrl':     `/nft-project/?uid=${res.data.data.rows[i].uid}` 
                        },
                        res.data.data.rows[i]
                    )
                );

                currentRow++;
                continue;
            }

            entityRowsHtml += Mustache.render(
                entityRowTemplate,
                Object.assign(
                    {
                        'roundRating': function() {
                            return round(3);
                        },
                        'rank':      currentRow + 1,
                        'entityUrl': `/nft-project/?uid=${res.data.data.rows[i].uid}` 
                    },
                    res.data.data.rows[i]
                )
            );
            currentRow++;
        }

        if(Object.keys(entityCardsHtml).length != 0) {
            // First load
            document.getElementById('entity-card-container').innerHTML         = Mustache.render(tripleEntityCardTemplate, entityCardsHtml);
            document.getElementById('infinite-entity-row-container').innerHTML = '';
        }

        document.getElementById('mobile-infinite-entity-row-container').innerHTML += mobileEntityRowsHtml;
        document.getElementById('mobile-row-spinner').style.display               = 'none';
        document.getElementById('infinite-entity-row-container').innerHTML        += entityRowsHtml;
        document.getElementById('row-spinner').style.display                      = 'none';

        if(currentRow >= lastRow) {
            document.getElementById('mobile-last-message').style.display = 'block';
            document.getElementById('last-message').style.display        = 'block';
        }

        console.log('done');
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

document.addEventListener('TemplatesLoaded', (event) => {
    Array.prototype.forEach.call(document.getElementsByClassName('title-title'), (element) => {
        element.innerHTML = 'NFT Projects';
    });

    init();
});

window.addEventListener('scroll', () => {
    const responsiveContainers = ['mobile-mode', 'desktop-mode'];
    const rowContainers        = ['mobile-infinite-entity-row-container', 'infinite-entity-row-container'];
    const spinners             = ['mobile-row-spinner', 'row-spinner'];

    for(let i = 0; i < rowContainers.length; i++) {
        let responsiveContainer = document.getElementById(responsiveContainers[i]);

        if(window.getComputedStyle(responsiveContainer).display == 'none') continue;
        
        const rowContainer = document.getElementById(rowContainers[i]);
        const spinner      = document.getElementById(spinners[i]);

        let offset = rowContainer.getBoundingClientRect().top - rowContainer.offsetParent.getBoundingClientRect().top;
        const top  = window.pageYOffset + window.innerHeight - offset;

        if(top >= rowContainer.scrollHeight && currentRow <= lastRow && spinner.style.display == 'none') {
            spinner.style.display = 'block';
            loadRows(10);
        }
    }
}, { passive: false });