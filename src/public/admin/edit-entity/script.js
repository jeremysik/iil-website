function editEntity(e) {
    e.preventDefault();

    if(e.submitter.id == 'delete-button') {
        fetch(
            `/template/confirm-modal.template.html`
        ).then((response) => response.text())
        .then((template) => {
            document.getElementById('confirm-modal-container').innerHTML = Mustache.render(template, {
                text:            `Are you sure you want to delete the NFT project: ${document.getElementById('edit-nft-project-name').value}`,
                confirmAction:   'Yes',
                cancelAction:    'No'
            });

            document.getElementById('confirm-modal-confirm-action').onclick = function() {
                deleteNftProject(document.getElementById('edit-nft-project-entity-uid').value);
            };

            let confirmModal = new bootstrap.Modal(document.getElementById('confirm-modal'),  {backdrop: 'static'});
            confirmModal.show();
        });
        return;
    }

    let entityUid        = document.getElementById('edit-nft-project-entity-uid').value;
    let name             = document.getElementById('edit-nft-project-name').value;
    let logoImageUrl     = document.getElementById('edit-nft-project-logo-image-url').value;
    let featuredImageUrl = document.getElementById('edit-nft-project-featured-image-url').value;
    let bannerImageUrl   = document.getElementById('edit-nft-project-banner-image-url').value;
    let websiteUrl       = document.getElementById('edit-nft-project-website-url').value;
    let openSeaUrl       = document.getElementById('edit-nft-project-opensea-url').value;
    let twitterUrl       = document.getElementById('edit-nft-project-twitter-url').value;
    let discordUrl       = document.getElementById('edit-nft-project-discord-url').value;
    let description      = document.getElementById('edit-nft-project-description').value;

    axios({
        method: 'patch',
        url:    `/v1/nft-project/${entityUid}`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        },
        data: {
            name:             name,
            logoImageUrl:     logoImageUrl,
            featuredImageUrl: featuredImageUrl,
            bannerImageUrl:   bannerImageUrl,
            websiteUrl:       websiteUrl,
            openSeaUrl:       openSeaUrl,
            twitterUrl:       twitterUrl,
            discordUrl:       discordUrl,
            description:      description
        }
    }).then((res) => {
        InfoModal.success('Yay!', 'NFT project successfully updated.');
        loadNftProjects();
    }).catch((err) => {
        InfoModal.error('Oops!', JSON.stringify(err.response.data));
    });
}

let nftProjects = [];

function loadNftProjects() {
    document.getElementById('edit-nft-project-nft-project').value        = '';
    document.getElementById('edit-nft-project-entity-uid').value         = '';
    document.getElementById('edit-nft-project-name').value               = '';
    document.getElementById('edit-nft-project-logo-image-url').value     = '';
    document.getElementById('edit-nft-project-featured-image-url').value = '';
    document.getElementById('edit-nft-project-banner-image-url').value   = '';
    document.getElementById('edit-nft-project-website-url').value        = '';
    document.getElementById('edit-nft-project-opensea-url').value        = '';
    document.getElementById('edit-nft-project-twitter-url').value        = '';
    document.getElementById('edit-nft-project-discord-url').value        = '';
    document.getElementById('edit-nft-project-description').value        = '';

    document.getElementById('submit-button').disabled = true;
    document.getElementById('delete-button').disabled = true;

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
        InfoModal.error('Oops!', JSON.stringify(err.response.data));
    });
}

function changeNftProject(e) {
    const name          = e.srcElement.value;
    const nftProject = nftProjects.find((row) => row.name == name);

    document.getElementById('edit-nft-project-entity-uid').value         = nftProject.entityUid;
    document.getElementById('edit-nft-project-name').value               = nftProject.name;
    document.getElementById('edit-nft-project-logo-image-url').value     = nftProject.logoImageUrl;
    document.getElementById('edit-nft-project-featured-image-url').value = nftProject.featuredImageUrl;
    document.getElementById('edit-nft-project-banner-image-url').value   = nftProject.bannerImageUrl;
    document.getElementById('edit-nft-project-website-url').value        = nftProject.websiteUrl;
    document.getElementById('edit-nft-project-opensea-url').value        = nftProject.openSeaUrl;
    document.getElementById('edit-nft-project-twitter-url').value        = nftProject.twitterUrl;
    document.getElementById('edit-nft-project-discord-url').value        = nftProject.discordUrl;
    document.getElementById('edit-nft-project-description').value        = nftProject.description;

    document.getElementById('submit-button').disabled = false;
    document.getElementById('delete-button').disabled = false;
}

function deleteNftProject(uid) {
    axios({
        method: 'delete',
        url:    `/v1/entity/${uid}`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    }).then((res) => {
        loadNftProjects();
    }).catch((err) => {
        InfoModal.error('Oops!', JSON.stringify(err.response.data));
    });
}

document.addEventListener('DOMContentLoaded', function() {

    loadNftProjects();
});