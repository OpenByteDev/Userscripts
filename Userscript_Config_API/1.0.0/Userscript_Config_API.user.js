// ==UserScript==
// @name            Userscript Config API
// @namespace       openbyte/usconfig
// @author          OpenByte
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @description     API for implementing Config Pages for Userscripts.
// @license         MIT License
// @encoding        utf-8
// @version         1.0.0
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

class Config {
    constructor(config={}) {
        this.version = '1.0.0';
        this.inputConfig = config;
        this.config = {
            id: 'id' in config ? config.id : "config",
            title: config.title || "Script Config",
            stylePrefix: config.stylePrefix || "config-"
        };
        this.config.css = `
        body.config-dialog-visible {
            overflow: hidden;
        }
        .${this.config.stylePrefix}shade {
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
        .${this.config.stylePrefix}dialog {
            margin: auto;
            background-color: white;
        }
        .${this.config.stylePrefix}dialog * {
            font-family: Arial, sans-serif;
            font-style: normal;
            text-transform: initial;
        }
        .${this.config.stylePrefix}root {
            background-color: white;
            color: black;
            box-sizing: border-box;
        }
        .${this.config.stylePrefix}header {
            position: relative;
            background-color: #333;
            padding: 35px 45px;
        }
        .${this.config.stylePrefix}header * {
            color: white;
        }
        .${this.config.stylePrefix}title {
            text-align: center;
            font-size: 35px;
            line-height: 40px;
            font-family: 'Roboto', 'Open-Sans', Arial, sans-serif;
            margin: 0;
            padding: 0;
        }
        .${this.config.stylePrefix}close {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
        }
        .${this.config.stylePrefix}content {
            height: 100%;
            padding: 25px 35px;
        }
        .${this.config.stylePrefix}dialog .${this.config.stylePrefix}content {
            display: flex;
            flex-direction: column;
        }
        .${this.config.stylePrefix}options, .${this.config.stylePrefix}save {
            margin: auto;
        }
        .${this.config.stylePrefix}field {
            margin-bottom: 10px;
        }
        .${this.config.stylePrefix}label {
            margin-right: 10px;
        }
        .${this.config.stylePrefix}field input[type=number] {
            width: 100px;
        }
        .${this.config.stylePrefix}save {
            margin-top: 25px;
            padding: 10px 35px;
            background-color: #333;
            color: white;
            border: 2px solid transparent;
            font-weight: bold;
        }
        .${this.config.stylePrefix}save:hover {
            outline: none !important;
            background-color: #222;
        }
        .${this.config.stylePrefix}save:active {
            background-color: white;
            color: #333;
            border-color: #333;
        }
        .${this.config.stylePrefix}save, .${this.config.stylePrefix}close {
            cursor: pointer;
        }
    ` + (config.css || "");

        this.config.fields = {};
        if (config.fields) {
            for (let id in config.fields) {
                if (!config.fields.hasOwnProperty(id))
                    continue;
                let f = config.fields[id];
                this.config.fields[id] = {
                    label: f.label || id + ": ",
                    type: f.type.toLowerCase() || "text",
                    attributes: f.attributes || {}
                };
                this.config.fields[id].default = typeof f.default !== "undefined" ? f.default : Config.getDefaultForType(this.config.fields[id].type);
                if (f.type === "radio" || f.type === "select")
                    this.config.fields[id].values = {};
            }
        }
        this.fields = this.config.fields;
        this.valuesLoaded = false;
        this.isOpen = false;
        this.DOMGenerated = false;
        this.styleAdded = false;
    }
    static getDefaultForType(type) {
        switch (type) {
            case "number":
            case "range":
                return 0;
            case "checkbox":
                return false;
            default:
                return "";
        }
    }
    async onsave() {
        await this.saveForm();
        alert("Config saved");
    }
    onclose() {
        this.close();
    };
    async generateDOM() {
        if (!this.valuesLoaded)
            await this.loadValues();
        this.DOM = {
            root: document.createElement("section"),
            title: document.createElement("h1"),
            content: document.createElement("div"),
            options: document.createElement("div"),
            save: document.createElement("button"),
            close: document.createElement("img"),
            header: document.createElement("header"),
            fields: {}
        };
        this.DOM.root.classList.add(this.config.stylePrefix + "root");
        this.DOM.header.classList.add(this.config.stylePrefix + "header");
        this.DOM.title.classList.add(this.config.stylePrefix + "title");
        this.DOM.title.innerText = this.config.title;
        this.DOM.content.classList.add(this.config.stylePrefix + "content");
        this.DOM.options.classList.add(this.config.stylePrefix + "options");
        this.DOM.save.classList.add(this.config.stylePrefix + "save");
        this.DOM.save.innerText = "Save";
        this.DOM.save.addEventListener("click", e => this.onsave(e), false);
        this.DOM.root.appendChild(this.DOM.header);
        this.DOM.header.appendChild(this.DOM.title);
        this.DOM.header.appendChild(this.DOM.close);
        this.DOM.root.appendChild(this.DOM.content);
        this.DOM.content.appendChild(this.DOM.options);
        this.DOM.content.appendChild(this.DOM.save);

        for (let id in this.fields) {
            if (!this.fields.hasOwnProperty(id))
                continue;
            let f = this.fields[id];
            let field = document.createElement("div");
            field.classList.add(this.config.stylePrefix + "field");
            let input = document.createElement("input");
            input.classList.add(this.config.stylePrefix + "input");
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
            input.setAttribute("id", this.config.stylePrefix + id);
            let label = document.createElement("label");
            label.classList.add(this.config.stylePrefix + "label");
            label.setAttribute("for", this.config.stylePrefix + id);
            let text = document.createTextNode(f.label);
            label.appendChild(text);
            field.appendChild(label);
            field.appendChild(input);
            this.DOM.fields[id + "_input"] = input;
            this.DOM.fields[id + "_label"] = label;
            this.DOM.fields[id] = field;
            this.DOM.options.appendChild(field);
        }
        this.DOMGenerated = true;
        return this.DOM;
    }
    async loadValues() {
        for (let id in this.fields)
            if (this.fields.hasOwnProperty(id))
                this.fields[id].value = await this.getValueOrDefault(id);
        this.valuesLoaded = true;
    }
    async getValueOrDefault(name) {
        let val = await GM.getValue(name);
        if (!this.fields.hasOwnProperty(name))
            return val;
        if (typeof val === "undefined")
            val = this.fields[name].default;
        if (this.fields[name].type === "number")
            return Number(val);
        return val;
    }
    async getValue(name, direct = false) {
        if (direct)
            return await GM.getValue(name);
        if (this.fields.hasOwnProperty(name) && this.fields[name].hasOwnProperty("value"))
            return Promise.resolve(this.fields[name].value);
        else {
            let val = await _getValue2(name);
            this.fields[name].value = val;
            return val;
        }
    }
    async setValue(name, value) {
        if (this.fields[name])
            this.fields[name].value = value;
        await GM.setValue(name, value);
    }
    addStyle(force = false) {
        if (!force && this.styleAdded)
            return false;
        this.styleAdded = true;
        return GM.addStyle(this.config.css);
    }
    _close() {}
    close() {
        if (!this.isOpen)
            return false;
        return this._close();
    }
    async _attachHelper(source, target, addStyle, defineClose, closer) {
        if (defineClose)
            this._close = () => {
                source.remove();
                if (closer)
                    closer();
            };
        if (addStyle)
            this.addStyle();
        this.isOpen = true;
        return target.appendChild(source);
    }
    async attachTo(node = document.body, includeHeader = true, addStyle = true, defineClose = true) {
        if (!this.DOMGenerated)
            await this.generateDOM();
        if (!includeHeader)
            this.DOM.header.style.display = "none";
        return await this._attachHelper(this.DOM.root, node, addStyle, defineClose, null);
    };
    async showDialog(addStyle = true, defineClose = true) {
        if (!this.DOMGenerated)
            await this.generateDOM();
        let shade = document.createElement("div");
        let ret = await this._attachHelper(shade, document.body, addStyle, defineClose, () => {
            document.body.classList.remove("config-dialog-visible");
            delete this.DOM.shade;
            delete this.DOM.dialog;
        });
        document.body.classList.add("config-dialog-visible");
        this.DOM.close.classList.add(this.config.stylePrefix + "close");
        this.DOM.close.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRw%0D%0AOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCAyMS45%0D%0AIDIxLjkiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDIxLjkgMjEuOSIgd2lkdGg9IjUxMnB4%0D%0AIiBoZWlnaHQ9IjUxMnB4Ij4KICA8cGF0aCBkPSJNMTQuMSwxMS4zYy0wLjItMC4yLTAuMi0wLjUs%0D%0AMC0wLjdsNy41LTcuNWMwLjItMC4yLDAuMy0wLjUsMC4zLTAuN3MtMC4xLTAuNS0wLjMtMC43bC0x%0D%0ALjQtMS40QzIwLDAuMSwxOS43LDAsMTkuNSwwICBjLTAuMywwLTAuNSwwLjEtMC43LDAuM2wtNy41%0D%0ALDcuNWMtMC4yLDAuMi0wLjUsMC4yLTAuNywwTDMuMSwwLjNDMi45LDAuMSwyLjYsMCwyLjQsMFMx%0D%0ALjksMC4xLDEuNywwLjNMMC4zLDEuN0MwLjEsMS45LDAsMi4yLDAsMi40ICBzMC4xLDAuNSwwLjMs%0D%0AMC43bDcuNSw3LjVjMC4yLDAuMiwwLjIsMC41LDAsMC43bC03LjUsNy41QzAuMSwxOSwwLDE5LjMs%0D%0AMCwxOS41czAuMSwwLjUsMC4zLDAuN2wxLjQsMS40YzAuMiwwLjIsMC41LDAuMywwLjcsMC4zICBz%0D%0AMC41LTAuMSwwLjctMC4zbDcuNS03LjVjMC4yLTAuMiwwLjUtMC4yLDAuNywwbDcuNSw3LjVjMC4y%0D%0ALDAuMiwwLjUsMC4zLDAuNywwLjNzMC41LTAuMSwwLjctMC4zbDEuNC0xLjRjMC4yLTAuMiwwLjMt%0D%0AMC41LDAuMy0wLjcgIHMtMC4xLTAuNS0wLjMtMC43TDE0LjEsMTEuM3oiIGZpbGw9IiNGRkZGRkYi%0D%0ALz4KPC9zdmc+";
        this.DOM.close.addEventListener("click", e => this.onclose(e), false);
        this.DOM.dialog = document.createElement("div");
        this.DOM.dialog.classList.add(this.config.stylePrefix + "dialog");
        this.DOM.dialog.appendChild(this.DOM.root);
        this.DOM.shade = shade;
        this.DOM.shade.classList.add(this.config.stylePrefix + "shade");
        this.DOM.shade.appendChild(this.DOM.dialog);
        return ret;
    };
    async saveValues() {
        if (!this.valuesLoaded)
            return false;
        for (let id in this.fields)
            if (this.fields.hasOwnProperty(id))
                await GM.setValue(id, this.fields[id].value);
    }
    async saveForm(saveValues = true) {
        if (!this.isOpen)
            return false;
        for (let id in this.fields)
            if (this.fields.hasOwnProperty(id))
                this.fields[id].value = this.getFieldValue(id);
        if (saveValues)
            await this.saveValues();
    }
    getFieldValue(id) {
        switch (this.fields[id].type) {
            case "checkbox":
                return this.DOM.fields[id + "_input"].checked;
            case "number":
                return Number(this.DOM.fields[id + "_input"].value);
            default:
                return this.DOM.fields[id + "_input"].value;
        }
    }
}

if (typeof GM !== "undefined")
    GM.Config = Config;
