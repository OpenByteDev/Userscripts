// ==UserScript==
// @name	        Wikipedia Donation Request Cleaner
// @author          OpenByte
// @description	    Removes Wikipedia Donation Request.
// @icon            https://i.imgur.com/mQeok0M.png
// @namespace	    openbytewdrc
// @include	        http*://wikipedia.org/*
// @include	        http*://*.wikipedia.org/*
// @version	        1.0
// @license         MIT License
// @encoding        utf-8
// @compatible      firefox
// @compatible      chrome
// @compatible      opera
// @compatible      safari
// @grant           GM_addStyle
// ==/UserScript==

GM_addStyle("html body #centralNotice, [id*=frbanner] { display: none !important; }");