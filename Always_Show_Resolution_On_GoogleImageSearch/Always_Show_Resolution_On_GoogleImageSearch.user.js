// ==UserScript==
// @name            Always Show Resolution On GoogleImageSearch
// @namespace       openbyte/asragi
// @author          OpenByte
// @icon            https://image.ibb.co/bBeDwR/1348cb32_3a6b_4f1c_babf_0aeed1e91e63.png
// @description     Always shows image resolution on Google Image Search.
// @require         https://greasyfork.org/scripts/28184-string-prototype-includes-polyfill/code/Stringprototypeincludes%20Polyfill.js?version=181415
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
// @version         1.4.0
// @run-at          document-start
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// ==/UserScript==


var paramname = "tbs";
var param = "&tbs=imgo:1";
var id = "redirected_from";

if (GM_getValue(id) === location.href) {
    GM_deleteValue(id);
    window.history.back();
} else if (location.href.match("(\\?|\\&)" + paramname + "=")) {
    if (location.href.includes(param)) {
        var menu = "#hdtbMenus";
        document.addEventListener("DOMContentLoaded", function () {
            var menu = document.getElementById("hdtbMenus");
            menu.style = "display: none;";
            menu.className = "hdtb-td-c";
            var style = window.getComputedStyle(menu);
            var timeout = (max(extractNumbers(style.getPropertyValue("transition-delay"))) || 0) + (max(extractNumbers(style.getPropertyValue("transition-duration"))) || 0);
            setTimeout(function () {
                menu.style = "";
            }, timeout * 1000);
        }, false);
    }
} else {
    GM_setValue(id, location.href);
    var index = location.href.indexOf("tbm=isch")+8;
    location.href = location.href.substring(0, index) + param + location.href.substring(index);
}

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