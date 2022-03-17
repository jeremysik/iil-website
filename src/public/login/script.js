function login(e) {
    e.preventDefault();

    let email    = document.getElementById("login-email").value;
    let password = document.getElementById("login-password").value;

    axios({
        method: 'post',
        url:    `/v1/admin/login`,
        data: {
            email:    email,
            password: password
        }
    }).then((res) => {
        const decoded   = jwt_decode(res.data.data.accessToken);
        const expires   = new Date((new Date()).getTime() + ((decoded.exp - decoded.iat - 3600) * 1000)); // Browser time might be different, make the cookie expire 1 hour before it actually does.
        document.cookie = `accessToken=${res.data.data.accessToken}; Path=/; SameSite=Strict; Expires=${expires.toUTCString()}`;

        window.location.replace('/admin'); 
    }).catch((err) => {
        alert(err.response.data.error);
    });
}