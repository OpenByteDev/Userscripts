// ==UserScript==
// @name            Advanced Image Viewer
// @namespace       autoimagefullsizeobp
// @author          OpenByte
// @icon            https://image.ibb.co/mNU5Vm/icon.png
// @require 	   	https://greasyfork.org/scripts/28366-userscript-config-page-api/code/Userscript%20Config%20Page%20API.js?version=225772
// @connect         google.com
// @connect         google.net
// @connect         google.co.uk
// @connect         google.de
// @connect         google.fr
// @connect         google.au
// @connect         google.us
// @connect         google.ru
// @connect         google.ch
// @connect         google.it
// @connect         google.nl
// @connect         google.se
// @connect         google.no
// @connect         google.es
// @connect         google.ar
// @connect         google.at
// @connect         google.be
// @connect         google.ba
// @connect         google.br
// @connect         google.ag
// @connect         google.ca
// @connect         google.hr
// @connect         google.cz
// @connect         google.fi
// @connect         google.gr
// @connect         google.ie
// @connect         google.hk
// @connect         google.no
// @connect         google.pt
// @connect         google.ro
// @connect         google.sm
// @connect         google.es
// @connect         google.tr
// @connect         greasyfork.org
// @connect         *
// @description     Enhances Image viewing on Open Image in new Tab. Features include: Automatic Scaling, Zoom, Display Resolution, Optimized Rendering and many more...
// @include         *
// @noframes
// @license         MIT License
// @encoding        utf-8
// @compatible      firefox
// @compatible      chrome
// @compatible      opera
// @version         9.0.1
// @run-at          document-start
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
/*jshint esversion: 6 */
//old icons -> https://paste.ee/p/BwJdD


//https://arantius.com/misc/greasemonkey/imports/greasemonkey4-polyfill.js

if (typeof GM === "undefined") {
    GM = {
        "log": console.log
    };
}

if (typeof GM_addStyle == 'undefined') {
  	var GM_addStyle = function (aCss) {
    		'use strict';
    		let head = document.getElementsByTagName('head')[0];
    		if (head) {
      			let style = document.createElement('style');
      			style.setAttribute('type', 'text/css');
      			style.textContent = aCss;
      			head.appendChild(style);
      			return style;
    		}
    		return null;
  	}
}
GM.addStyle = GM_addStyle;

Object.entries({
    'GM_deleteValue': 'deleteValue',
    'GM_getResourceURL': 'getResourceUrl',
    'GM_getValue': 'getValue',
    'GM_info': 'info',
    'GM_listValues': 'listValues',
    'GM_notification': 'notification',
    'GM_openInTab': 'openInTab',
    'GM_setClipboard': 'setClipboard',
    'GM_setValue': 'setValue',
    'GM_xmlhttpRequest': 'xmlHttpRequest',
}).forEach(([oldKey, newKey]) => {
    let old = this[oldKey];
    if (old) GM[newKey] = function() {
        new Promise((resolve, reject) => {
            try {
              	resolve(old.apply(this, arguments));
            } catch (e) {
              	reject(e);
            }
        });
    }
});

