function editEntity(e) {
    e.preventDefault();

    if(e.submitter.id == 'delete-button') {
        
        return;
    }

    console.log(e.submitter.id);

    // let name           = document.getElementById("add-nft-collection-name").value;
    // let bannerImageUrl = document.getElementById("add-nft-collection-banner-image-url").value;
    // let websiteUrl     = document.getElementById("add-nft-collection-website-url").value;
    // let openSeaUrl     = document.getElementById("add-nft-collection-opensea-url").value;
    // let twitterUrl     = document.getElementById("add-nft-collection-twitter-url").value;
    // let discordUrl     = document.getElementById("add-nft-collection-discord-url").value;
    // let description    = document.getElementById("add-nft-collection-description").value;

    // let successModal = new bootstrap.Modal(document.getElementById('success-modal'),  {backdrop: 'static'});

    // axios({
    //     method: 'post',
    //     url:    `/v1/entity/nft-collection`,
    //     headers: {
    //         'Authorization': `Bearer ${getAccessToken()}`
    //     },
    //     data: {
    //         name:           name,
    //         bannerImageUrl: bannerImageUrl,
    //         websiteUrl:     websiteUrl,
    //         openSeaUrl:     openSeaUrl,
    //         twitterUrl:     twitterUrl,
    //         discordUrl:     discordUrl,
    //         description:    description
    //     }
    // }).then((res) => {
    //     document.getElementById("add-nft-collection-name").value             = '';
    //     document.getElementById("add-nft-collection-banner-image-url").value = '';
    //     document.getElementById("add-nft-collection-website-url").value      = '';
    //     document.getElementById("add-nft-collection-opensea-url").value      = '';
    //     document.getElementById("add-nft-collection-twitter-url").value      = '';
    //     document.getElementById("add-nft-collection-discord-url").value      = '';
    //     document.getElementById("add-nft-collection-description").value      = '';

    //     successModal.show();
    // }).catch((err) => {
    //     alert(JSON.stringify(err.response.data));
    // });
}

document.addEventListener("DOMContentLoaded", function() {
    axios({
        method: 'get',
        url:    `/v1/entity/nft-collection`
    }).then((res) => {
        console.log(res.data.data);
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
});