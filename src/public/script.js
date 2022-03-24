function searchProject(e) {

}

document.addEventListener('TemplatesLoaded', (event) => {
    document.getElementById('title-search-title').innerHTML = 'NFT Projects';

    // Datalist
    axios({
        method: 'get',
        url:    `/v1/entity`,
        headers: {
            type: 'nft_project'
        }
    }).then((res) => {
        let datalistOptionTemplate = '<option value="{{ name }}">';
        let renderedOptions        = '';
        nftProjects                = res.data.data.rows;
        nftProjects.forEach((nftProject) => {
            renderedOptions += Mustache.render(
                datalistOptionTemplate,
                nftProject
            );
        });
        document.getElementById('search-data-list-options').innerHTML = renderedOptions;
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });

    // Records
    Promise.all([
        fetch(
            `/template/triple-entity-card.template.html`
        ).then((response) => response.text()),

        fetch(
            `/template/entity-card.template.html`
        ).then((response) => response.text()),

        axios({
            method: 'get',
            url:    `/v1/nft-project`,
            headers: {
                records: '0-9',
                order: 'desc'
            }
        })
    ]).then((res) => {
        const tripleEntityCardTemplate = res[0];
        const entityCardTemplate       = res[1];
        const nftProjectRes            = res[2].data;

        let entityCardsHtml = {};
        for(let i = 0; i < 3; i++) {
            entityCardsHtml[`card${i}`] = Mustache.render(
                entityCardTemplate,
                Object.assign(
                    {
                        'truncateName': function() {
                            return function(text, render) {
                                let renderedText = render(text);
                                if(renderedText.length < 47) return renderedText;
                                return renderedText.substr(0, 47) + '...';
                            }
                        },
                        'truncateDescription': function() {
                            return function(text, render) {
                                let renderedText = render(text);
                                if(renderedText.length < 97) return renderedText;
                                return renderedText.substr(0, 97) + '...';
                            }
                        },
                        'roundRating': function() {
                            return function(text, render) {
                                let rating = Number.parseFloat(render(text));
                                return rating.toPrecision(3);
                            }
                        },
                        'medalImageUrl': `/asset/medal-${i}.svg` 
                    },
                    nftProjectRes.data.rows[i]
                )
            );

        }
        document.getElementById('entity-card-container').innerHTML = Mustache.render(tripleEntityCardTemplate, entityCardsHtml);

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
});