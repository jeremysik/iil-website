const etherScanApiKeyPublic = 'NU5F1GJ7UETV3RZKRDCIVPPPUSZ2CBQSPR'; 
let provider                = null;

function searchEntities(e) {
    e.preventDefault();
    let searchTerm = e.srcElement.querySelector('input').value;
    
    window.location.href = `/search/?q=${encodeURIComponent(searchTerm)}`;
}

function connect() {
    if(!provider) {
        InfoModal.warn('Hmm...', `MetaMask not detected. Please try again with a different browser.`);
        return Promise.resolve();
    }

    return provider.send(
        'eth_requestAccounts', 
        []
    ).then((addresses) => {
        return validateAddress(addresses[0]);
    }).catch((e) => {
        if(e.code == -32002) {
            InfoModal.warn('Hmm...', `Please check MetaMask and unlock your wallet if necessary.`);
            return Promise.resolve();
        }

        return Promise.reject(e);
    });   
}

function validateAddress(address) {
    if(!provider) {
        InfoModal.warn('Hmm...', `MetaMask not detected. Please try again with a different browser.`);
        return Promise.resolve();
    }

    return axios({
        method: 'get',
        url:    `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherScanApiKeyPublic}`
    }).then((res) => {
        if(!res.data.result) {
            InfoModal.warn('Hmm...', `Couldn't contact EtherScan to validate your wallet balance. Some website features may not work as intended.`);
            return Promise.resolve();
        }

        let balance = res.data.result * Math.pow(10, -18);
        if(balance >= 0.01) {
            return Promise.resolve();
        }

        return axios({
            method: 'get',
            url:    `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&page=1&offset=10&sort=asc&apikey=${etherScanApiKeyPublic}`
        }).then((res) => {
            if(!res.data.result) {
                InfoModal.warn('Hmm...', `Couldn't contact EtherScan to validate your wallet transactions. Some website features may not work as intended.`);
                return Promise.resolve();
            }
    
            if(res.data.result.length < 10) {
                InfoModal.warn('Hmm...', `Your wallet must have at least 0.01 ETH or made 10 transactions to use all features on this website (such as posting a review).`);
                return Promise.resolve();
            }           
        });
    }).catch((err) => {
        InfoModal.error('Oops!', JSON.stringify(err.response.data));
    });
}

function onConnect(address) {
    [].forEach.call(document.getElementsByClassName('connected'), (element) => {
        element.style.display = 'none';
    });
    [].forEach.call(document.getElementsByClassName('disconnected'), (element) => {
        element.style.display = 'block';
    });

    validateAddress(address);
}

function onDisconnect() {
    [].forEach.call(document.getElementsByClassName('connected'), (element) => {
        element.style.display = 'block';
    });
    [].forEach.call(document.getElementsByClassName('disconnected'), (element) => {
        element.style.display = 'none';
    });
}

document.addEventListener('TemplatesLoaded', function() {
    // Set the correct menu item active
    [].forEach.call(document.getElementsByClassName('navigation-link'), (element) => {
        if(window.location.pathname == element.pathname) {
            element.classList.add('active');
            [].forEach.call(element.getElementsByClassName('navigation-icon'), (iconElement) => {
                iconElement.classList.remove('svg-white');
                iconElement.classList.add('svg-cyan');
            });
        } 
    });

    if(window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        window.ethereum.on('accountsChanged', (accounts) => {
            if(accounts.length > 0) {
                onConnect(accounts[0]);
                return;
            }

            onDisconnect();
        });

        provider.listAccounts(
        ).then((accounts) => {
            if(accounts.length > 0) onConnect(accounts[0]);
        }).catch(() => {});
    }
});