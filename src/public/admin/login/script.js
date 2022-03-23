function login(e) {
    e.preventDefault();

    let username = document.getElementById('login-username').value;
    let password = document.getElementById('login-password').value;

    axios({
        method: 'post',
        url:    `/v1/user/login`,
        data: {
            username: username,
            password: password
        }
    }).then((res) => {
        const decoded   = jwt_decode(res.data.data.accessToken);
        if(!decoded.admin) {
            alert(`${username} is not an admin!`);
            document.getElementById('login-username').value = '';
            document.getElementById('login-password').value = '';
            return Promise.resolve();
        }

        const expires   = new Date((new Date()).getTime() + ((decoded.exp - decoded.iat - 3600) * 1000)); // Browser time might be different, make the cookie expire 1 hour before it actually does.
        document.cookie = `accessToken=${res.data.data.accessToken}; Path=/; SameSite=Strict; Expires=${expires.toUTCString()}`;

        window.location.replace('/admin');
    }).catch((err) => {
        alert(err.response.data.error);
    });
}