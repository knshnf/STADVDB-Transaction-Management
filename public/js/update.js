$(document).ready(function() {
    $('#update').click(function() {
        const appointmentId = $('#appointment-id').val();

        if (!appointmentId) {
            alert("Please fill in all fields.");
        }

        window.location.href = '/update/' + appointmentId;
    });

});