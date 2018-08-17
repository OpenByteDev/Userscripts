// ==UserScript==
// @name            Advanced Image Viewer
// @namespace       openbyte/advimgvwr
// @version         9.5.2
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Enhances Image viewing on Open Image in new Tab. Features include: Automatic Scaling, Zoom, Display Resolution, Optimized Rendering and many more...
// @homepageURL     https://github.com/OpenByteDev/Userscripts/tree/master/Advanced_Image_Viewer
// @icon            https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Advanced_Image_Viewer/icon32.png
// @icon64          https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Advanced_Image_Viewer/icon64.png
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Advanced_Image_Viewer/Advanced_Image_Viewer.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Advanced_Image_Viewer/Advanced_Image_Viewer.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require         https://github.com/OpenByteDev/Userscripts/raw/master/Userscript_Config_API/1.0.0/Userscript_Config_API.user.js
// @connect         google.com
// @connect         api.imgur.com
// @connect         *
// @include         *
// @noframes
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
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

'use strict';

(async () => {

    if (!String.prototype.isEmpty) {
        String.prototype.isEmpty = function() {
            return (this.length === 0 || !this.trim());
        };
    }
    if (!String.prototype.startsWith) {
        String.prototype.startsWith = function(searchString, position) {
            position = position || 0;
            return this.indexOf(searchString, position) === position;
        };
    }
    if (!String.prototype.endsWith) {
        String.prototype.endsWith = function(searchString, position) {
            const subjectString = this.toString();
            if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                position = subjectString.length;
            }
            position -= searchString.length;
            const lastIndex = subjectString.indexOf(searchString, position);
            return lastIndex !== -1 && lastIndex === position;
        };
    }
    if (!String.prototype.includes) {
        String.prototype.includes = function(search, start) {
            if (typeof start !== 'number') {
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

    const updateShorts = () => {
        loc = location.href.toLowerCase();
        w = window;
        d = w.document;
        de = d.documentElement;
        db = d.body || d.getElementsByTagName('body')[0];
    };

    updateShorts();
    const whenDOMContentLoaded = f => {
        if (d.readyState === 'interactive' || d.readyState === 'complete')
            f();
        else document.addEventListener('DOMContentLoaded', f, false);
    };

    const isSVGDocument = () => false; //de.nodeName.toLowerCase() === "svg";

    const redirectBack = async () => {
        await GM.deleteValue('redirected_from');
        w.history.back();
    };

    const getRealSVGUrl = () =>
        location.href.substring(0, loc.length - 5);


    const execute = async () => {

        const config = new Config({
            id: 'AIVConfig',
            title: 'Advanced Image Viewer Config',
            fields: {
                'MAX_SCALE': {
                    label: 'Maximum Scale: ',
                    type: 'number',
                    default: -1
                },
                'MIN_SCALE': {
                    label: 'Minimum Scale: ',
                    type: 'number',
                    default: -1
                },
                'PADDING': {
                    label: 'Padding: ',
                    type: 'number',
                    default: 5
                },
                'ZOOM': {
                    label: 'Zoom Scale: ',
                    type: 'number',
                    default: 2.5
                },
                'AUTO_ZOOM_SCROLL': {
                    label: 'Auto Scroll in Zoom: ',
                    type: 'checkbox',
                    default: true
                },
                'DISPLAY_RESOLUTION': {
                    label: 'Display Resolution: ',
                    type: 'checkbox',
                    default: true
                },
                'DISPLAY_MENU': {
                    label: 'Display Menu: ',
                    type: 'checkbox',
                    default: true
                },
                'PRELOAD_GOOGLE_REVERSE_SEARCH_LINK': {
                    label: 'Preload Google Reverse Image Search Link: ',
                    type: 'checkbox',
                    default: false
                },
                'GLOBAL_BACKGROUND': {
                    label: 'Global Background: ',
                    type: 'text',
                    default: 'rgb(30, 30, 30)'
                },
                'IMAGE_BACKGROUND': {
                    label: 'Image Background: ',
                    type: 'text',
                    default: 'transparent'
                }
            }
        });

        await config.loadValues();

        updateShorts();

        const isImageDocument = () =>
            db.children.length === 1 && db.children[0].tagName.toLowerCase() === 'img';

        if (!isImageDocument())
            return;

        const MAX_SCALE = await config.getValue('MAX_SCALE'); //-1 --> INFINITE
        const MIN_SCALE = await config.getValue('MIN_SCALE'); //-1 --> NONE
        const PADDING = await config.getValue('PADDING'); //%
        const ZOOM = await config.getValue('ZOOM'); // 0 --> DISABLED
        const AUTO_ZOOM_SCROLL = await config.getValue('AUTO_ZOOM_SCROLL'); //true --> ENABLED
        const DISPLAY_RESOLUTION = await config.getValue('DISPLAY_RESOLUTION'); //true --> ENABLED
        const DISPLAY_MENU = await config.getValue('DISPLAY_MENU'); //true --> ENABLED
        const PRELOAD_GOOGLE_REVERSE_SEARCH_LINK = await config.getValue('PRELOAD_GOOGLE_REVERSE_SEARCH_LINK'); //true --> ENABLED
        const GLOBAL_BACKGROUND = await config.getValue('GLOBAL_BACKGROUND'); //[empty string] --> UNCHANGED
        const IMAGE_BACKGROUND = await config.getValue('IMAGE_BACKGROUND'); //[empty string] --> UNCHANGED


        const img = d.getElementsByTagName('img')[0];
        const container = d.createElement('div');
        container.classList.add('theContainer', 'horizontal');
        db.appendChild(container);
        const figure = d.createElement('figure');
        figure.classList.add('theFigure');
        container.appendChild(figure);
        figure.appendChild(img);
        img.classList.add('theImg');
        const size = 100 - PADDING * 2;

        GM.addStyle(`* {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        } 
												html, body {
                        		font-family: Arial;
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
														image-orientation: from-image;
                        }
                        .horizontal .theFigure, .horizontal .theImg {
                            width: 100%;
                            height: auto;
                        }
                        .vertical .theFigure, .vertical .theImg {
                            width: auto;
                            height: 100%;
                        }`);


        const whenImageLoaded = f => {
            if (img.complete) f();
            else img.addEventListener('load', f, false);
        };
        const whenImageError = f => img.addEventListener('error', f, false);
        let x, y;
        const updateXY = () => {
            x = w.innerWidth || de.clientWidth || db.clientWidth;
            y = w.innerHeight || de.clientHeight || db.clientHeight;
        };
        const replaceClass = (e, oldClass, newClass) => {
            e.classList.remove(oldClass);
            e.classList.add(newClass);
        };
        const replaceClass2 = (e, bol, trueClass, falseClass) => {
            if (bol)
                replaceClass(e, falseClass, trueClass);
            else
                replaceClass(e, trueClass, falseClass);
        };
        const update = () => {
            updateXY();
            const prop = x / y,
                imgprop = (img.naturalWidth || img.clientWidth) / (img.naturalHeight || img.clientHeight);
            replaceClass2(container, prop < imgprop, 'horizontal', 'vertical');
        };
        if (DISPLAY_MENU) {
            const addMenu = async () => {
                const startLoading = () => db.classList.add('loading');
                const stopLoading = () => db.classList.remove('loading');
                const createMenuItem = (label, action, icon) => {
                    const item = d.createElement('li');
                    item.classList.add('menu-item');
                    if (typeof icon === 'string') {
                        const img = d.createElement('img');
                        img.classList.add('menu-item-icon');
                        img.setAttribute('src', icon);
                        item.appendChild(img);
                    }
                    let labelc;
                    const actype = typeof action;
                    if (actype === 'string') {
                        labelc = d.createElement('a');
                        labelc.setAttribute('href', action);
                    } else {
                        labelc = d.createElement('span');
                        if (actype === 'function')
                            item.addEventListener('click', action, false);
                    }
                    labelc.classList.add('menu-item-label');
                    const labelt = d.createTextNode(label);
                    labelc.appendChild(labelt);
                    item.appendChild(labelc);
                    return item;
                };

                const menu = d.createElement('section');
                menu.classList.add('menu', 'collapsed');
                const menutrigger = d.createElement('img');
                menutrigger.classList.add('menu-trigger');
                menutrigger.setAttribute('src', 'data:image/svg+xml;charset=utf-8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE2LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgd2lkdGg9IjYxMnB4IiBoZWlnaHQ9IjYxMnB4IiB2aWV3Qm94PSIwIDAgNjEyIDYxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjEyIDYxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGcgaWQ9Im1lbnUiPg0KCQk8Zz4NCgkJCTxwYXRoIGQ9Ik0wLDk1LjYyNXYzOC4yNWg2MTJ2LTM4LjI1SDB6IE0wLDMyNS4xMjVoNjEydi0zOC4yNUgwVjMyNS4xMjV6IE0wLDUxNi4zNzVoNjEydi0zOC4yNUgwVjUxNi4zNzV6Ii8+DQoJCTwvZz4NCgk8L2c+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4=');
                menutrigger.addEventListener('click', () => menu.classList.toggle('collapsed'), false);
                menu.appendChild(menutrigger);
                const menuitemlist = d.createElement('ul');
                menuitemlist.classList.add('menu-item-list');
                if (!location.protocol.includes('file') && !loc.startsWith('data:image')) {
                    const url = 'https://www.google.com/searchbyimage?&image_url=' + location.href;
                    const getGRISUrl = async () =>
                        new Promise((resolve, reject) =>
                            GM.xmlHttpRequest({
                                url: url,
                                method: 'GET',
                                onload: data => {
                                    const doc = new DOMParser().parseFromString(data.responseText, 'text/html');
                                    const e = doc.querySelector('a[href*="tbs=simg:CAQ"]:not([href*=",isz:"])');
                                    if (e === null)
                                        resolve(url);
                                    let href = e.getAttribute('href');
                                    if (!href.includes('google.'))
                                        href = '//www.google.com' + href;
                                    resolve(href);
                                },
                                onerror: reject
                            }));

                    if (PRELOAD_GOOGLE_REVERSE_SEARCH_LINK) {
                        const href = await getGRISUrl();
                        menuitemlist.appendChild(createMenuItem('Google Reverse Image Search', href));
                    } else {
                        menuitemlist.appendChild(createMenuItem('Google Reverse Image Search', async () => {
                            startLoading();
                            const href = await getGRISUrl();
                            stopLoading();
                            location.href = href;
                        }));
                    }
                }
                if (!isSVGDocument() && !loc.endsWith('svg.view')) {
                    menuitemlist.appendChild(createMenuItem('Upload to Imgur', () => {
                        startLoading();
                        GM.xmlHttpRequest({
                            url: 'https://api.imgur.com/3/image',
                            method: 'POST',
                            headers: {
                                'Authorization': 'Client-ID 6660e28e848ee74',
                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                            },
                            data: '&image=' + location.href,
                            onload: data => {
                                const response = JSON.parse(data.responseText);
                                stopLoading();
                                alert(response.data.link);
                            }
                        });
                    }, false));
                }
                menuitemlist.appendChild(createMenuItem('Open Settings', 'https://greasyfork.org/de/scripts/27738-advanced-image-viewer/config'));
                menu.appendChild(menuitemlist);
                db.appendChild(menu);

                GM.addStyle(`.menu {
                                    position: absolute;
                                    top: 0;
                                    right: 0;
                                    left: unset;
                                    bottom: unset;
                                    display: flex;
                                    flex-direction: column;
                                    background-color: #fafafa;
                                    color: #000;
                                }
                                .menu-trigger {
                                    position: static;
                                    padding: 10px;
                                    margin: 0 0 0 auto;
                                    width: 50px;
                                    height: 50px;
                                }
                                .menu-item-list {
                                    list-style-type: none;
                                    padding-bottom: 10px;
                                }
                                .menu-item {
                                    margin: 20px 25px;
                                    text-align: center;
                                }
                                .menu-item-label {
                                    text-decoration: none;
                                    color: inherit;
                                }
                                .menu-item-icon {
                                    position: static;
                                    height: 100%;
                                    width: auto;
                                    margin-right: 15px;
                                }
                                .menu-trigger, .menu-item {
                                    cursor: pointer;
                                }
                                .menu.collapsed .menu-item-list {
                                    display: none;
                                }
                                .loading, .loading * {
                                    cursor: progress;
                                }`);
            };
            await addMenu();
        }

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

            const scroll = e => {
                const x = (scalep - 100) * (((e.clientX - container.offsetLeft - figure.offsetLeft - img.offsetLeft) / img.clientWidth) - 0.5);
                const y = (scalep - 100) * (((e.clientY - container.offsetTop - figure.offsetTop - img.offsetTop) / img.clientHeight) - 0.5);

                figure.style.transform = 'translate(' + -x + '%, ' + -y + '%)';
            };
            img.addEventListener('click', e => {
                figure.classList.toggle('zoom');
                if (!figure.classList.contains('zoom'))
                    figure.style.transform = 'none';
                else scroll(e);
            }, false);
            if (AUTO_ZOOM_SCROLL) {
                db.addEventListener('mousemove', e => {
                    if (!figure.classList.contains('zoom'))
                        return;

                    scroll(e);
                }, false);
            }
        }
        if (DISPLAY_RESOLUTION && !loc.endsWith('svg.view')) {
            GM.addStyle(`.resolution {
                                color: #eee;
                                font: normal 0.8em Arial, sans-serif;
                                position: absolute;
                                bottom: 0;
                                right: 0;
                                padding: 5px 7px;
                            }`);
            const rd = d.createElement('DIV');
            rd.className = 'resolution';
            whenImageLoaded(async () => rd.innerHTML = img.naturalWidth + ' x ' + img.naturalHeight);
            db.appendChild(rd);
        }
        whenImageLoaded(() => {
            if (img.naturalWidth !== 0) {
                if (MAX_SCALE !== -1)
                    GM.addStyle(`.theImg { 
                                        max-width: ${img.naturalWidth * MAX_SCALE}px !important; 
                                        max-height: ${img.naturalHeight * MAX_SCALE}px !important; 
                                    }`);
                if (MIN_SCALE !== -1)
                    GM.addStyle(`.theImg { 
                                        min-width: ${img.naturalWidth * MIN_SCALE}px !important; 
                                        min-height: ${img.naturalHeight * MIN_SCALE}px !important; 
                                    }`);
            }
            if (Math.min(img.naturalWidth || img.clientWidth, img.naturalHeight || img.clientHeight) < 1000)
                GM.addStyle(`.theImg { 
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
        whenImageError(async () => {
            await GM.setValue('do_not_run', loc);
        });
        w.addEventListener('resize', update, true);
    };


    const run = async () => {
        if (loc.endsWith('.svg.view')) {
            if (isSVGDocument() || de.tagName === 'Error') {
                await GM.setValue('ignore_redirect', 'true');
                await redirectBack();
            } else {
                de.innerHTML = `<head>
                                </head>
                                <body>
                                		<img src="${getRealSVGUrl()}" />
                                </body>`;
                await execute();
            }
        } else {
            if (isSVGDocument() && location.protocol.toLowerCase() !== 'file:') {
                if (await GM.getValue('ignore_redirect') !== 'true') {
                    await GM.setValue('redirected_from', loc);
                    location.href += '.view';
                } else await GM.setValue('ignore_redirect', 'false');
            } else await execute();
        }
    };


    if (await GM.getValue('redirected_from') === loc)
        await redirectBack();
    else if (await GM.getValue('do_not_run') !== loc)
        whenDOMContentLoaded(run);
    else await GM.deleteValue('do_not_run');

})();
