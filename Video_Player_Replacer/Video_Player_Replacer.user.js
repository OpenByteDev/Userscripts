// ==UserScript==
// @name            Video Player Replacer
// @namespace       openbyte/vidplyrrepl
// @version         0.1.0
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Replaces custom video players with the browsers builtin one.
// @homepageURL     https://github.com/OpenByteDev/Userscripts/tree/master/Video_Player_Replacer
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Video_Player_Replacer/Video_Player_Replacer.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Video_Player_Replacer/Video_Player_Replacer.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @connect         *
// @match           http*://kwik.cx/e/*
// @match           http*://openload.co/embed/*
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @run-at          document-end
// @grant           GM_addStyle
// ==/UserScript==

'use strict';


document.getElementByTagName = tagName => document.getElementsByTagName(tagName)[0] || null;

(() => {
    const video = document.getElementByTagName("video");

    if (!video)
        return;

    video.addEventListener("canplay", () => {
        video.controls = true;

        video.removeAttribute("id");
        video.removeAttribute("class");

        document.body.insertAdjacentElement("afterbegin", video);
        while (document.body.childNodes.length > 1)
            document.body.removeChild(document.body.lastChild);

        document.head.querySelectorAll("link[rel=stylesheet], style").forEach(e => e.remove());
        GM_addStyle(`body { margin: 0; padding: 0; display: flex; }`);
    });

})();
