// ==UserScript==
// @name            Animepahe Auto Select Max Quality
// @namespace       openbyte/apasmq
// @version         0.1.0
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Automatically selects the highest quality stream on animepahe.com
// @homepageURL     https://github.com/OpenByteDev/Userscripts/tree/master/Animepahe_Auto_Select_Max_Quality
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Animepahe_Auto_Select_Max_Quality/Animepahe_Auto_Select_Max_Quality.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Animepahe_Auto_Select_Max_Quality/Animepahe_Auto_Select_Max_Quality.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @connect         *
// @match           http*://animepahe.com/play/*
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @run-at          document-end
// @grant           none
// ==/UserScript==


'use strict';

Array.prototype.minBy = function (fn) {
    return this.extremumBy(fn, Math.min);
};

Array.prototype.maxBy = function (fn) {
    return this.extremumBy(fn, Math.max);
};

Array.prototype.extremumBy = function (mapping, comparator) {
    if (this.length == 0)
        return null;

    let extremum = this[0];
    let extremumValue = mapping(extremum);
    for (let i = 1; i < this.length; i++) {
        const current = this[i];
        const currentValue = mapping(this[i]);
        if (comparator(currentValue, extremumValue)) {
            extremum = current;
            extremumValue = currentValue;
        }
    }
    return extremum;
};

(() => {
    const menu = document.getElementById("resolutionMenu");
    const handler = changes => {
        const options = Array.from(menu.getElementsByClassName("dropdown-item"));
        const maxQualityOption = options.maxBy(e => {
            const resolution = e.dataset.resolution;
            return Number.parseInt(resolution.substring(0, resolution.length - 1));
        });
        if (maxQualityOption != null)
            maxQualityOption.click();
    };
    const observer = new MutationObserver(handler);
    observer.observe(menu, {
        childList: true
    });
})();