(async () => {
    'use strict';

    if (!String.prototype.isEmpty) {
        String.prototype.isEmpty = function () {
            return (this.length === 0 || !this.trim());
        };
    }
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function (searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function (searchString, position) {
            let subjectString = this.toString();
            if (typeof position !== "number" || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            let lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }
    if (!String.prototype.includes) {
        String.prototype.includes = function (search, start) {
            if (typeof start !== "number") {
                start = 0;
            }

            if (start + search.length > this.length) {
                return false;
            } else {
                return this.indexOf(search, start) !== -1;
            }
        };
    }

    let loc, w, d, de, db;

    let updateShorts = function () {
        loc = location.href.toLowerCase();
        w = window;
        d = w.document;
        de = d.documentElement;
        db = d.body || d.getElementsByTagName("body")[0];
    };

    updateShorts();
    let whenDOMContentLoaded = function (f) {
        if (d.readyState === "interactive" || d.readyState === "complete")
            f();
        else document.addEventListener("DOMContentLoaded", f, false);
    };

    let isSVGDocument = function () {
        return de.nodeName.toLowerCase() === "svg";
    };

    let redirectBack = async function () {
        await GM.deleteValue("redirected_from");
        w.history.back();
    };

    let getRealSVGUrl = function () {
        return location.href.substring(0, loc.length - 5);
    };
  

    let execute = function () {

        let DEFAULTS = {
            "MAX_SCALE": -1,
            "MIN_SCLAE": -1,
            "PADDING": 5,
            "ZOOM": 2.5,
            "AUTO_ZOOM_SCROLL": true,
            "DISPLAY_RESOLUTION": true,
            "GOOGLE_REVERSE_SEARCH_BUTTON": true,
            "GLOBAL_BACKGROUND": "rgb(30, 30, 30)",
            "IMAGE_BACKGROUND": "transparent"
        };

        if (typeof CONFIG !== "undefined") {
            CONFIG.GREASYFORK.init(27738, [
                CONFIG.generateNumberOption("MAX_SCALE", "Maximum Scale: ", DEFAULTS["MAX_SCALE"], 1),
                CONFIG.generateNumberOption("MIN_SCALE", "Minimum Scale: ", DEFAULTS["MIN_SCALE"], 1),
                CONFIG.generateNumberOption("PADDING", "Padding: ", DEFAULTS["PADDING"], 2),
                CONFIG.generateNumberOption("ZOOM", "Zoom Scale: ", DEFAULTS["ZOOM"], 3),
                CONFIG.generateCheckboxOption("AUTO_ZOOM_SCROLL", "Auto Scroll in Zoom: ", DEFAULTS["AUTO_ZOOM_SCROLL"], 3),
                CONFIG.generateCheckboxOption("DISPLAY_RESOLUTION", "Display Resolution: ", DEFAULTS["DISPLAY_RESOLUTION"], 4),
                CONFIG.generateCheckboxOption("GOOGLE_REVERSE_SEARCH_BUTTON", "Display Google Reverse Image Search Button: ", DEFAULTS["GOOGLE_REVERSE_SEARCH_BUTTON"], 5),
                CONFIG.generateTextOption("GLOBAL_BACKGROUND", "Global Background: ", DEFAULTS["GLOBAL_BACKGROUND"], 6),
                CONFIG.generateTextOption("IMAGE_BACKGROUND", "Image Background: ", DEFAULTS["IMAGE_BACKGROUND"], 6)
            ]);
        } else var CONFIG = {
            GREASYFORK: {
                isConfigPage: false
            },
            getValue: function (name) {
                return DEFAULTS[name];
            },
            getValueAsNumber: function (name) {
                return Number(DEFAULTS[name]);
            }
        };


        if (!CONFIG.GREASYFORK.isConfigPage) {
            updateShorts();

            let isImageDocument = function () {
                return db.children.length === 1 && db.children[0].tagName.toLowerCase() === "img";
            };

            if (!isImageDocument())
                return;

            const MAX_SCALE = CONFIG.getValueAsNumber("MAX_SCALE"); //-1 --> INFINITE
            const MIN_SCALE = CONFIG.getValueAsNumber("MIN_SCALE"); //-1 --> NONE
            const PADDING = CONFIG.getValueAsNumber("PADDING"); //%
            const ZOOM = CONFIG.getValueAsNumber("ZOOM"); // 0 --> DISABLED
            const AUTO_ZOOM_SCROLL = CONFIG.getValue("AUTO_ZOOM_SCROLL"); //true --> ENABLED
            const DISPLAY_RESOLUTION = CONFIG.getValue("DISPLAY_RESOLUTION"); //true --> ENABLED
            const GOOGLE_REVERSE_SEARCH_BUTTON = CONFIG.getValue("GOOGLE_REVERSE_SEARCH_BUTTON"); //true --> ENABLED
            const GLOBAL_BACKGROUND = CONFIG.getValue("GLOBAL_BACKGROUND"); //[empty string] --> UNCHANGED
            const IMAGE_BACKGROUND = CONFIG.getValue("IMAGE_BACKGROUND"); //[empty string] --> UNCHANGED

            let imgs = d.getElementsByTagName("img");
            if (imgs.length === 1)
                db.innerHTML = imgs[0].outerHTML;
            let img = d.getElementsByTagName("img")[0];
            db.innerHTML = `<div class="theContainer horizontal">
                                <figure class="theFigure">
                                    ${img.outerHTML}
                                </figure>
                            </div>`;
            let container = db.getElementsByClassName("theContainer")[0];
            let figure = container.getElementsByClassName("theFigure")[0];
            img = figure.getElementsByTagName("img")[0];
            img.classList.add("theImg");
            const size = 100 - PADDING * 2;

            GM.addStyle(`* {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        } 
                        .theContainer {
                            position: absolute;
                            cursor: initial;
                            top : 0;
                            bottom: 0;
                            right: 0;
                            left: 0;
                            margin: auto;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            align-content: center;
                        }
                        .theContainer.horizontal { 
                            width: ${size}vw; 
                            height: auto; 
                        } 
                        .theContainer.vertical { 
                            width: auto; 
                            height: ${size}vh; 
                        }
                        .theFigure {
                            margin: auto;
                        }
                        .theImg {
                            position: static;
                            top: unset;
                            bottom: unset;
                            left: unset;
                            right: unset;
                            margin: auto;
                            text-align: center;
                            width: 100%;
                            height: 100%;
                        }
                        .horizontal .theFigure, .horizontal .theImg {
                            width: 100%;
                            height: auto;
                        }
                        .vertical .theFigure, .vertical .theImg {
                            width: auto;
                            height: 100%;
                        }`);

            let whenImageLoaded = function (f) {
                if (img.complete) f();
                else img.addEventListener("load", f, false);
            };
            let whenImageError = function (f) {
                img.addEventListener("error", f, false);
            };
            let x, y;
            let updateXY = function () {
                x = w.innerWidth || de.clientWidth || db.clientWidth;
                y = w.innerHeight || de.clientHeight || db.clientHeight;
            };
            let replaceClass = function (e, oldClass, newClass) {
                e.classList.remove(oldClass);
                e.classList.add(newClass);
            };
            let replaceClass2 = function (e, bol, trueClass, falseClass) {
                if (bol)
                    replaceClass(e, falseClass, trueClass);
                else
                    replaceClass(e, trueClass, falseClass);
            };
            let update = function () {
                updateXY();
                let prop = x / y,
                    imgprop = (img.naturalWidth || img.clientWidth) / (img.naturalHeight || img.clientHeight);
                replaceClass2(container, prop < imgprop, "horizontal", "vertical");
            };
            let addGRISButton = function (href) {
                const c = "GoogleReverseImageSearch";
                if (document.getElementsByClassName(c).length !== 0)
                    return false;
                let b = document.createElement("A");
                b.className = c;
                b.href = href;
                let i = document.createElement("IMG");
                i.src = "data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgNDggNDgiPjxkZWZzPjxwYXRoIGlkPSJhIiBkPSJNNDQuNSAyMEgyNHY4LjVoMTEuOEMzNC43IDMzLjkgMzAuMSAzNyAyNCAzN2MtNy4yIDAtMTMtNS44LTEzLTEzczUuOC0xMyAxMy0xM2MzLjEgMCA1LjkgMS4xIDguMSAyLjlsNi40LTYuNEMzNC42IDQuMSAyOS42IDIgMjQgMiAxMS44IDIgMiAxMS44IDIgMjRzOS44IDIyIDIyIDIyYzExIDAgMjEtOCAyMS0yMiAwLTEuMy0uMi0yLjctLjUtNHoiLz48L2RlZnM+PGNsaXBQYXRoIGlkPSJiIj48dXNlIHhsaW5rOmhyZWY9IiNhIiBvdmVyZmxvdz0idmlzaWJsZSIvPjwvY2xpcFBhdGg+PHBhdGggY2xpcC1wYXRoPSJ1cmwoI2IpIiBmaWxsPSIjRkJCQzA1IiBkPSJNMCAzN1YxMWwxNyAxM3oiLz48cGF0aCBjbGlwLXBhdGg9InVybCgjYikiIGZpbGw9IiNFQTQzMzUiIGQ9Ik0wIDExbDE3IDEzIDctNi4xTDQ4IDE0VjBIMHoiLz48cGF0aCBjbGlwLXBhdGg9InVybCgjYikiIGZpbGw9IiMzNEE4NTMiIGQ9Ik0wIDM3bDMwLTIzIDcuOSAxTDQ4IDB2NDhIMHoiLz48cGF0aCBjbGlwLXBhdGg9InVybCgjYikiIGZpbGw9IiM0Mjg1RjQiIGQ9Ik00OCA0OEwxNyAyNGwtNC0zIDM1LTEweiIvPjwvc3ZnPg==";
                let t = document.createElement("SPAN");
                t.innerText = "More sizes";
                b.appendChild(i);
                b.appendChild(t);
                db.appendChild(b);

                let style = GM.addStyle(`.${c} { 
                                position: absolute;
                                top: 10px;
                                right: 10px;
                                text-decoration: none;
                                color: #212121;
                                background-color: #f3f3f3;
                                padding: 4px 6px;
                                border-radius: 4px;
                                box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.08);
                                font-family: Arial;
                                cursor: pointer;
                                display: flex;
                                flex-direction: row;
                                width: 125px;
                                height: 30px;
                            } 
                            .${c} img { 
                                position: static; 
                                height: 100%;
                                margin-right: 2px; 
                            } 
                            .${c} span { 
                                line-height: 22px;
                            } 
                            .${c} > * { 
                                flex-shrink: 1;
                                flex-grow: 1;
                            }`);
                console.log(style);
            };

            if (!GLOBAL_BACKGROUND.isEmpty())
                GM.addStyle(`body {
                                background: unset !important;
                                background: ${GLOBAL_BACKGROUND} !important;
                            }`);
            if (!IMAGE_BACKGROUND.isEmpty())
                GM.addStyle(`.theImg {
                                background: unset !important;
                                background: ${IMAGE_BACKGROUND} !important;
                            }`);
            if (ZOOM !== 0) {
                const scale = ZOOM;
                const scalep = scale * 100;

                GM.addStyle(`html, body {
                                overflow: hidden;
                                min-width: 100vw;
                                min-height: 100vh;
                            }
                            .theFigure {
                                will-change: transform;
                            }
                            .theImg {
                                will-change: transform;
                                cursor: -webkit-zoom-in;
                                cursor: zoom-in;
                            }
                            .zoom .theImg {
                                cursor: -webkit-zoom-out;
                                cursor: zoom-out;
                                -webkit-transform: scale(${scale});
                                -ms-transform: scale(${scale});
                                transform: scale(${scale});
                                -webkit-transform-origin: center;
                                -ms-transform-origin: center;
                                transform-origin: center;
                                transform-box: border-box;
                                -webkit-transform-style: flat;
                                transform-style: flat;
                            }`);

                let scroll = function (e) {
                    let x = (scalep - 100) * (((e.clientX - container.offsetLeft - figure.offsetLeft - img.offsetLeft) / img.clientWidth) - 0.5);
                    let y = (scalep - 100) * (((e.clientY - container.offsetTop - figure.offsetTop - img.offsetTop) / img.clientHeight) - 0.5);

                    figure.style.transform = "translate(" + -x + "%, " + -y + "%)";
                };
                img.addEventListener("click", function (e) {
                    figure.classList.toggle("zoom");
                    if (!figure.classList.contains("zoom"))
                        figure.style.transform = "none";
                    else scroll(e);
                }, false);
                if (AUTO_ZOOM_SCROLL) {
                    db.addEventListener("mousemove", function (e) {
                        if (!figure.classList.contains("zoom"))
                            return;

                        scroll(e);
                    }, false);
                }
            }
            if (DISPLAY_RESOLUTION && !loc.endsWith("svg.view")) {
                GM.addStyle(`.resolution {
                                color: #eee;
                                font: normal 0.8em Arial, sans-serif;
                                position: absolute;
                                bottom: 0;
                                right: 0;
                                padding: 5px 7px;
                            }`);
                let rd = d.createElement("DIV");
                rd.className = "resolution";
                whenImageLoaded(async function () {
                    rd.innerHTML = img.naturalWidth + " x " + img.naturalHeight;
                });
                db.appendChild(rd);
            }
            if (GOOGLE_REVERSE_SEARCH_BUTTON && !location.protocol.includes("file") && !loc.startsWith("data:image")) {
                const url = "https://www.google.com/searchbyimage?&image_url=" + loc;
                GM.xmlHttpRequest({
                    url: url,
                    method: "GET",
                    onload: function (data) {
                        let doc = new DOMParser().parseFromString(data.responseText, "text/html");
                        let e = doc.querySelector("a[href*=\"tbs=simg:CAQ\"]:not([href*=\",isz:\"])");
                        if (e !== null) {
                            let href = e.getAttribute("href");
                            if (!href.includes("google."))
                                href = "//www.google.com" + href;
                            addGRISButton(href);
                        }
                    }
                });
            }
            whenImageLoaded(function () {
                if (img.naturalWidth !== 0) {
                    if (MAX_SCALE !== -1)
                        GM.addStyle(`img { 
                                        max-width: ${img.naturalWidth * MAX_SCALE}px !important; 
                                        max-height: ${img.naturalHeight * MAX_SCALE}px !important; 
                                    }`);
                    if (MIN_SCALE !== -1)
                        GM.addStyle(`img { 
                                        min-width: ${img.naturalWidth * MIN_SCALE}px !important; 
                                        min-height: ${img.naturalHeight * MIN_SCALE}px !important; 
                                    }`);
                }
                if (Math.min(img.naturalWidth || img.clientWidth, img.naturalHeight || img.clientHeight) < 1000)
                    GM.addStyle(`img { 
                                    image-rendering: optimizeQuality;
                                    image-rendering: -moz-crisp-edges;
                                    image-rendering: -o-crisp-edges;
                                    image-rendering: -webkit-optimize-contrast;
                                    image-rendering: pixelated;
                                    image-rendering: crisp-edges;
                                    -ms-interpolation-mode: bicubic;
                                }`);
                update();
            });
            whenImageError(async function () {
                await GM.setValue("do_not_run", loc);
            });
            w.addEventListener("resize", update, true);
        }
    };


    let run = async function () {
        if (loc.endsWith(".svg.view")) {
            if (isSVGDocument()) {
                await GM.setValue("ignore_redirect", "true");
                redirectBack();
            } else {
                de.innerHTML = 	`<head>
                                 </head>
                                 <body>
                                 	<img src="${getRealSVGUrl()}" />
                                 </body>`;
                execute();
            }
        } else {
            if (isSVGDocument() && location.protocol.toLowerCase() !== "file:") {
                if (await GM.getValue("ignore_redirect") !== "true") {
                    await GM.setValue("redirected_from", loc);
                    location.href += ".view";
                } else await GM.setValue("ignore_redirect", "false");
            } else execute();
        }
    };

      console.log(GM);
    if (await GM.getValue("redirected_from") === loc)
        redirectBack();
    else if (await GM.getValue("do_not_run") !== loc)
        whenDOMContentLoaded(run);
    else await GM.deleteValue("do_not_run");

})();