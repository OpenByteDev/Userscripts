// ==UserScript==
// @name            Always Show Resolution On GoogleImageSearch
// @namespace       openbyte/asragi
// @author          OpenByte
// @icon            https://image.ibb.co/bBeDwR/1348cb32_3a6b_4f1c_babf_0aeed1e91e63.png
// @description     Always shows image resolution on Google Image Search.
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @include         http*://*.google.*/*tbm=isch
// @include         http*://google.*/*tbm=isch
// @include         http*://*.google.*/*tbm=isch&*
// @include         http*://google.*/*tbm=isch&*
// @license         MIT License
// @encoding        utf-8
// @compatible      firefox
// @compatible      chrome
// @compatible      opera
// @compatible      safari
// @version         2.0.3
// @run-at          document-start
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.deleteValue
// ==/UserScript==
/*jshint esversion: 6 */


"use strict";


(async () => {

    RegExp.quote = function(str) {
        return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
    };

    function extractNumbers(str, dots) {
        return str.split(
            new RegExp("[^\\d" + RegExp.quote(typeof dots !== "string" || dots.length === 0 ? "." : dots) + "]+")
        )
            .map(function (e) {
                return parseFloat(e);
            })
            .filter(function (e) {
                return !isNaN(e);
            });
    }

    function max() {
        return arguments.length === 0 ? undefined : Math.max.apply(this, Array.isArray(arguments[0]) ? arguments[0] : Array.from(arguments));
    }


    const paramname = "tbs";
    const param = "&tbs=imgo:1";
    const id = "redirected_from";


    if (await GM.getValue(id) === location.href) {
        GM.deleteValue(id);
        window.history.back();
    } else if (location.href.match("(\\?|\\&)" + paramname + "=")) {
        if (location.href.includes(param)) {
            const menu = "#hdtbMenus";
            document.addEventListener("DOMContentLoaded", function () {
                const menu = document.getElementById("hdtbMenus");
                menu.style = "display: none;";
                menu.className = "hdtb-td-c";
                const style = window.getComputedStyle(menu);
                const timeout = (max(extractNumbers(style.getPropertyValue("transition-delay"))) || 0) + (max(extractNumbers(style.getPropertyValue("transition-duration"))) || 0);
                setTimeout(function () {
                    menu.style = "";
                }, timeout * 1000);
            }, false);
        }
    } else {
        await GM.setValue(id, location.href);
        const index = location.href.indexOf("tbm=isch")+8;
        location.href = location.href.substring(0, index) + param + location.href.substring(index);
    }
})();
