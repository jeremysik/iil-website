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
                order:   'desc'
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
                        'entityUrl': `/nft-project/?entityUid=${res.data.data.rows[i].entityUid}` 
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
                            'markdown': function() {
                                return markdown(true);
                            },
                            'truncateDescription': function() {
                                return truncate(100);
                            },
                            'roundRating': function() {
                                return round(3);
                            },
                            'medalImageUrl': `/asset/medal-${currentRow}.svg`,
                            'entityUrl':     `/nft-project/?entityUid=${res.data.data.rows[i].entityUid}` 
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
                        'entityUrl': `/nft-project/?entityUid=${res.data.data.rows[i].entityUid}` 
                    },
                    res.data.data.rows[i]
                )
            );
            currentRow++;
        }

        if(Object.keys(entityCardsHtml).length != 0) {
            // First load
            document.querySelector('div[template-container="entity-card"]').innerHTML = Mustache.render(tripleEntityCardTemplate, entityCardsHtml);
        }

        document.querySelector('div[template-container="mobile-entity-row"]').innerHTML += mobileEntityRowsHtml;
        document.getElementById('mobile-row-spinner').style.display               = 'none';
        document.querySelector('div[template-container="entity-row"]').innerHTML  += entityRowsHtml;
        document.getElementById('row-spinner').style.display                      = 'none';

        if(currentRow >= lastRow) {
            document.getElementById('mobile-last-message').style.display = 'block';
            document.getElementById('last-message').style.display        = 'block';
        }
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

document.addEventListener('TemplatesLoaded', (event) => {
    [].forEach.call(document.getElementsByClassName('title-title'), (element) => {
        element.innerHTML = 'NFT Projects';
    });

    init();
});

function onScroll() {
    const responsiveClasses  = ['mobile',             'desktop'];
    const templateContainers = ['mobile-entity-row',  'entity-row'];
    const spinners           = ['mobile-row-spinner', 'row-spinner'];

    for(let i = 0; i < templateContainers.length; i++) {
        let responsiveClass = document.getElementsByClassName(responsiveClasses[i])[0];

        if(window.getComputedStyle(responsiveClass).display == 'none') continue;
        
        const templateContainer = document.querySelector(`div[template-container="${templateContainers[i]}"`);
        const spinner           = document.getElementById(spinners[i]);

        let offset = templateContainer.getBoundingClientRect().top - templateContainer.offsetParent.getBoundingClientRect().top;
        const top  = window.pageYOffset + window.innerHeight - offset;

        if((top + 150) >= templateContainer.scrollHeight && currentRow <= lastRow && spinner.style.display == 'none') {
            spinner.style.display = 'block';
            loadRows(10);
        }
    }
}

window.addEventListener('touchmove', onScroll, { passive: false });
window.addEventListener('scroll',    onScroll, { passive: false });