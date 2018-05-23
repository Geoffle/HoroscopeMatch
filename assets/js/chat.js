$("#chat > section").scrollTop($("#chat > section")[0].scrollHeight - $("#chat > section")[0].clientHeight);

$("#myform").on("submit", function(event) {
    event.preventDefault(); // Stopt default action van submit knop
    var data = {
        message: $("#message").val()
    };
    var url = window.location.href;
    $.ajax({
        url: url,
        data: data,
        method: "POST"
    }).then(function(response) {
        $(document).ready(function() {
            $("#chat").load(location.href + " #chat > section", function(response, status, xhr) {
                if (status == "error") {
                } else {
                    $("#chat > section").scrollTop($("#chat > section")[0].scrollHeight - $("#chat > section")[0].clientHeight);
                }
            });
        });
        $("#myform")[0].reset(); // Reset tekstbox
    }).catch(function(err) {
        console.error(err);
    });
});

$(document).ready(function() { // Reload #chat > section elke 5 seconde & scroll naar beneden
    setInterval(function() {
        $("#chat").load(location.href + " #chat > section", function(response, status, xhr) {
            if (status == "error") {
            } else {
                $("#chat > section").scrollTop($("#chat > section")[0].scrollHeight - $("#chat > section")[0].clientHeight);
            }
        });
    }, 5000);
});

// bron: https://stackoverflow.com/questions/30646997/update-the-todo-list-without-refreshing-the-page-in-express-nodejs-app
