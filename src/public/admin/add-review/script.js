function addReview(e) {
    e.preventDefault();

    let entityUid = document.getElementById("add-nft-review-entity-uid").value;
    let rating    = document.querySelector('input[name="add-nft-review-rating"]:checked').value;
    let username  = document.getElementById("add-nft-review-username").value;
    let review    = document.getElementById("add-nft-review-review").value;

    let infoModal = new bootstrap.Modal(document.getElementById('info-modal'),  {backdrop: 'static'});
    document.getElementById('info-modal-info').innerHTML = "Success!";

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

    document.getElementById("add-nft-review-entity-uid").value = nftProject.entityUid;

    document.getElementById("submit-button").disabled = false;
}

function loadNftProjects() {
    document.getElementById("add-nft-review-nft-project").value = '';
    document.getElementById("add-nft-review-username").value    = '';
    document.getElementById("add-nft-review-review").value      = '';

    document.getElementById("submit-button").disabled = true;

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
        document.getElementById("data-list-options").innerHTML = renderedOptions;

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

document.addEventListener("DOMContentLoaded", function() {

    loadNftProjects();
});