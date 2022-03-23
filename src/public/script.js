document.addEventListener('TemplatesLoaded', (event) => {
    document.getElementById('title-search-title').innerHTML = 'NFT Projects';

    // axios({
    //     method: 'get',
    //     url:    `/v1/nft-project`
    // }).then((res) => {
    //     let datalistOptionTemplate = '<option value="{{ name }}">';
    //     let renderedOptions        = '';
    //     nftProjects                = res.data.data.rows;
    //     nftProjects.forEach((nftProject) => {
    //         renderedOptions += Mustache.render(
    //             datalistOptionTemplate,
    //             nftProject
    //         );
    //     });
    //     document.getElementById('data-list-options').innerHTML = renderedOptions;

    // }).catch((err) => {
    //     alert(JSON.stringify(err.response.data));
    // });
});