$(document).ready(function() {
    $('#update').click(function() {
        const appointmentId = $('#appointment-id').val();
        window.location.href = '/update/' + appointmentId;
    });

});