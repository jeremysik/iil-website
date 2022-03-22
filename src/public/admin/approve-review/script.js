function approveReview(uid) {
}

function rejectReview(uid) {
}

function loadReviews() {
    document.getElementById("table-body").innerHTML = '';

    axios({
        method: 'get',
        url:    `/v1/review`
    }).then((res) => {
       // TODO

    }).catch((err) => {
        alert(JSON.stringify(err.response.data));
    });
}

document.addEventListener("DOMContentLoaded", function() {

    loadReviews();
});