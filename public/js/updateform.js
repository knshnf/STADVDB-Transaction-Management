$(document).ready(function() {
    $('#update-appointment').click(function() {
        const appointmentId = $('#appointment-id').val();
        const patientAge = $('#patient-age').val();
        const patientGender = $('#patient-gender').val();
        const hospitalName = $('#hospital-name').val();
        const queueDate = $('#queue-date').val();
        const city = $('#city').val();
        const province = $('#province').val();
        const regionName = $('#region-name').val();
        const mainSpecialty = $('#main-specialty').val();

        if (!appointmentId || !patientAge || !patientGender || !hospitalName || !queueDate || !city || !province || !regionName || !mainSpecialty) {
            alert("Please fill in all fields.");
            return;
        }

        const data = {
            appointmentId: appointmentId,
            patientAge: patientAge,
            patientGender: patientGender,
            hospitalName: hospitalName,
            queueDate: queueDate,
            city: city,
            province: province,
            regionName: regionName,
            mainSpecialty: mainSpecialty
        };

        $("body").css("cursor", "progress");
        $.ajax({
            url: "/update",
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(data) {
                alert('Appointment successfully updated.');

                $('#appointment-id').val('');
                $('#patient-age').val('');
                $('#patient-gender').val('');
                $('#hospital-name').val('');
                $('#queue-date').val('');
                $('#city').val('');
                $('#province').val('');
                $('#region-name').val('');
                $('#main-specialty').val('');
                $("body").css("cursor", "default");
            }
        });
    });

});