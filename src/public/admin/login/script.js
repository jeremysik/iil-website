function login(e) {
    e.preventDefault();

    if(!window.ethereum) {
        InfoModal.warn('Hmm...', `MetaMask not detected. Please try again with a different browser.`);
        return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum, 'mainnet');

    let payload = {
        signature: null,
        data: {
            address: null
        }
    };

    return provider.send(
        'eth_requestAccounts',
        []
    ).then((addresses) => {
        payload.data.address = ethers.utils.getAddress(addresses[0]);     

        return provider.getSigner().signMessage(JSON.stringify(payload.data));
    }).then((signature) => {
        payload.signature = signature;

        return axios({
            method: 'post',
            url:    `/v1/user/login`,
            data:   payload
        });
    }).then((res) => {
        const decoded = jwt_decode(res.data.data.accessToken);
        if(!decoded.admin) {
            InfoModal.error('Oops!', `${provider} is not an admin.`)
            return Promise.resolve();
        }

        const expires   = new Date((new Date()).getTime() + ((decoded.exp - decoded.iat - 3600) * 1000)); // Browser time might be different, make the cookie expire 1 hour before it actually does.
        document.cookie = `accessToken=${res.data.data.accessToken}; Path=/; SameSite=Strict; Expires=${expires.toUTCString()}`;

        window.location.replace('/admin');
    }).catch((e) => {
        if(e.code == -32002) {
            InfoModal.warn('Hmm...', `Please check MetaMask and unlock your wallet if necessary.`);
            return Promise.resolve();
        }

        if(e.code == 4001) {
            InfoModal.error('Oops!', `To login please sign the message via MetaMask.`);
            return Promise.resolve();
        }

        if(e.response && e.response.data && e.response.data.error) {
            InfoModal.error('Oops!', e.response.data.error);
            return Promise.resolve();
        }

        return Promise.reject(e);
    });
}