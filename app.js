var express = require("express");
var session = require("express-session"); // Session module
var bodyParser = require("body-parser");
var mysql = require("mysql");
var myConnection = require("express-myconnection"); // Mysql connection module
var multer = require("multer"); // Upload module
var fs = require("fs"); // Upload file rename module
var path = require("path");

var app = express();

var dbOptions = {
    host: "localhost",
    user: "student",
    password: "serverSide",
    database: "horoscopematch"
};

var upload = multer({dest: "assets/uploads/"});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(myConnection(mysql, dbOptions, "single"));

app.use(session({ // Gebruikers session
    secret: "@#$#@!", resave: false,
    saveUninitialized: true,
}));

app.use(upload.single("bs-file")); // Upload form name

/*========================================================
    VIEW ENGINE
========================================================*/

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static("assets")); // Static files in assets folder

/*========================================================
    GLOBAL
========================================================*/

app.use("/*", function(req, res, next) { // Locals voor alle pagina's
    res.locals.admin = req.session.admin;
    res.locals.deleteUser = "";

    res.locals.css = "";
    res.locals.js = "";
    res.locals.browseIcon = "/icons/browse.svg";
    res.locals.chatIcon = "/icons/chat.svg";
    res.locals.userIcon = "/icons/user.svg";

    next();
});

//Bron: http://stackoverflow.com/questions/16452123/how-to-create-global-variables-accessible-in-all-views-using-express-node-js

/*========================================================
    INLOG
========================================================*/

app.get("/", function(req, res) { // Login pagina
    if (req.session.loggedin == true) {
        res.redirect("/browsen");
    } else {
        res.render("index");
    }
});

app.post("/", function(req, res) { // Login systeem
    req.getConnection(function(err, connection) {
        connection.query("SELECT * FROM users WHERE email =? AND password =?", [req.body.username, req.body.password], function(err, result) {
            if (result.length < 1) {
                req.session.userid = false;
                res.redirect("/login");
            } else if (result[0].admin == 1) {
                req.session.userid = result[0].ID;
                req.session.admin = true;
                res.redirect("/login");
            } else {
                req.session.userid = result[0].ID;
                res.redirect("/login");
            }
        });
    });
});


app.get("/login", function(req, res) {
    if (req.session.userid == false) {
        res.redirect("/");
    } else if (req.session.userid != false && req.session.admin == true) {
        req.session.loggedin = true;
        res.redirect("/browsen");
    } else {
        req.session.loggedin = true;
        res.redirect("/profiel");
    }
});

app.get("/uitloggen", function(req, res) {
    req.session.destroy(function() {
        res.redirect("/");
    });
});

/*========================================================
    REGISTREREN
========================================================*/

app.get("/registreren", function(req, res) {
    res.render("registreren");
});

app.post("/registreren", function(req, res) {
    req.getConnection(function(err, connection) {
        var data = {
            name        : req.body.name,
            sex         : req.body.sex,
            birthdate   : req.body.birthdate,
            location    : req.body.location,
            email       : req.body.email,
            password    : req.body.password
        };

        connection.query("INSERT INTO users SET ?", [data], function(err, result) {
            req.session.loggedin = true;
        });

        connection.query("SELECT id FROM users WHERE email =? AND password =?", [req.body.email, req.body.password], function(err, result) {
            req.session.userid = result[0].id;

            res.redirect("/profiel");
        });
    });
});

app.post("/registreren/validate", function(req, res) { // Email controle met JQuery
    req.getConnection(function(err, connection) {

        connection.query("SELECT * FROM users WHERE email=?", [req.body.email], function(err, result) {
            res.send(result); // Stuurt result terug naar browser
        });
    });
});

/*========================================================
    BROWSEN
========================================================*/

app.use("/browsen/*", function(req, res, next) { // Locals voor alle pagina's in de route /browsen/*
    res.locals.css = "<link rel=\"stylesheet\" href=\"/css/profile.css\" type=\"text/css\">";
    res.locals.browseIcon = "/icons/browseA.svg";

    next();
});

app.get("/browsen", function(req, res) {
    res.locals.css = "<link rel=\"stylesheet\" href=\"/css/browse.css\" type=\"text/css\">";
    res.locals.browseIcon = "/icons/browseA.svg";
    res.locals.js = "<script src=\"/js/infinite-scroll.js\"></script>";

    req.getConnection(function(err, connection) {
        if (req.session.loggedin == true) { // Ingelogd gebruiker
            connection.query("SELECT * FROM users", function(err, result) {
                res.locals.users = result;

                res.render("browsen/index");
            });
        } else { // Niet ingelogd gebruiker
            connection.query("SELECT * FROM users WHERE private = 0", function(err, result) { // private = 0 zijn openabre profielen
                res.locals.users = result;

                res.render("browsen/index");
            });
        }
    });
});

