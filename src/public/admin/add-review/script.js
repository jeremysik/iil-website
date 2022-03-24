function addReview(e) {
    e.preventDefault();

    let entityUid           = document.getElementById('add-nft-review-entity-uid').value;
    let originalityRating   = document.querySelector('input[name="add-nft-review-originality-rating"]:checked').value;
    let communityRating     = document.querySelector('input[name="add-nft-review-community-rating"]:checked').value;
    let communicationRating = document.querySelector('input[name="add-nft-review-communication-rating"]:checked').value;
    let consistencyRating   = document.querySelector('input[name="add-nft-review-consistency-rating"]:checked').value;
    let username            = document.getElementById('add-nft-review-username').value;
    let comment             = document.getElementById('add-nft-review-comment').value;

    let infoModal = new bootstrap.Modal(document.getElementById('info-modal'), {backdrop: 'static'});
    document.getElementById('info-modal-info').innerHTML = 'Success!';

    axios({
        method: 'post',
        url:    `/v1/review/admin`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        },
        data: {
            entityUid:           entityUid,
            username:            username,
            originalityRating:   originalityRating,
            communityRating:     communityRating,
            communicationRating: communicationRating,
            consistencyRating:   consistencyRating,
            comment:             comment
        }
    }).then((res) => {
        infoModal.show();
        loadNftProjects();
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

let nftProjects = [];

function changeNftProject(e) {
    const name       = e.srcElement.value;
    const nftProject = nftProjects.find((row) => row.name == name);

    document.getElementById('add-nft-review-entity-uid').value = nftProject.entityUid;

    document.getElementById('submit-button').disabled = false;
}

function loadNftProjects() {
    document.getElementById('add-nft-review-nft-project').value = '';
    document.getElementById('add-nft-review-username').value    = '';
    document.getElementById('add-nft-review-comment').value     = '';

    document.getElementById('submit-button').disabled = true;

    axios({
        method: 'get',
        url:    `/v1/nft-project`
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
        document.getElementById('data-list-options').innerHTML = renderedOptions;

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

document.addEventListener('DOMContentLoaded', function() {

    loadNftProjects();
});