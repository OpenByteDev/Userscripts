// ==UserScript==
// @name            Wikipedia Donation Request Cleaner
// @namespace       openbyte/wdrc
// @version         2.0.1
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Remove wikipedia donation requests.
// @homepage        https://github.com/OpenByteDev/Userscripts/tree/master/Easy_10_Minute_Mail
// @icon            https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Wikipedia_Donation_Request_Cleaner/icon.png
// @icon64          https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Wikipedia_Donation_Request_Cleaner/icon64.png
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Wikipedia_Donation_Request_Cleaner/Wikipedia_Donation_Request_Cleaner.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Wikipedia_Donation_Request_Cleaner/Wikipedia_Donation_Request_Cleaner.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @include         http*://wikipedia.org/*
// @include         http*://*.wikipedia.org/*
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @grant           GM_addStyle
// @grant           GM.addStyle
// ==/UserScript==
/* jshint esversion: 6 */

'use strict';

GM.addStyle('html body #centralNotice, html body [id*=frbanner], html body [id*=frb-inline] { display: none !important; }');
