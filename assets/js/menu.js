var menu = document.querySelector('.menu');
var filter = document.querySelector('.filter');

var buttonMenu = document.querySelector('.menu-button');
var buttonFilter = document.querySelector('.filter-button');

var menuFunction = function () {
    menu.classList.toggle('menu-open') //toggle
}

var filterFunction = function () {
    filter.classList.toggle('filter-open') //toggle
}

buttonMenu.addEventListener('click', menuFunction); // klik functie
buttonFilter.addEventListener('click', filterFunction);
