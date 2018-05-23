var j = 4; // Laad vanaf vierde profiel

$(window).scroll(function() {
    if($(window).scrollTop() == $(document).height() - $(window).height()) {
        var url = window.location.href;

        $.ajax({
            url: url,
            method: 'POST'
        }).then(function (response) {
            if (response.length < 1) { // Array is leeg
                j = 0;
            } else {
                for (var i = 0; i < 2; i++) { // Voer 2 keer uit
                    $('#grid a:last-of-type').after('<a href="/browsen/' + response[j].ID + '"></a>');
                    $('#grid a:last-of-type').append('<article>');
                    $('#grid a:last-of-type article').append('<div><img src="/uploads/' + response[j].ID + '.png" alt="' + response[j].ID + '"></div><h2>' + response[j].name + '</h2><p>' + response[j].location + '</p><p>' + response[j].horoscopeSun + '</p><p>' + response[j].horoscopeMoon + '</p>');
                    j++; // Verhoog nummer om volgende profiel te laden
                }
            }
        }).catch(function (err) {
            console.error(err);
        });
    }
});

// bron: https://stackoverflow.com/questions/23968607/bottom-scroll-checked-acts-in-reverse
