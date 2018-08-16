// ==UserScript==
// @name            Userscript Config API
// @namespace       openbyte/usconfig
// @author          OpenByte
// @require         https://greasyfork.org/scripts/34555-greasemonkey-4-polyfills/code/Greasemonkey%204%20Polyfills.js?version=227108
// @description     API for implementing Config Pages for Userscripts.
// @license         MIT License
// @encoding        utf-8
// @version         0.4.1
// @run-at          document-start
// @grant           GM_addStyle
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM.addStyle
// @grant           GM.setValue
// @grant           GM.getValue
// ==/UserScript==
/*jshint esversion: 6 */



if (!Node.prototype.remove)
    Node.prototype.remove = function () {
        if (this.parentNode)
            this.parentNode.removeChild(this);
    };

function Config(config) {
    const self = this;


    let _getOrDefault = function (val, def) {
        return typeof val === "undefined" || val === null ? def : val;
    };

    let _getFormFieldValue = function (id) {
        switch (self.fields[id].type) {
            case "checkbox":
                return self.DOM.fields[id + "_input"].checked;
            case "number":
                return Number(self.DOM.fields[id + "_input"].value);
            default:
                return self.DOM.fields[id + "_input"].value;
        }
    };

    let _getDefaultFromType = function (type) {
        switch (type) {
            case "number":
            case "range":
                return 0;
            case "checkbox":
                return false;
            default:
                return "";
        }
    };

    let _addStyle, _getValue, _setValue;
    if (typeof GM !== "undefined") {
        _addStyle = GM.addStyle;
        _getValue = GM.getValue;
        _setValue = GM.setValue;
    } else {
        _addStyle = (css) => Promise.resolve(GM_addStyle(css));
        _getValue = (name) => Promise.resolve(GM_getValue(name));
        _setValue = (name, value) => Promise.resolve(GM_setValue(name, value));
    }

    let _getValue2 = async (name) => {
        let val = await _getValue(name);
        if (!self.fields.hasOwnProperty(name))
            return val;
        if (typeof val === "undefined")
            val = self.fields[name].default;
        if (self.fields[name].type === "number")
            return Number(val);
        return val;
    };


    self.version = "0.4.1";
    self.inputConfig = config;
    self.config = {
        id: _getOrDefault(config.id, "config"),
        title: _getOrDefault(config.title, "Script Config"),
        stylePrefix: _getOrDefault(config.stylePrefix, "config-")
    };
    self.config.css = `
        body.config-dialog-visible {
            overflow: hidden;
        }
        .${self.config.stylePrefix}shade {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.6);
        }
        .${self.config.stylePrefix}dialog {
            margin: auto;
            background-color: white;
        }
        .${self.config.stylePrefix}dialog * {
            font-family: Arial, sans-serif;
            font-style: normal;
            text-transform: initial;
        }
        .${self.config.stylePrefix}root {
            background-color: white;
            color: black;
            box-sizing: border-box;
        }
        .${self.config.stylePrefix}header {
            position: relative;
            background-color: #333;
            padding: 35px 45px;
        }
        .${self.config.stylePrefix}header * {
            color: white;
        }
        .${self.config.stylePrefix}title {
            text-align: center;
            font-size: 35px;
            line-height: 40px;
            font-family: 'Roboto', 'Open-Sans', Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .${self.config.stylePrefix}close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
        }
        .${self.config.stylePrefix}content {
            height: 100%;
            padding: 25px 35px;
        }
        .${self.config.stylePrefix}dialog .${self.config.stylePrefix}content {
            display: flex;
            flex-direction: column;
        }
        .${self.config.stylePrefix}options, .${self.config.stylePrefix}save {
            margin: auto;
        }
        .${self.config.stylePrefix}field {
            margin-bottom: 10px;
        }
        .${self.config.stylePrefix}label {
            margin-right: 10px;
        }
        .${self.config.stylePrefix}field input[type=number] {
            width: 100px;
        }
        .${self.config.stylePrefix}save {
            margin-top: 25px;
            padding: 10px 35px;
            background-color: #333;
            color: white;
            border: 2px solid transparent;
            font-weight: bold;
        }
        .${self.config.stylePrefix}save:hover {
            outline: none !important;
            background-color: #222;
        }
        .${self.config.stylePrefix}save:active {
            background-color: white;
            color: #333;
            border-color: #333;
        }
        .${self.config.stylePrefix}save, .${self.config.stylePrefix}close {
            cursor: pointer;
        }
    ` + _getOrDefault(config.css, "");

    self.config.fields = {};
    if (config.fields) {
        for (let id in config.fields) {
            if (!config.fields.hasOwnProperty(id))
                continue;
            let f = config.fields[id];
            self.config.fields[id] = {
                label: typeof f.label !== "undefined" ? f.label : id + ": ",
                type: typeof f.type !== "undefined" ? f.type.toLowerCase() : "text",
                attributes: f.attributes || {}
            };
            self.config.fields[id].default = typeof f.default !== "undefined" ? f.default : _getDefaultFromType(self.config.fields[id].type);
            if (f.type === "radio" || f.type === "select")
                self.config.fields[id].values = {};
        }
    }
    self.fields = self.config.fields;


    self.valuesLoaded = false;
    self.isOpen = false;
    self.DOMGenerated = false;
    self.styleAdded = false;



    self.onsave = async function () {
        await self.saveForm();
        alert("Config saved");
    };
    self.onclose = function () {
        self.close();
    };


    self.generateDOM = async function () {
        if (!self.valuesLoaded)
            await self.loadValues();
        self.DOM = {
            root: document.createElement("section"),
            title: document.createElement("h1"),
            content: document.createElement("div"),
            options: document.createElement("div"),
            save: document.createElement("button"),
            close: document.createElement("img"),
            header: document.createElement("header"),
            fields: {}
        };
        self.DOM.root.classList.add(self.config.stylePrefix + "root");
        self.DOM.header.classList.add(self.config.stylePrefix + "header");
        self.DOM.title.classList.add(self.config.stylePrefix + "title");
        self.DOM.title.innerText = self.config.title;
        self.DOM.content.classList.add(self.config.stylePrefix + "content");
        self.DOM.options.classList.add(self.config.stylePrefix + "options");
        self.DOM.save.classList.add(self.config.stylePrefix + "save");
        self.DOM.save.innerText = "Save";
        self.DOM.save.addEventListener("click", function (e) {
            self.onsave(e);
        }, false);
        self.DOM.root.appendChild(self.DOM.header);
        self.DOM.header.appendChild(self.DOM.title);
        self.DOM.header.appendChild(self.DOM.close);
        self.DOM.root.appendChild(self.DOM.content);
        self.DOM.content.appendChild(self.DOM.options);
        self.DOM.content.appendChild(self.DOM.save);

        for (let id in self.fields) {
            if (!self.fields.hasOwnProperty(id))
                continue;
            let f = self.fields[id];
            let field = document.createElement("div");
            field.classList.add(self.config.stylePrefix + "field");
            let input = document.createElement("input");
            input.classList.add(self.config.stylePrefix + "input");
            input.setAttribute("type", f.type);
            switch (f.type) {
                case "checkbox":
                    if (f.value)
                        input.setAttribute("checked", "checked");
                    break;
                default:
                    input.setAttribute("value", f.value);
            }
            for (let attr in f.attributes)
                if (f.attributes.hasOwnProperty(attr))
                    input.setAttribute(attr, f.attributes[attr]);
            input.setAttribute("id", self.config.stylePrefix + id);
            let label = document.createElement("label");
            label.classList.add(self.config.stylePrefix + "label");
            label.setAttribute("for", self.config.stylePrefix + id);
            let text = document.createTextNode(f.label);
            label.appendChild(text);
            field.appendChild(label);
            field.appendChild(input);
            self.DOM.fields[id + "_input"] = input;
            self.DOM.fields[id + "_label"] = label;
            self.DOM.fields[id] = field;
            self.DOM.options.appendChild(field);
        }
        self.DOMGenerated = true;
        return self.DOM;
    };

    self.loadValues = async function () {
        for (let id in self.fields)
            if (self.fields.hasOwnProperty(id))
                self.fields[id].value = await _getValue2(id);
        self.valuesLoaded = true;
    };

    self.getValue = async function (name, direct = false) {
        if (direct)
            return await _getValue(name);
        if (self.fields.hasOwnProperty(name) && self.fields[name].hasOwnProperty("value"))
            return Promise.resolve(self.fields[name].value);
        else {
            let val = await _getValue2(name);
            self.fields[name].value = val;
            return val;
        }
    };

    self.setValue = async function (name, value) {
        if (self.fields[name])
            self.fields[name].value = value;
        await _setValue(name, value);
    };

    self.addStyle = function (force = false) {
        if (!force && self.styleAdded)
            return false;
        self.styleAdded = true;
        return _addStyle(self.config.css);
    };

    let _close = function () {};

    self.close = function () {
        if (!self.isOpen)
            return false;
        return _close();
    };

    let _attachHelper = async function (source, target, addStyle, defineClose, closer) {
        if (defineClose)
            _close = function () {
                source.remove();
                if (closer)
                    closer();
            };
        if (addStyle)
            self.addStyle();
        self.isOpen = true;
        return target.appendChild(source);
    };

    self.attachTo = async function (node = document.body, includeHeader = true, addStyle = true, defineClose = true) {
        if (!self.DOMGenerated)
            await self.generateDOM();
        if (!includeHeader)
            self.DOM.header.style.display = "none";
        return await _attachHelper(self.DOM.root, node, addStyle, defineClose, null);
    };

    self.showDialog = async function (addStyle = true, defineClose = true) {
        if (!self.DOMGenerated)
            await self.generateDOM();
        let shade = document.createElement("div");
        let ret = await _attachHelper(shade, document.body, addStyle, defineClose, function () {
            document.body.classList.remove("config-dialog-visible");
            delete self.DOM.shade;
            delete self.DOM.dialog;
        });
        document.body.classList.add("config-dialog-visible");
        self.DOM.close.classList.add(self.config.stylePrefix + "close");
        self.DOM.close.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRw%0D%0AOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyMS45%0D%0AIDIxLjkiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDIxLjkgMjEuOSIgd2lkdGg9IjUxMnB4%0D%0AIiBoZWlnaHQ9IjUxMnB4Ij4KICA8cGF0aCBkPSJNMTQuMSwxMS4zYy0wLjItMC4yLTAuMi0wLjUs%0D%0AMC0wLjdsNy41LTcuNWMwLjItMC4yLDAuMy0wLjUsMC4zLTAuN3MtMC4xLTAuNS0wLjMtMC43bC0x%0D%0ALjQtMS40QzIwLDAuMSwxOS43LDAsMTkuNSwwICBjLTAuMywwLTAuNSwwLjEtMC43LDAuM2wtNy41%0D%0ALDcuNWMtMC4yLDAuMi0wLjUsMC4yLTAuNywwTDMuMSwwLjNDMi45LDAuMSwyLjYsMCwyLjQsMFMx%0D%0ALjksMC4xLDEuNywwLjNMMC4zLDEuN0MwLjEsMS45LDAsMi4yLDAsMi40ICBzMC4xLDAuNSwwLjMs%0D%0AMC43bDcuNSw3LjVjMC4yLDAuMiwwLjIsMC41LDAsMC43bC03LjUsNy41QzAuMSwxOSwwLDE5LjMs%0D%0AMCwxOS41czAuMSwwLjUsMC4zLDAuN2wxLjQsMS40YzAuMiwwLjIsMC41LDAuMywwLjcsMC4zICBz%0D%0AMC41LTAuMSwwLjctMC4zbDcuNS03LjVjMC4yLTAuMiwwLjUtMC4yLDAuNywwbDcuNSw3LjVjMC4y%0D%0ALDAuMiwwLjUsMC4zLDAuNywwLjNzMC41LTAuMSwwLjctMC4zbDEuNC0xLjRjMC4yLTAuMiwwLjMt%0D%0AMC41LDAuMy0wLjcgIHMtMC4xLTAuNS0wLjMtMC43TDE0LjEsMTEuM3oiIGZpbGw9IiNGRkZGRkYi%0D%0ALz4KPC9zdmc+";
        self.DOM.close.addEventListener("click", function (e) {
            self.onclose(e);
        }, false);
        self.DOM.dialog = document.createElement("div");
        self.DOM.dialog.classList.add(self.config.stylePrefix + "dialog");
        self.DOM.dialog.appendChild(self.DOM.root);
        self.DOM.shade = shade;
        self.DOM.shade.classList.add(self.config.stylePrefix + "shade");
        self.DOM.shade.appendChild(self.DOM.dialog);
        return ret;
    };

    self.saveValues = async function () {
        if (!self.valuesLoaded)
            return false;
        for (let id in self.fields)
            if (self.fields.hasOwnProperty(id))
                await _setValue(id, self.fields[id].value);
    };
    self.saveForm = async function (saveValues = true) {
        if (!self.isOpen)
            return false;
        for (let id in self.fields)
            if (self.fields.hasOwnProperty(id))
                self.fields[id].value = _getFormFieldValue(id);
        if (saveValues)
            await self.saveValues();
    };

    let _getLang = function () {
        return document.documentElement.getAttribute("lang");
    };
    let _getScriptPageLink = function (id, lang) {
        return `//greasyfork.org/${lang}/scripts/${id}`;
    };
    let _getConfigPageLink = function (id, lang) {
        return _getScriptPageLink(id, lang) + "/config";
    };
    self.greasyfork = {
        addStyle: function () {
            return _addStyle(`
                #script-content .${self.config.stylePrefix}content {
                    padding-top: 0px;
                }
                #script-content .${self.config.stylePrefix}save {
                    background: rgba(0,0,0,0.03);
                    border: 1px solid rgba(0,0,0,0.2);
                    border-top: 7px solid #990000;
                    color: black;
                }
                #script-content .${self.config.stylePrefix}save:hover {
                    border-color: rgba(0,0,0,0.4);
                    border-top-color: #BB0000;
                    background: rgba(0,0,0,0.03);
                }
                #script-content .${self.config.stylePrefix}save:active {
                    border-color: #670000;
                }
            `);
        },
        addConfigTab: function (label, callback, force = false) {
            if (!callback)
                return self.greasyfork.addConfigTab_openDialog(label, force);
            let tabClass = "." + self.config.stylePrefix + "greasyfork-tab";
            let nav = document.getElementById("script-links");
            if (nav.getElementsByClassName("." + tabClass).length !== 0)
                return false;
            let tab = document.createElement("li");
            let link = document.createElement("a");
            let text = document.createElement("span");
            if (typeof label === "undefined")
                label = self.greasyfork.tabLabel.get();
            let str = document.createTextNode(label);
            text.appendChild(str);
            link.appendChild(text);
            link.style.cursor = "pointer";
            if (typeof callback === "function")
                link.addEventListener("click", async function (e) {
                    e.preventDefault();
                    callback();
                });
            else link.href = callback;
            tab.appendChild(link);
            tab.classList.add(tabClass);
            nav.appendChild(tab);
            return tab;
        },
        addConfigTab_openDialog: function (label, force = false) {
            return self.greasyfork.addConfigTab(label, function () {
                self.showDialog();
            }, force);
        },
        addConfigTab_openConfigPage: function (id, label, force = false) {
            let lang = _getLang();
            let href = _getConfigPageLink(id, lang);
            return self.greasyfork.addConfigTab(label, href, force);
        },
        addConfigPage: async function (id, header = "Config Page") {
            let title = document.querySelector("head title");
            title.innerHTML = "Config";
            let lang = _getOrDefault(_getLang(), "en");
            await self.greasyfork.attachTemplate(id, lang);
            let description = document.getElementById("script-description");
            description.innerText = header;
            let tab = self.greasyfork.addConfigTab_openConfigPage(id);
            self.greasyfork.currentizeTab(tab);
            let wrapper = document.getElementById("script-content");
            self.greasyfork.addStyle();
            await self.attachTo(wrapper, false);
        },
        attachTemplate: async function (id, lang = "en") {
            let template = await _getValue("_TEMPLATE");
            if (typeof template === "undefined")
                template = await self.greasyfork.storeTemplate(id, lang);
            let wrapper = document.querySelector("#main-header + div");
            wrapper.innerHTML = template;
            return wrapper;
        },
        storeTemplate: async function (id, lang = "en") {
            return new Promise((resolve, reject) => {
                let frame = document.createElement("iframe");
                frame.addEventListener("load", async function () {
                    let fdoc = frame.contentWindow ? frame.contentWindow.document : frame.contentDocument;
                    let script_info = fdoc.getElementById("script-info");
                    let description = script_info.querySelector("#script-description");
                    description.innerHTML = "";
                    let content = script_info.querySelector("#script-content");
                    content.innerHTML = "";
                    let ctab = fdoc.querySelector("#script-links .current");
                    let ctabtext = ctab.getElementsByTagName("span")[0];
                    ctab.innerHTML = "";
                    let ctablink = fdoc.createElement("a");
                    ctablink.setAttribute("href", frame.src);
                    ctab.appendChild(ctablink);
                    ctablink.appendChild(ctabtext);
                    await _setValue("_TEMPLATE", script_info.outerHTML);
                    resolve(script_info.outerHTML);
                }, false);
                frame.src = _getScriptPageLink(id, lang);
                frame.style.display = "none";
                document.body.appendChild(frame);
            });
        },
        currentizeTab: function (newCurrent, defHref = "") {
            for (let c of document.getElementsByClassName("current")) {
                c.classList.remove("current");
                let link_link = document.createElement("a");
                link_link.href = defHref;
                link_link.innerHTML = c.innerHTML;
                c.innerHTML = "";
                c.appendChild(link_link);
            }
            newCurrent.classList.add("current");
            newCurrent.innerHTML = newCurrent.getElementsByTagName("a")[0].innerHTML;
        },
        isScriptPage: function (id) {
            return location.href.search("greasyfork.org\/.*\/scripts\/" + id) !== -1;
        },
        isConfigPage: function (id) {
            return location.href.search("greasyfork.org\/.*\/scripts\/" + id + "[\w\-]*\/config") !== -1;
        },
        tabLabel: {
            en: "Config",
            de: "Einstellungen",
            at: "Einstellungen",
            fr: "Paramètres",
            es: "Ajustes",
            fallback: "en",
            get: function (lang) {
                lang = _getOrDefault(lang, _getLang());
                return _getOrDefault(self.greasyfork.tabLabel[lang], self.greasyfork.tabLabel[self.greasyfork.tabLabel.fallback]);
            }
        }
    };
}

if (typeof GM !== "undefined")
    GM.Config = Config;