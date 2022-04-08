let provider = null;

function searchEntities(e) {
    e.preventDefault();
    let searchTerm = e.srcElement.querySelector('input').value;
    
    window.location.href = `/search/?q=${encodeURIComponent(searchTerm)}`;
}

function connect() {
    if(!provider) {
        console.error('No provider detected!');
        return;
    }

    provider.send(
        'eth_requestAccounts', 
        []
    ).then(() => {
        const signer = provider.getSigner();
        return signer.getAddress();
    }).then((signerAddress) => {
        console.log(signerAddress);
    }).catch((e) => {
        console.error(e);
    });   
}

function onConnect() {
    [].forEach.call(document.getElementsByClassName('connected'), (element) => {
        element.style.display = 'none';
    });
    [].forEach.call(document.getElementsByClassName('disconnected'), (element) => {
        element.style.display = 'block';
    });

    console.log('connected');
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
                onConnect();
                return;
            }

            onDisconnect();
        });

        provider.listAccounts(
        ).then((accounts) => {
            if(accounts.length > 0) onConnect();
        }).catch(() => {});
    }
});