const urlParams = new URLSearchParams(window.location.search);
const query     = urlParams.get('q');

let searchRowTemplate = null;
let currentRow        = 0;
let lastRow           = null;

function loadRows(count) {

    let promises = [];
    if(!searchRowTemplate) {
        promises.push(
            fetch(
                `/template/search-row.template.html`
            ).then((response) => response.text())
        );
    }

    if(query == '') {
        currentRow = 1;
        lastRow    = 0;

        document.getElementById('row-spinner').style.display  = 'none';
        document.getElementById('last-message').style.display = 'block';

        // Need to wait a frame before showing the error.
        setTimeout(() => {
            InfoModal.error('Oops!', 'You must enter a search query.');
        }, 0);
        
        return Promise.resolve();
    }

    return Promise.all(
        promises
    ).then((res) => {
        if(res.length != 0) {
            searchRowTemplate = res[0];
        }

        return axios({
            method: 'get',
            url:    `/v1/entity/search/${query}`,
            headers: {
                records: `${currentRow}-${currentRow + count - 1}`
            }
        });
    }).then((res) => {

        let searchRowsHtml = '';
        lastRow            = res.data.data.total - 1;

        for(let i = 0; i < res.data.data.rows.length; i++) {
            searchRowsHtml += Mustache.render(
                searchRowTemplate,
                Object.assign(
                    {
                        'truncateName': function() {
                            return truncate(50);
                        },
                        'roundRating': function() {
                            return round(3);
                        },
                        'entityUrl': `/${res.data.data.rows[i].type.replaceAll('_', '-')}/?entityUid=${res.data.data.rows[i].uid}` 
                    },
                    res.data.data.rows[i]
                )
            );
            currentRow++;
        }

        document.querySelector('div[template-container="search-row"]').innerHTML += searchRowsHtml;
        document.getElementById('row-spinner').style.display                      = 'none';

        if(currentRow >= lastRow) document.getElementById('last-message').style.display = 'block';
    }).catch((err) => {
        currentRow = 1;
        lastRow    = 0;

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
        element.innerHTML = 'Search Results';
    });

    [].forEach.call(document.getElementsByClassName('search-entities'), (element) => {
        element.value = query;
    });

    init();
});

window.addEventListener('scroll', () => {
    let element = document.querySelector('div[template-container="search-row"]');
    var offset  = element.getBoundingClientRect().top - element.offsetParent.getBoundingClientRect().top;
    const top   = window.pageYOffset + window.innerHeight - offset;
    let spinner = document.getElementById('row-spinner');

    if(top >= element.scrollHeight && currentRow <= lastRow && spinner.style.display == 'none') {
        spinner.style.display = 'block';
        loadRows(10);
    }
}, { passive: false });