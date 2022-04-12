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
        InfoModal.success('Yay!', `New password is: ${password}`);
        loadUsers();
    }).catch((err) => {
        InfoModal.error('Oops!', JSON.stringify(err.response.data));
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
        InfoModal.error('Oops!', JSON.stringify(err.response.data));
    });
}

document.addEventListener('DOMContentLoaded', function() {

    loadUsers();
});