function addReview(e) {
    e.preventDefault();

    let entityUid      = document.getElementById("add-nft-review-entity-uid").value;
    let rating         = document.querySelector('input[name="add-nft-review-rating"]:checked').value;
    let username       = document.getElementById("add-nft-review-username").value;
    let review         = document.getElementById("add-nft-review-review").value;

    let successModal = new bootstrap.Modal(document.getElementById('success-modal'),  {backdrop: 'static'});

    axios({
        method: 'post',
        url:    `/v1/review/admin`,
        headers: {
            'Authorization': `Bearer ${getAccessToken()}`
        },
        data: {
            entityUid: entityUid,
            rating:    rating,
            username:  username,
            review:    review
        }
    }).then((res) => {
        successModal.show();
        loadNftCollections();
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

let nftCollections = [];

function changeNftCollection(e) {
    const name          = e.srcElement.value;
    const nftCollection = nftCollections.find((row) => row.name == name);

    document.getElementById("add-nft-review-entity-uid").value = nftCollection.entityUid;

    document.getElementById("submit-button").disabled = false;
}

function loadNftCollections() {
    document.getElementById("add-nft-review-nft-collection").value  = '';
    document.getElementById("add-nft-review-username").value = '';
    document.getElementById("add-nft-review-review").value   = '';

    document.getElementById("submit-button").disabled = true;

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

document.addEventListener("DOMContentLoaded", function() {

    loadNftCollections();
});