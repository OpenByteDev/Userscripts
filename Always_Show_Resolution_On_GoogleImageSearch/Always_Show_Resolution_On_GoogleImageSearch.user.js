// ==UserScript==
// @name            Always Show Resolution On GoogleImageSearch
// @namespace       openbyte/asragi
// @version         2.0.3
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Always shows image resolution on Google Image Search.
// @homepageURL     https://github.com/OpenByteDev/Userscripts/tree/master/Always_Show_Resolution_On_GoogleImageSearch
// @icon            https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Always_Show_Resolution_On_GoogleImageSearch/icon32.png
// @icon64          https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Always_Show_Resolution_On_GoogleImageSearch/icon64.png
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Always_Show_Resolution_On_GoogleImageSearch/Always_Show_Resolution_On_GoogleImageSearch.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Always_Show_Resolution_On_GoogleImageSearch/Always_Show_Resolution_On_GoogleImageSearch.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @include         /^https?:\/\/(?:.*?\.)?google.[a-z]+\/.*?[?&]tbm=isch(?:&.*)?$/
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @run-at          document-start
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM.setValue
// @grant           GM.getValue
// @grant           GM.deleteValue
// ==/UserScript==

'use strict';

(async () => {

    RegExp.quote = str =>
        (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');

    function extractNumbers(str, dots) {
        return str.split(
            new RegExp('[^\\d' + RegExp.quote(typeof dots !== 'string' || dots.length === 0 ? '.' : dots) + ']+')
        ).map(parseFloat).filter(e => !isNaN(e));
    }

    function max() {
        return arguments.length === 0 ? undefined : Math.max.apply(this, Array.isArray(arguments[0]) ? arguments[0] : Array.from(arguments));
    }

    const paramname = 'tbs';
    const param = '&tbs=imgo:1';
    const id = 'redirected_from';

    if (await GM.getValue(id) === location.href) {
        await GM.deleteValue(id);
        window.history.back();
    } else if (location.href.match('(\\?|\\&)' + paramname + '=')) {
        if (location.href.includes(param)) {
            document.addEventListener('DOMContentLoaded', () => {
                const menu = document.getElementById('hdtbMenus');
                menu.style = 'display: none;';
                menu.className = 'hdtb-td-c';
                const style = window.getComputedStyle(menu);
                const timeout = (max(extractNumbers(style.getPropertyValue('transition-delay'))) || 0) + (max(extractNumbers(style.getPropertyValue('transition-duration'))) || 0);
                setTimeout(() => menu.style = '', timeout * 1000);
            }, false);
        }
    } else {
        await GM.setValue(id, location.href);
        const index = location.href.indexOf('tbm=isch')+8;
        location.href = location.href.substring(0, index) + param + location.href.substring(index);
    }
})();
