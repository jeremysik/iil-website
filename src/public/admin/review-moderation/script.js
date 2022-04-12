let reviewModerationTableRowTemplate = null;
fetch(
    `/template/review-moderation-table-row.template.html`
).then((response) => response.text())
.then((template) => {
    reviewModerationTableRowTemplate = template;
});

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
        loadReviews();

    }).catch((err) => {
        if(err.response) {
            InfoModal.error('Oops!', JSON.stringify(err.response.data));
            return Promise.resolve();
        }
        
        InfoModal.error('Oops!', err);
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
        loadReviews();

    }).catch((err) => {
        if(err.response) {
            InfoModal.error('Oops!', JSON.stringify(err.response.data));
            return Promise.resolve();
        }
        
        InfoModal.error('Oops!', err);
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
        if(err.response) {
            InfoModal.error('Oops!', JSON.stringify(err.response.data));
            return Promise.resolve();
        }
        
        InfoModal.error('Oops!', err);
    });
}

document.addEventListener('TemplatesLoaded', function() {

    loadReviews();
});