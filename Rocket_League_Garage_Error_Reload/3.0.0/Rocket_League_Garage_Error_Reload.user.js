// ==UserScript==
// @name            Rocket League Garage Error Reload
// @namespace       openbyte/aerl
// @author          OpenByte
// @description     Refreshes the page when an Error occurs.
// @icon            https://image.ibb.co/g9caQm/rocket_league_garage_footer.png
// @include         http*://rocket-league.com/*
// @include         http*://*.rocket-league.com/*
// @license         MIT License
// @encoding        utf-8
// @compatible      firefox
// @compatible      chrome
// @compatible      opera
// @version         3.0.0
// @grant           none
// ==/UserScript==


if (document.querySelector(".rlg-error, #cf-error-details") !== null)
    location.reload();