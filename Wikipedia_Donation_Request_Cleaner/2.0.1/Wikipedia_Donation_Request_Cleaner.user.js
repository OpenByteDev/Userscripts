// ==UserScript==
// @name            Wikipedia Donation Request Cleaner
// @namespace       openbytewdrc
// @author          OpenByte
// @description     Removes Wikipedia Donation Request.
// @icon            https://i.imgur.com/mQeok0M.png
// @require         https://greasyfork.org/scripts/34555-greasemonkey-4-polyfills/code/Greasemonkey%204%20Polyfills.js?version=227108
// @include         http*://wikipedia.org/*
// @include         http*://*.wikipedia.org/*
// @license         MIT License
// @encoding        utf-8
// @compatible      firefox
// @compatible      chrome
// @compatible      opera
// @compatible      safari
// @version         2.0.1
// @grant           GM_addStyle
// @grant           GM.addStyle
// ==/UserScript==
/* jshint esversion: 6 */


GM.addStyle("html body #centralNotice, html body [id*=frbanner], html body [id*=frb-inline] { display: none !important; }");