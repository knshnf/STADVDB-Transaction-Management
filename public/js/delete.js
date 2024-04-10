$(document).ready(function() {
    $('#delete-appointment').click(function() {
        const appointmentId = $('#appointment-id').val();

        if (!appointmentId) {
            alert("Please fill in all fields.");
        }

        const data = {
            appointmentId: appointmentId,
        };

        $("body").css("cursor", "progress");
        $.ajax({
            url: "/delete",
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(data) {
                alert('Appointment successfully deleted.');

                $('#appointment-id').val('');
                $("body").css("cursor", "default");
            }
        });
    });

});