$(document).ready(function() {
    $('#search-appointments').click(function() {
        const value = $('#searchInput').val();
        const field = $('#searchField').val();

        if (!field || !value) {
            alert("Please fill in all fields.");
        }

        window.location.href = '/view/' + field + '/' + value;
    });

});