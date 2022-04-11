let info = {
    modal: null,
    success: function(title, message) {
        if(!info.modal) return;

        return info.show(title, message);
    },
    warn: function(title, message) {

    },
    error: function(title, message) {

    },
    show: function(title, message) {
        document.getElementById('info-modal-info').innerHTML = message;
        info.modal.show();
    }
};

document.addEventListener('TemplatesLoaded', function() {
    info.modal = new bootstrap.Modal(document.getElementById('info-modal'), {backdrop: 'static'});
});