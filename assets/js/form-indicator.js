$('#email').on('blur', function() {
    var data = {
      email: $('#email').val() // add ID
    };
    var url = 'http://192.168.56.101:3000/registreren/validate';
    $.ajax({
      url: url,
      data: data,
      method: 'POST'
    }).then(function (response) {
        if (response.length >= 1) {
            if ($('#validate').length === 0) { // Zoekt naar ID #validate
                $('#email').after('<p id="validate">E-mail al geregistreerd</p>'); // Voegt een <p> toe met #validate
            }
        } else {
            if ($('#validate').length == 1) { // Zoekt naar ID #validate
                $('#validate').remove(); // Verwijdert ID #validate
            }

        }
    }).catch(function (err) {
      console.error(err);
    });
});

//bron: http://stackoverflow.com/questions/35770547/how-to-change-focus-color-when-input-is-filled-in-with-required-attribute-javasc
