function addEntity(e) {
    e.preventDefault();

    let name             = document.getElementById('add-nft-project-name').value;
    let logoImageUrl     = document.getElementById('add-nft-project-logo-image-url').value;
    let featuredImageUrl = document.getElementById('add-nft-project-featured-image-url').value;
    let bannerImageUrl   = document.getElementById('add-nft-project-banner-image-url').value;
    let websiteUrl       = document.getElementById('add-nft-project-website-url').value;
    let openSeaUrl       = document.getElementById('add-nft-project-opensea-url').value;
    let twitterUrl       = document.getElementById('add-nft-project-twitter-url').value;
    let discordUrl       = document.getElementById('add-nft-project-discord-url').value;
    let description      = document.getElementById('add-nft-project-description').value;

    axios({
        method: 'post',
        url:    `/v1/nft-project`,
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
        document.getElementById('add-nft-project-name').value               = '';
        document.getElementById('add-nft-project-logo-image-url').value     = '';
        document.getElementById('add-nft-project-featured-image-url').value = '';
        document.getElementById('add-nft-project-banner-image-url').value   = '';
        document.getElementById('add-nft-project-website-url').value        = '';
        document.getElementById('add-nft-project-opensea-url').value        = '';
        document.getElementById('add-nft-project-twitter-url').value        = '';
        document.getElementById('add-nft-project-discord-url').value        = '';
        document.getElementById('add-nft-project-description').value        = '';

        info.success('Success!', 'NFT project successfully added.');
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}