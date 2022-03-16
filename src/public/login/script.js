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
        document.cookie = `accessToken=${res.data.data.accessToken}; Path=/; SameSite=Strict`;
        window.location.replace('/admin'); 
    }).catch((err) => {
        alert(err.response.data.error);
    });
}