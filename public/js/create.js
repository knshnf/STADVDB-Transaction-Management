$(document).ready(function() {
    $('#create-appointment').click(function() {
        const patientAge = $('#patient-age').val();
        const patientGender = $('#patient-gender').val();
        const hospitalName = $('#hospital-name').val();
        const queueDate = $('#queue-date').val();
        const city = $('#city').val();
        const province = $('#province').val();
        const regionName = $('#region-name').val();
        const mainSpecialty = $('#main-specialty').val();

        if (!patientAge || !patientGender || !hospitalName || !queueDate || !city || !province || !regionName || !mainSpecialty) {
            alert("Please fill in all fields.");
            return;
        }

        const data = {
            patientAge: patientAge,
            patientGender: patientGender,
            hospitalName: hospitalName,
            queueDate: queueDate,
            city: city,
            province: province,
            regionName: regionName,
            mainSpecialty: mainSpecialty
        };

        $.ajax({
            url: "/create",
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(data) {
                alert('Appointment successfully created.');

                $('#patient-age').val('');
                $('#patient-gender').val('');
                $('#hospital-name').val('');
                $('#queue-date').val('');
                $('#city').val('');
                $('#province').val('');
                $('#region-name').val('');
                $('#main-specialty').val('');
            }
        });
    });

});