function generatePassword() {
    const characters = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-+=`;
    let password     = ''; 
    for(let i = 0; i < 16; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return password;
}

function resetPassword(e) {
    e.preventDefault();

    let uid      = document.getElementById('user-admin-reset-password-uid').value;
    let password = generatePassword();

    let infoModal = new bootstrap.Modal(document.getElementById('info-modal'), {backdrop: 'static'});

    document.getElementById('info-modal-info').innerHTML = `Success! New password is: ${password}`;

    axios({
        method: 'patch',
        url:    `/v1/user/${uid}`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        },
        data: {
            password: password
        }
    }).then((res) => {
        infoModal.show();
        loadUsers();
    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

let users = [];

function changeUser(e) {
    const username = e.srcElement.value;
    const user     = users.find((row) => row.username == username);

    document.getElementById('submit-button').disabled             = false;
    document.getElementById('user-admin-reset-password-uid').value = user.uid;
}

function loadUsers() {
    document.getElementById('user-admin-reset-password-username').value = '';

    document.getElementById('submit-button').disabled = true;

    axios({
        method: 'get',
        url:    `/v1/user`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        }
    }).then((res) => {
        let datalistOptionTemplate = '<option value="{{ username }}">';
        let renderedOptions        = '';
        users                      = res.data.data.rows
        users.forEach((user) => {
            renderedOptions += Mustache.render(
                datalistOptionTemplate,
                user
            );
        });
        document.getElementById('data-list-options').innerHTML = renderedOptions;

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

document.addEventListener('DOMContentLoaded', function() {

    loadUsers();
});