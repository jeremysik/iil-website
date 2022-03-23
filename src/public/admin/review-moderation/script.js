let reviewModerationTableRowTemplate = null;
fetch(
    `/template/review-moderation-table-row.template.html`
).then((response) => response.text())
.then((template) => {
    reviewModerationTableRowTemplate = template;
});

let infoModal;

function approveReview(uid) {
    axios({
        method: 'patch',
        url:    `/v1/review/${uid}`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        },
        data: {
            approved: 1
        }
    }).then((res) => {
        infoModal.show();
        loadReviews();

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

function rejectReview(uid) {
    axios({
        method: 'patch',
        url:    `/v1/review/${uid}`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`
        },
        data: {
            approved: -1
        }
    }).then((res) => {
        infoModal.show();
        loadReviews();

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

function loadReviews() {
    document.getElementById('table-body').innerHTML = '';

    axios({
        method: 'get',
        url:    `/v1/review`,
        headers: {
            Authorization: `Bearer ${getAccessToken()}`,
            records:       '0-19',
            approved:      0,
            entity:        1,
            user:          1
        }
    }).then((res) => {
        let rowHtml = '';
        res.data.data.rows.forEach((row) => {
            rowHtml += Mustache.render(reviewModerationTableRowTemplate, row);
        });
        document.getElementById('table-body').innerHTML = rowHtml;

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

document.addEventListener('TemplatesLoaded', function() {

    loadReviews();

    infoModal = new bootstrap.Modal(document.getElementById('info-modal'), {backdrop: 'static'});
    document.getElementById('info-modal-info').innerHTML = 'Success!';
});