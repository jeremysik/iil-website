function editEntity(e) {
    e.preventDefault();

    if(e.submitter.id == 'delete-button') {
        fetch(
            `/template/confirm-modal.template.html`
        ).then((response) => response.text())
        .then((template) => {
            document.getElementById("confirm-modal-container").innerHTML = Mustache.render(template, {
                text:            `Are you sure you want to delete the NFT collection: ${document.getElementById("edit-nft-collection-name").value}`,
                confirmAction:   'Yes',
                cancelAction:    'No'
            });

            document.getElementById("confirm-modal-confirm-action").onclick = function() {
                deleteNftCollection(document.getElementById("edit-nft-collection-entity-uid").value);
            };

            let confirmModal = new bootstrap.Modal(document.getElementById("confirm-modal"),  {backdrop: 'static'});
            confirmModal.show();
        });
        return;
    }

    let uid            = document.getElementById("edit-nft-collection-uid").value;
    let entityUid      = document.getElementById("edit-nft-collection-entity-uid").value;
    let name           = document.getElementById("edit-nft-collection-name").value;
    let bannerImageUrl = document.getElementById("edit-nft-collection-banner-image-url").value;
    let websiteUrl     = document.getElementById("edit-nft-collection-website-url").value;
    let openSeaUrl     = document.getElementById("edit-nft-collection-opensea-url").value;
    let twitterUrl     = document.getElementById("edit-nft-collection-twitter-url").value;
    let discordUrl     = document.getElementById("edit-nft-collection-discord-url").value;
    let description    = document.getElementById("edit-nft-collection-description").value;

    let successModal = new bootstrap.Modal(document.getElementById('success-modal'),  {backdrop: 'static'});

    axios({
        method: 'patch',
        url:    `/v1/entity/nft-collection/${uid}`,
        headers: {
            'Authorization': `Bearer ${getAccessToken()}`
        },
        data: {
            uid:            uid,
            entityUid:      entityUid,
            name:           name,
            bannerImageUrl: bannerImageUrl,
            websiteUrl:     websiteUrl,
            openSeaUrl:     openSeaUrl,
            twitterUrl:     twitterUrl,
            discordUrl:     discordUrl,
            description:    description
        }
    }).then((res) => {
        successModal.show();
        loadNftCollections();
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

let nftCollections = [];

function loadNftCollections() {
    document.getElementById("edit-nft-collection-nft-collection").value   = '';
    document.getElementById("edit-nft-collection-uid").value              = '';
    document.getElementById("edit-nft-collection-entity-uid").value       = '';
    document.getElementById("edit-nft-collection-name").value             = '';
    document.getElementById("edit-nft-collection-banner-image-url").value = '';
    document.getElementById("edit-nft-collection-website-url").value      = '';
    document.getElementById("edit-nft-collection-opensea-url").value      = '';
    document.getElementById("edit-nft-collection-twitter-url").value      = '';
    document.getElementById("edit-nft-collection-discord-url").value      = '';
    document.getElementById("edit-nft-collection-description").value      = '';

    document.getElementById("submit-button").disabled = true;
    document.getElementById("delete-button").disabled = true;

    axios({
        method: 'get',
        url:    `/v1/entity/nft-collection`
    }).then((res) => {
        let datalistOptionTemplate = '<option value="{{ name }}">';
        let renderedOptions        = '';
        nftCollections             = res.data.data.rows;
        nftCollections.forEach((nftCollection) => {
            renderedOptions += Mustache.render(
                datalistOptionTemplate,
                nftCollection
            );
        });
        document.getElementById("data-list-options").innerHTML = renderedOptions;

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

function changeNftCollection(e) {
    const name          = e.srcElement.value;
    const nftCollection = nftCollections.find((row) => row.name == name);

    document.getElementById("edit-nft-collection-uid").value              = nftCollection.uid;
    document.getElementById("edit-nft-collection-entity-uid").value       = nftCollection.entityUid;
    document.getElementById("edit-nft-collection-name").value             = nftCollection.name;
    document.getElementById("edit-nft-collection-banner-image-url").value = nftCollection.bannerImageUrl;
    document.getElementById("edit-nft-collection-website-url").value      = nftCollection.websiteUrl;
    document.getElementById("edit-nft-collection-opensea-url").value      = nftCollection.openSeaUrl;
    document.getElementById("edit-nft-collection-twitter-url").value      = nftCollection.twitterUrl;
    document.getElementById("edit-nft-collection-discord-url").value      = nftCollection.discordUrl;
    document.getElementById("edit-nft-collection-description").value      = nftCollection.description;

    document.getElementById("submit-button").disabled = false;
    document.getElementById("delete-button").disabled = false;
}

function deleteNftCollection(uid) {
    axios({
        method: 'delete',
        url:    `/v1/entity/${uid}`,
        headers: {
            'Authorization': `Bearer ${getAccessToken()}`
        }
    }).then((res) => {
        loadNftCollections();
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

document.addEventListener("DOMContentLoaded", function() {

    loadNftCollections();
});