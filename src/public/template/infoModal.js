let InfoModal = {
    modal: null,
    reset: function() {
        document.getElementById('info-check-icon').style.display       = 'none';
        document.getElementById('info-exclamation-icon').style.display = 'none';
        document.getElementById('info-cross-icon').style.display       = 'none';

        let infoButton = document.getElementById('info-button');
        infoButton.classList.remove('success-button');
        infoButton.classList.remove('warn-button');
        infoButton.classList.remove('error-button');
    },
    success: function(title, message) {
        if(!InfoModal.modal) return;

        InfoModal.reset();

        document.getElementById('info-check-icon').style.display = 'block';
        document.getElementById('info-button').classList.add('success-button');

        document.getElementById('info-modal-title').innerHTML = title;
        document.getElementById('info-modal-info').innerHTML  = message;
        InfoModal.modal.show();
    },
    warn: function(title, message) {
        if(!InfoModal.modal) return;

        InfoModal.reset();

        document.getElementById('info-exclamation-icon').style.display = 'block';
        document.getElementById('info-button').classList.add('warn-button');

        document.getElementById('info-modal-title').innerHTML = title;
        document.getElementById('info-modal-info').innerHTML  = message;
        InfoModal.modal.show();
    },
    error: function(title, message) {
        if(!InfoModal.modal) return;

        InfoModal.reset();

        document.getElementById('info-cross-icon').style.display = 'block';
        document.getElementById('info-button').classList.add('error-button');

        document.getElementById('info-modal-title').innerHTML = title;
        document.getElementById('info-modal-info').innerHTML  = message;
        InfoModal.modal.show();
    }
};

document.addEventListener('TemplatesLoaded', function() {
    InfoModal.modal = new bootstrap.Modal(document.getElementById('info-modal'), {backdrop: 'static'});
});