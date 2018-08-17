// ==UserScript==
// @name            Rocket League Garage Trade Refresh
// @namespace       openbyte/rltr
// @version         4.8.0
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Adds a refresh functionality to rocket-league.com
// @homepageURL     https://github.com/OpenByteDev/Userscripts/tree/master/Rocket_League_Garage_Trade_Refresh
// @icon            https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/icon32.png
// @icon64          https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/icon64.png
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/Rocket_League_Garage_Trade_Refresh.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/Rocket_League_Garage_Trade_Refresh.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require         https://cdn.rawgit.com/OpenByteDev/Userscripts/32e48e33/Userscript_Config_API/1.0.0/Userscript_Config_API.user.js
// @require         https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require         https://cdn.jsdelivr.net/npm/amaranjs@0.5.5/dist/js/jquery.amaran.min.js
// @include         /^https?:\/\/(?:.*?\.)?rocket-league\.com\/trades?\/.*$/
// @match           *://*.rocket-league.com/trades/*
// @match           *://*.rocket-league.com/trade/*
// @connect         rocket-league.com
// @connect         cdn.jsdelivr.net
// @connect         *
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @noframes
// @run-at          document-end
// @grant           GM_addStyle
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_xmlhttpRequest
// @grant           GM.addStyle
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.deleteValue
// @grant           GM.xmlHttpRequest
// ==/UserScript==