app.post("/browsen", function(req, res) { // Infinite scroll
    req.getConnection(function(err, connection) {
        connection.query("SELECT * FROM users;", function(err, result) {

            res.send(result); // Stuurt result terug naar browser

        });
    });
});

app.get("/browsen/filter", function(req, res) {
    res.locals.css = "<link rel=\"stylesheet\" href=\"/css/browse.css\" type=\"text/css\">";

    var data = {
        horoscopeSun: req.query.horoscopezon,
        horoscopeMoon: req.query.horoscopemaan
    };

    if (data.horoscopeMoon == undefined) { // Verwijdert attribute als het niet bestaat
        delete data.horoscopeMoon;
    } else if (data.horoscopeSun == undefined) {
        delete data.horoscopeSun;
    }

    req.getConnection(function(err, connection) {
        connection.query("SELECT * FROM users WHERE ?", [data], function(err, result) {
            res.locals.users = result;

            res.render("browsen/index");
        });
    });
});

app.get("/browsen/:profile", function(req, res) {
    res.locals.deleteUser = req.params.profile;

    req.getConnection(function(err, connection) {
        connection.query("SELECT * FROM users WHERE ID=?", [req.params.profile], function(err, result) {
            res.locals.user = result[0];

            res.render("browsen/profiel");
        });
    });
});

app.post("/browsen/:profile", function(req, res) {
    req.getConnection(function(err, connection) {
        var data = false;
        var dataExists;

        connection.query("SELECT * FROM matches", function(err, result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i].targetID == req.session.userid && result[i].usersID == req.params.profile) { // Andere persoon heeft geliked
                    data = result[i];
                    connection.query("UPDATE matches SET ? WHERE ID=?", [{match: 1}, data.ID], function(err, result) {
                    });
                } else if (result[i].usersID == req.session.userid && result[i].targetID == req.params.profile) {
                    dataExists = true; // Gebruiker heeft deze persoon al geliked
                }
            }

            if (data.match === 0) {
                req.session.match = req.params.profile;
                res.redirect("/match"); // Redirect naar match scherm
            } else if (data == false && dataExists != true) { // Nog niet geliked
                data = {
                    usersID: req.session.userid,
                    targetID: req.params.profile
                };

                connection.query("INSERT INTO matches SET ?", [data], function(err, result) { // Creeërd nieuwe match in database
                    res.redirect("/browsen/" + req.params.profile);
                });
            } else {
                res.redirect("/browsen/" + req.params.profile);
            }

        });
    });
});

app.get("/browsen/:profile/delete", function(req, res, next) {
    if (req.session.admin == true) {
        req.getConnection(function(err, connection) {
            if(err) return next(err);

            connection.query("DELETE FROM matches WHERE (usersID=? OR targetID =?)", [req.params.profile, req.params.profile], function(err, result) {
                if(err) return next(err);
            });

            connection.query("DELETE FROM users WHERE ID=?", [req.params.profile], function(err, result) {
                if(err) return next(err);
                console.log("delete", result);
                res.redirect("/browsen/");
            });
        });
    } else {
        res.redirect("/browsen/" + req.params.profile);
    }
});

app.get("/match", function(req, res) {
    req.getConnection(function(err, connection) {
        connection.query("SELECT * FROM users WHERE ID=?", [req.session.match], function(err, result) {
            res.locals.match = result[0];

            res.render("browsen/match");
        });
    });
});

/*========================================================
    BERICHTEN
========================================================*/

app.use("/berichten/*", function(req, res, next) {
    res.locals.css = "<link rel=\"stylesheet\" href=\"/css/chat.css\" type=\"text/css\">";
    res.locals.chatIcon = "/icons/chatA.svg";

    next();
});

app.get("/berichten", function(req, res) {
    res.locals.css = "<link rel=\"stylesheet\" href=\"/css/chat.css\" type=\"text/css\">";
    res.locals.chatIcon = "/icons/chatA.svg";

    if (req.session.loggedin == true) {
        req.getConnection(function(err, connection) {
            connection.query("SELECT *, users.ID AS mainID FROM users JOIN matches ON (users.ID = matches.usersID OR users.ID = matches.targetID) WHERE (usersID=? OR targetID=?) AND (`match`=?)", [req.session.userid, req.session.userid, 1], function(err, result) { // Combineerd users met matches om lijst te tonen
                res.locals.matches = result;
                res.locals.self = req.session.userid;

                res.render("berichten/index");
            });
        });
    } else {
        res.redirect("/");
    }
});

