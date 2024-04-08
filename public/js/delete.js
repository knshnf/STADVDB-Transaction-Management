$(document).ready(function() {
    $('#delete-appointment').click(function() {
        const appointmentId = $('#appointment-id').val();

        const data = {
            appointmentId: appointmentId,
        };

        $.ajax({
            url: "/delete",
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(data) {
                console.log('Appointment successfully deleted.');
            }
        });
    });

});