// ==UserScript==
// @name            Easy 10 Minute Mail
// @namespace       openbyte/e10mm
// @version         1.0.1
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Adds 10MinuteMail button to mail inputs.
// @homepageURL     https://github.com/OpenByteDev/Userscripts/tree/master/Easy_10_Minute_Mail
// @icon            https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Easy_10_Minute_Mail/icon32.png
// @icon64          https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Easy_10_Minute_Mail/icon64.png
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Easy_10_Minute_Mail/Easy_10_Minute_Mail.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Easy_10_Minute_Mail/Easy_10_Minute_Mail.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @include         *
// @connect         10minutemail.net
// @connect         *
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @run-at          document-idle
// @grant           GM_xmlhttpRequest
// @grant           GM_addStyle
// @grant           GM.xmlHttpRequest
// @grant           GM.addStyle
// ==/UserScript==


'use strict';

(async () => {

    const SITE_URL = (location.protocol || 'http') + '//10minutemail.net/';
    const API_URL = SITE_URL + 'address.api.php';
    const ICON_URL = '//www.google.com/s2/favicons?domain=' + SITE_URL;

    Array.prototype.peek = function(callback, thisArg) {
        this.forEach(callback, thisArg);
        return this;
    };

    async function fetchAddressData() {
        return new Promise((resolve, reject) =>
            GM.xmlHttpRequest({
                url: API_URL,
                method: 'GET',
                anonymous: true, // we want a new address with every request (no-cookies)
                onload: response =>
                    resolve(JSON.parse(response.responseText)),
                onerror: reject
            }), false);
    }

    function enterValue(input, value) {
        input.focus();
        input.select();
        input.value = value;
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new Event('change'));
        input.blur();
    }

    async function addIconButton(input) {
        const icon = document.createElement('IMG');
        icon.classList.add('easy-10mm-icon');
        icon.src = ICON_URL;
        addClickListener(icon, input);
        input.insertAdjacentElement('afterend', icon);
    }

    function addClickListener(element, input) {
        return element.addEventListener('click', async () => {
            const data = await fetchAddressData();
            enterValue(input, data.mail_get_mail);
            console.info(data);
        }, false);
    }

    function randomString() {
        return Math.random().toString(36).substring(2);
    }

    function addContextMenu(input) {
        const id = 'easy-10mm-menu-' + randomString();
        const menu = document.createElement('MENU');
        menu.setAttribute('type', 'context');
        menu.setAttribute('id', id);
        const item = document.createElement('MENUITEM');
        item.setAttribute('icon', ICON_URL);
        item.setAttribute('label', 'Insert 10 Minute Mail');
        item.setAttribute('type', 'command');
        menu.appendChild(item);
        addClickListener(item, input);
        document.body.appendChild(menu);
        input.setAttribute('contextmenu', id);
    }

    const inputSelector = '[type=email], [type=text][placeholder*=mail i], [type=username][placeholder*=mail i]';

    function modifyInputs(inputs) {
        for (const input of inputs) {
            if (input.type === 'email' || input.type === 'text' || input.type === 'username')
                addContextMenu(input);
            if (input.matches(inputSelector))
                addIconButton(input);
        }
    }

    modifyInputs([...document.getElementsByTagName('input')]);

    const observer = new MutationObserver(mutations => {
        modifyInputs(mutations
            .flatMap(mutation => [...mutation.addedNodes])
            .filter(node => node.nodeType === Node.ELEMENT_NODE)
            .map(element => element.nodeName === 'INPUT' ? element : [...element.getElementsByTagName('input')])
            .flat());
    });
    observer.observe(document.body, {
        childList: true,
        attributes: true,
        subtree: true
    });

    GM.addStyle(`
	    .easy-10mm-icon {
		    height: 24px !important;
			width: 24px !important;
			cursor: pointer;
		}
	`);

})();