app.get("/berichten/:match", function(req, res) {
    res.locals.js = "<script src=\"/js/chat.js\"></script>";

    if (req.session.userid == req.params.match) { // Voorkomt MySQL error als je probeerd een chat metjezelf te openen
        res.redirect("/berichten");
    } else {
        req.getConnection(function(err, connection) {
            connection.query("SELECT *, users.ID AS mainID, matches.ID as matchesID FROM users JOIN matches ON (users.ID = matches.usersID OR users.ID = matches.targetID) WHERE (usersID=? OR targetID=?) AND (usersID=? OR targetID=?) AND (`match`=?)", [req.session.userid, req.session.userid, req.params.match, req.params.match, 1], function(err, result) {
                req.session.params = req.params.match;

                if (result.length < 1) {
                    res.redirect("/berichten");
                } else {
                    for (var i = 0; i < result.length; i++) {
                        if (req.session.userid != result[i].mainID) {
                            res.locals.user = result[i];
                        }
                    }
                }

                connection.query("SELECT * FROM messages JOIN users ON (users.ID = messages.mainID) WHERE (mainID = ? OR mainID = ?) AND matchID = ?", [req.session.userid, req.session.params, result[0].matchesID], function(err, result) { // Select berichten en slaat ze op in een local: messages
                    res.locals.messages = result; // Alle berichten
                    res.locals.self = req.session.userid; // Eigen ID opslaan om te herkennen welke berichten van jouw zijn

                    res.render("berichten/chat");
                });
            });
        });
    }
});

app.post("/berichten/:match", function(req, res) {
    req.getConnection(function(err, connection) {
        connection.query("SELECT *, users.ID AS mainID, matches.ID AS matchesID FROM users JOIN matches ON (users.ID = matches.usersID OR users.ID = matches.targetID) WHERE (usersID=? OR targetID=?) AND (usersID=? OR targetID=?) AND (`match`=?)", [req.session.userid, req.session.userid, req.params.match, req.params.match, 1], function(err, result) {

            for (var i = 0; i < result.length; i++) {
                if (req.session.userid != result[i].mainID) {
                    req.session.matchID = result[i].matchesID;
                }
            }

            var data = {
                message        : req.body.message,
                mainID         : req.session.userid,
                matchID        : req.session.matchID
            };

            connection.query("UPDATE matches SET lastMsg = ? WHERE (usersID = ? OR targetID = ?)", [data.message, req.params.match, req.params.match], function(err, results) { // Laatste bericht opslaan
            });

            connection.query("INSERT INTO messages SET ?", [data], function(err, results) {
                res.redirect("/berichten/" + req.params.match);
            });
        });
    });
});


/*========================================================
    PROFIEL
========================================================*/

app.use("/profiel/*", function(req, res, next) {
    res.locals.css = "<link rel=\"stylesheet\" href=\"/css/user.css\" type=\"text/css\">";
    res.locals.userIcon = "/icons/userA.svg";

    next();
});

app.get("/profiel", function(req, res) {
    res.locals.css = "<link rel=\"stylesheet\" href=\"/css/user.css\" type=\"text/css\">";
    res.locals.userIcon = "/icons/userA.svg";

    if(req.session.loggedin == true) {
        fs.readdir("assets/uploads/", function(err, files) {
            res.locals.files = files;
        });

        req.getConnection(function(err, connection) {
            connection.query("SELECT * FROM users WHERE ID=?", req.session.userid, function(err, result) {
                res.locals.user = result[0];
                res.render("profiel/index");
            });
        });
    } else {
        res.redirect("/");
    }
});

app.post("/profiel", function(req, res) {
    if(req.file !== undefined) {
        fs.rename(req.file.path, req.file.destination + req.session.userid + path.extname(req.file.originalname), function(err) {
        });
    }
    res.redirect("/profiel");
});

app.get("/profiel/wijzigen", function(req, res) {
    fs.readdir("assets/uploads/", function(err, files) {
        res.locals.files = files;
    });

    req.getConnection(function(err, connection) {
        connection.query("SELECT * FROM users WHERE ID=?", req.session.userid, function(err, result) {
            res.locals.user = result[0];

            res.render("profiel/wijzigen");
        });
    });
});

app.post("/profiel/wijzigen", function(req, res) {
    req.getConnection(function(err, connection) {
        var data = {
            name        : req.body.name,
            sex         : req.body.sex,
            birthdate   : req.body.birthdate,
            location    : req.body.location,
            horoscopeSun: req.body.horoscopeSun,
            bio         : req.body.bio,
            tags        : req.body.tags,
            private     : req.body.private,
            email       : req.body.email,
            password    : req.body.password
        };

        if (data.password < 1) {
            delete data.password;
        }

        connection.query("UPDATE users SET ? WHERE id=?", [data, req.session.userid], function(err, results) {
            res.redirect("/profiel");
        });
    });
});

app.get("/*", function(req, res) {
    res.render("error");
});

/*========================================================
    POORT
========================================================*/

app.listen(3000, function() {
    console.log("Webserver voor Horoscope Match gestart op poort 3000");
});
