// ==UserScript==
// @name            Easy 10 Minute Mail
// @namespace       openbyte/e10mm
// @version         0.1.0
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
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @run-at          document-idle
// @grant           GM_xmlhttpRequest
// @grant           GM_addStyle
// @grant           GM.xmlHttpRequest
// @grant           GM.addStyle
// ==/UserScript==

'use strict';

(async () => {

    // https://stackoverflow.com/questions/4793604/how-to-insert-an-element-after-another-element-in-javascript-without-using-a-lib
    // create function, it expects 2 values.
    function insertAfter(newElement, targetElement) {
        // target is what you want it to go after. Look for this elements parent.
        const parent = targetElement.parentNode;

        // if the parents lastchild is the targetElement...
        if (parent.lastChild === targetElement) {
            // add the newElement after the target element.
            parent.appendChild(newElement);
        } else {
            // else the target has siblings, insert the new element between the target and it's next sibling.
            parent.insertBefore(newElement, targetElement.nextSibling);
        }
    }


    const mmurl = 'https://10minutemail.net/';

    const inputs = document.querySelectorAll('input[type=email], input[type=text][placeholder*=mail i], input[type=username][placeholder*=mail i]');
    if (inputs.length === 0)
        return;

    for (const input of inputs) {
        const icon = document.createElement('IMG');
        icon.classList.add('e10mm-icon');
        icon.src = 'http://www.google.com/s2/favicons?domain=' + mmurl;
        insertAfter(icon, input);
        icon.addEventListener('click', () =>
            GM.xmlHttpRequest({
                url: mmurl,
                method: 'GET',
                onload: response => {
                    const regex = /<input .*?(?:id="fe_text"|class="mailtext").*?value="([^"]+)".*?\/?>/gi;
                    const html = response.responseText;
                    const data = regex.exec(html);
                    if (data === null || data.length < 2)
                        return;
                    input.value = data[1];
                }
            }), false);
    }

    GM.addStyle(`
	    .e10mm-icon {
		    height: 24px !important;
			width: 24px !important;
			cursor: pointer;
		}
	`);

})();
