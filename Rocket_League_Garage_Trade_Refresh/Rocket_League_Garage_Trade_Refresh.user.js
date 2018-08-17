// ==UserScript==
// @name            Rocket League Garage Trade Refresh
// @namespace       openbyte/rltr
// @version         4.8.0
// @author          OpenByte <development.openbyte@gmail.com>
// @description     Adds a refresh functionality to rocket-league.com
// @homepageURL     https://github.com/OpenByteDev/Userscripts/tree/master/Rocket_League_Garage_Trade_Refresh
// @icon            https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/icon32.png
// @icon64          https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/icon64.png
// @updateURL       https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/Rocket_League_Garage_Trade_Refresh.meta.js
// @downloadURL     https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/Rocket_League_Garage_Trade_Refresh/Rocket_League_Garage_Trade_Refresh.user.js
// @supportURL      https://github.com/OpenByteDev/Userscripts/issues
// @require         https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @require         https://cdn.rawgit.com/OpenByteDev/Userscripts/32e48e33/Userscript_Config_API/1.0.0/Userscript_Config_API.user.js
// @require         https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require         https://cdn.jsdelivr.net/npm/amaranjs@0.5.5/dist/js/jquery.amaran.min.js
// @include         /^https?:\/\/(?:.*?\.)?rocket-league\.com\/trades?\/.*$/
// @match           *://*.rocket-league.com/trades/*
// @match           *://*.rocket-league.com/trade/*
// @connect         rocket-league.com
// @connect         cdn.jsdelivr.net
// @connect         *
// @license         MIT License; https://raw.githubusercontent.com/OpenByteDev/Userscripts/master/LICENSE
// @noframes
// @run-at          document-end
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

    const config = new Config({
        id: 'RLR_config',
        title: 'Rocket League Garage Trade Refresh Settings',
        fields: {
            'UPDATE_TIMER2': {
                label: 'Update the Timers: ',
                type: 'checkbox',
                default: true
            },
            'MAX_FAIL_COUNT2': {
                label: 'Maximum Number of Refresh-Fails: ',
                type: 'number',
                default: 5
            },
            'MAX_FAIL_RESET_DELAY3': {
                label: 'Reset max-fail-reached state delay (s):',
                type: 'number',
                default: 15
            },
            'SUCCESS_MSG_MANDATORY7': {
                label: 'Check for the succes Message when refreshing (not recommended): ',
                type: 'checkbox',
                default: false
            },
            'AUTO_REFRESH2': {
                label: 'Automatically Refresh Trades: ',
                type: 'checkbox',
                default: true
            },
            'AUTO_REFRESH_INTERVAL4': {
                label: 'Average Refresh rate (s): ',
                type: 'number',
                default: 50
            },
            'COMPARE2': {
                label: 'Detect trade changes and timer errors: ',
                type: 'checkbox',
                default: true
            },
            'COMPARE_INTERVAL3': {
                label: 'Compare-Routine Interval (s): ',
                type: 'number',
                default: 100
            },
            'ADD_NEWTRADE_SHORTCUT2': {
                label: 'Add "New Trade" button to trades page: ',
                type: 'checkbox',
                default: true
            },
            'SHOW_PROGRESS_BAR2': {
                label: 'Show the progress bar: ',
                type: 'checkbox',
                default: true
            },
            'PROGRESS_BAR_UPDATE_INTERVAL2': {
                label: 'Updateinterval for Progressbars (ms): ',
                type: 'number',
                default: 250
            }
        }
    });

    await config.loadValues();


    //prevent interference
    this.$ = this.jQuery = jQuery.noConflict(true);

    let RLR = {};
    RLR = {
        version: '4.8.0',
        settings: {
            UPDATE_TIMER: await config.getValue('UPDATE_TIMER2'),
            MAX_FAIL_COUNT: await config.getValue('MAX_FAIL_COUNT2'),
            MAX_FAIL_RESET_DELAY: await config.getValue('MAX_FAIL_RESET_DELAY3'),
            SUCCESS_MSG_MANDATORY: await config.getValue('SUCCESS_MSG_MANDATORY7'),
            AUTO_REFRESH: await config.getValue('AUTO_REFRESH2'),
            AUTO_REFRESH_INTERVAL: await config.getValue('AUTO_REFRESH_INTERVAL4'),
            COMPARE: await config.getValue('COMPARE2'),
            COMPARE_INTERVAL: await config.getValue('COMPARE_INTERVAL3'),
            ADD_NEWTRADE_SHORTCUT: await config.getValue('ADD_NEWTRADE_SHORTCUT2'),
            SHOW_PROGRESS_BAR: await config.getValue('SHOW_PROGRESS_BAR2'),
            PROGRESS_BAR_UPDATE_INTERVAL: await config.getValue('PROGRESS_BAR_UPDATE_INTERVAL2')
        },
        tradeContainer: undefined,
        trades: {},
        timeController: {
            setTime: function (trade, value, scale) {
                value = Math.floor(value);
                const c_num = trade.time.num.html();
                const c_scale = trade.time.scale.html();
                if (c_num !== value) trade.time.num.html(value);
                if (value !== 1) scale += 's';
                if (c_scale !== scale) trade.time.scale.html(scale);
            },
            getTime: function (value, scale) {
                return Number(value) * RLR.timeController.unit.get(scale);
            },
            getTimeFromString: function (string) {
                const scales = /(?:second|minute|hour|day|week|month|year)s?/.exec(string);
                const nums = /\d+/.exec(string);
                if (!scales || !nums || scales.length === 0 || nums.length === 0)
                    return null;
                return RLR.timeController.getTime(nums[0], scales[0]);
            },
            unit: {
                second: 1,
                minute: 60,
                hour: 3600,
                day: 86400,
                week: 604800,
                year: 31449600,
                generalize: function (scale) {
                    return scale.endsWith('s') ? scale.substring(0, scale.length - 1) : scale;
                },
                get: function (scale) {
                    return RLR.timeController.unit[RLR.timeController.unit.generalize(scale)];
                },
                getCurrent: function (num) {
                    for (let s of ['year', 'week', 'day', 'hour', 'minute', 'second'])
                        if (num >= RLR.timeController.unit[s])
                            return s;
                }
            }
        },
        refresher: {
            autoRefresh: async function (retryOnError = true, maxRetryCount = 5, retryCount = 0) {
                const trades = Object.keys(RLR.trades).sort(function (a, b) {
                    return RLR.trades[b].time.active - RLR.trades[a].time.active;
                });
                for (let t of trades) {
                    if (!RLR.trades.hasOwnProperty(t))
                        continue;
                    if (RLR.trades[t].time.active >= 900 && !RLR.trades[t].refresh.pause.state && RLR.trades[t].refresh.state === 'dead' && RLR.trades[t].refresh.fails < RLR.settings.MAX_FAIL_COUNT) {
                        const success = await RLR.refresher.refresh(t);
                        if (!success && retryOnError && retryCount < maxRetryCount && (RLR.trades[t].state === 'site error' || RLR.trades[t].state.startsWith('request error')))
                            RLR.refresher.autoRefresh(retryOnError, maxRetryCount, ++retryCount);
                        break;
                    }
                }
            },
            getTradePOST: function (trade) {
                const e = $(trade);
                if (typeof e.data('item') === 'undefined')
                    return;
                const obj = {
                    itemId: e.data('item'),
                    paint: e.data('paint') || 0,
                    cert: e.data('cert') || 0
                };
                const quantity = e.data('quantity');
                if (quantity && quantity > 1)
                    obj.quantity = quantity;
                return obj;
            },
            getTradesPOST: function (container) {
                const ar = [];
                $(container).find('.rlg-trade-display-item').each(function () {
                    const item = RLR.refresher.getTradePOST($(this));
                    if (item)
                        ar.push(item);
                });
                return ar;
            },
            refresh: function (t) {
                return new Promise(function (resolve, reject) {
                    RLR.toaster.toast('Refreshing ' + RLR.trades[t].id);
                    RLR.trades[t].refresh.icon.addClass('rotate');
                    RLR.trades[t].refresh.state = 'started';
                    GM.xmlHttpRequest({
                        url: 'https://rocket-league.com/trade/edit?trade=' + RLR.trades[t].id,
                        method: 'get',
                        onload: function (response) {
                            const w = $(response.responseText);
                            if (RLR.refresher.checkForError(w)) {
                                RLR.trades[t].refresh.state = 'site error';
                                RLR.refresher.fail(t);
                                resolve(false);
                                return;
                            }
                            RLR.trades[t].refresh.state = 'loaded edit page';
                            const form = w.find('form[action*="functions/editTrade.php"]');
                            if (form.length === 0) {
                                RLR.trades[t].refresh.state = 'form not found';
                                RLR.refresher.fail(t);
                                resolve(false);
                                return;
                            }
                            const formdata = form.serializeObject();
                            formdata.ownerItems = JSON.stringify(RLR.refresher.getTradesPOST(w.find('#rlg-youritems')));
                            formdata.tradeItems = JSON.stringify(RLR.refresher.getTradesPOST(w.find('#rlg-theiritems')));
                            RLR.trades[t].refresh.state = 'sent refresh request';
                            GM.xmlHttpRequest({
                                url: form.prop('action'),
                                data: $.param(formdata),
                                method: 'post',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                onload: function (response) {
                                    const w = $(response.responseText);
                                    const meta = w.find('.rlg-comment .is--admin').first().parent().find('.rlg-comment-meta').first().text();
                                    if (!meta) {
                                        RLR.trades[t].refresh.state = 'no comment meta found';
                                        RLR.refresher.fail(t);
                                        resolve(false);
                                        return;
                                    }
                                    const time = RLR.timeController.getTimeFromString(meta);
                                    if (!time) {
                                        RLR.trades[t].refresh.state = 'failed to parse comment meta';
                                        RLR.refresher.fail(t);
                                        resolve(false);
                                        return;
                                    }
                                    if (time > 45) {
                                        RLR.trades[t].refresh.state = 'refresh timer too long';
                                        RLR.refresher.fail(t);
                                        resolve(false);
                                        return;
                                    }

                                    if (RLR.settings.SUCCESS_MSG_MANDATORY) {
                                        const msg = w.find('.rlg-site-popup__text').text();
                                        if (!msg.includes('edit') || !msg.includes('success')) {
                                            RLR.trades[t].refresh.state = 'no success msg received';
                                            RLR.refresher.fail(t);
                                            resolve(false);
                                            return;
                                        }
                                    }
                                    RLR.trades[t].refresh.state = 'success';
                                    RLR.refresher.finish(t);
                                    resolve(true);
                                },
                                onerror: function (response) {
                                    RLR.trades[t].refresh.state = 'request error (refresh)';
                                    RLR.refresher.fail(t);
                                    resolve(false);
                                }
                            });
                        },
                        onerror: function (response) {
                            RLR.trades[t].refresh.state = 'request error (edit)';
                            RLR.refresher.fail(t);
                            resolve(false);
                        }
                    });
                })
            },
            checkForError: function (e) {
                return e.find('.rlg-error, #cf-error-details').length !== 0;
            },
            fail: function (t) {
                if (++RLR.trades[t].refresh.fails >= RLR.settings.MAX_FAIL_COUNT)
                    setTimeout(function (_t) {
                        RLR.trades[_t].refresh.fails = 0;
                    }, RLR.settings.MAX_FAIL_RESET_DELAY * 1000, _t);
                RLR.toaster.error(RLR.trades[t].id + ': Refresh failed', '(state=' + RLR.trades[t].refresh.state + ', counter=' + RLR.trades[t].refresh.fails + ')');
                RLR.refresher.clean(t);
            },
            clean: function (t) {
                RLR.trades[t].refresh.icon.removeClass('rotate');
                RLR.trades[t].refresh.state = 'dead';
            },
            finish: function (t) {
                RLR.trades[t].time.active = 0;
                RLR.timeController.setTime(RLR.trades[t], 0, 'second');
                RLR.refresher.clean(t);
                RLR.toaster.success(RLR.trades[t].id + ': Refresh successful');
                RLR.trades[t].refresh.fails = 0;
            }
        },
        init: function () {
            console.log(RLR);
            RLR.isSinglePostPage = $('.is--single').length !== 0;

            //do not run on a foreign single post page
            if (RLR.isSinglePostPage && $('a[href*=\'/edit?trade\']').length === 0)
                return false;

            //JQuery extensions
            $.fn.serializeObject = function () {
                const arrayData = this.serializeArray();
                const objectData = {};

                $.each(arrayData, function () {
                    const value = typeof this.value !== 'undefined' ? this.value : '';

                    if (typeof objectData[this.name] !== 'undefined') {
                        if (!objectData[this.name].push)
                            objectData[this.name] = [objectData[this.name]];
                        objectData[this.name].push(value);
                    } else objectData[this.name] = value;
                });

                return objectData;
            };

            //polyfills & extensions
            if (!String.prototype.endsWith)
                String.prototype.endsWith = function (searchString, position) {
                    const subjectString = this.toString();
                    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
                        position = subjectString.length;
                    }
                    position -= searchString.length;
                    const lastIndex = subjectString.indexOf(searchString, position);
                    return lastIndex !== -1 && lastIndex === position;
                };
            if (!String.prototype.startsWith)
                String.prototype.startsWith = function (searchString, position) {
                    position = position || 0;
                    return this.indexOf(searchString, position) === position;
                };

            //init trades
            RLR.tradeContainer = $('.rlg-trade-display-container.is--user').parent();
            RLR.trades = RLR.genTrades(document);

            //start timeController routines
            RLR.timeController.tuiid = setInterval(function () {
                for (let t in RLR.trades) {
                    if (!RLR.trades.hasOwnProperty(t))
                        continue;
                    RLR.trades[t].time.active++;
                    if (RLR.settings.UPDATE_TIMER) {
                        const s = RLR.timeController.unit.getCurrent(RLR.trades[t].time.active);
                        const v = RLR.timeController.unit[s];
                        if (RLR.trades[t].time.active % v === 0)
                            RLR.timeController.setTime(RLR.trades[t], RLR.trades[t].time.active / v, s);
                    }
                }
            }, 1000);

            if (!RLR.isSinglePostPage) {
                if (RLR.settings.AUTO_REFRESH) {
                    const autoRefresh = function () {
                        RLR.refresher.autoRefresh();
                        RLR.timeController.atiid = setTimeout(autoRefresh, (RLR.settings.AUTO_REFRESH_INTERVAL + RLR.settings.AUTO_REFRESH_INTERVAL / 2 * RLR.utils.normalRandom()) * 1000);
                    };
                    RLR.timeController.atiid = setTimeout(autoRefresh, 1000);
                }

                //add 'Add Trade Offer' Button
                if (RLR.settings.ADD_NEWTRADE_SHORTCUT && $('body').hasClass('rlg-body-profileTrades')) {
                    const otherbtn = $('a[href="?showDisabled"]');
                    otherbtn.before(`<a href='https://rocket-league.com/trading/new' class='${otherbtn.attr('class')}' style='${otherbtn.attr('style')} margin-left: 5px;' target="_blank">ADD TRADE OFFER</a>`);
                }

                if (RLR.settings.COMPARE)
                    RLR.timeController.tciid = setInterval(function () {
                        RLR.compare(true);
                    }, RLR.settings.COMPARE_INTERVAL * 1000);

                if (RLR.settings.SHOW_PROGRESS_BAR) {
                    RLR.timeController.pbiid = setInterval(function () {
                        for (let t in RLR.trades)
                            if (RLR.trades.hasOwnProperty(t) && RLR.trades[t].progress) {
                                const p = RLR.trades[t].time.active / RLR.timeController.getTime(15, 'minute');
                                RLR.trades[t].progress.bar.css('width', 100 * (p < 0 ? 0 : p > 1 ? 1 : p) + '%');
                            }
                    }, RLR.settings.PROGRESS_BAR_UPDATE_INTERVAL);

                    //add progress bar
                    if (RLR.settings.SHOW_PROGRESS_BAR)
                        for (let t in RLR.trades)
                            if (RLR.trades.hasOwnProperty(t))
                                RLR.addProgress(t);
                }

                RLR.addConfigButton();
            }

            //add refresh feature
            for (let t in RLR.trades)
                if (RLR.trades.hasOwnProperty(t))
                    RLR.addRefreshFunc(t);

            //add css
            GM.addStyle('.rlg-trade-display-refresh, .rlg-trade-display-pause { margin-left: 11px; background: none; border: none; } .fa-refresh-o, .fa-pause-o { height: 10px; } iframe.hidden { width: 0px; height: 0px; position: absolute; top: -10000px; left: -10000px; } .rotate { animation-name: rotation; animation-duration: 0.75s; animation-iteration-count: infinite; animation-timing-function: linear; transform-origin: 50% 50%; } @keyframes rotation { from {transform: rotate(360deg);} to {transform: rotate(0deg);} } .row.progress-line { height: 5px; } .progress-value { height: 5px; background-color: #00A3FF; width: 0; margin: 0; padding: 0; } .amaran-wrapper { font-family: Arial, sans-serif; font-size: 14px; }');

            //load toasting styles
            RLR.utils.loadStyle('https://cdn.jsdelivr.net/npm/amaranjs@0.5.5/dist/css/amaran.min.css');
            RLR.utils.loadStyle('https://cdn.jsdelivr.net/npm/amaranjs@0.5.5/dist/css/animate.min.css');
        },
        addConfigButton: function () {
            const container = $(('.rlg-btn-primary[href*="/trading/new"]')).parent();
            container.prev().removeClass('col-3-5').addClass('col-2-5');
            container.removeClass('col-2-5').addClass('col-3-5');
            const btn = $('<a class="rlg-btn-primary" style="float: right; margin-top: 25px; margin-left: 5px;" target="_blank">Trade Refresh Settings</a>');
            btn.click(() => config.showDialog());
            container.prepend(btn);
        },
        addRefreshFunc: function (t) {
            return RLR.trades[t].refresh.e.click(function (e) {
                e.preventDefault();
                RLR.refresher.refresh(t);
            });
        },
        addProgress: function (t) {
            RLR.trades[t].progress = {};
            RLR.trades[t].progress.e = $('<div class=\'row progress-line\'></div>').insertAfter(RLR.trades[t].e.find('.rlg-trade-display-header'));
            RLR.trades[t].progress.bar = $('<div class=\'progress-value\'></div>').appendTo(RLR.trades[t].progress.e);
            return RLR.trades[t].progress;
        },
        compare: async function (retryOnError = true, maxRetryCount = 5, retryCount = 0) {
            const millis = new Date().getTime();
            $.get(location.href, function (data) {
                const w = $(data);
                if (retryOnError && retryCount < maxRetryCount && RLR.refresher.checkForError(w))
                    return RLR.compare(retryOnError, maxRetryCount, ++retryCount);
                const delay = Math.round((new Date().getTime() - millis) / 2000);
                const trades = RLR.genTrades(w);
                for (let t in RLR.trades)
                    if (RLR.trades.hasOwnProperty(t))
                        if (!(t in trades))
                            RLR.removeTrade(t);
                for (let t in trades) {
                    if (!trades.hasOwnProperty(t))
                        continue;
                    if (t in RLR.trades) {
                        if (RLR.trades[t].e.find('.rlg-trade-display-items').html().toLowerCase().replace(' ', '') !== trades[t].e.find('.rlg-trade-display-items').html().toLowerCase().replace(' ', '')) {
                            RLR.removeTrade(t);
                            RLR.appendTrade(trades[t]);
                        } else {
                            trades[t].time.active += delay;
                            if (Math.abs(RLR.trades[t].time.active - trades[t].time.active) > RLR.timeController.unit[RLR.timeController.unit.getCurrent(trades[t].time.active)])
                                RLR.trades[t].time.active = trades[t].time.active + delay;
                        }
                    } else RLR.appendTrade(trades[t]);
                }
                const tcounter = $('.rlg-grid span[style*=opacity]');
                if (tcounter.text().match(/\(\d+\)/))
                    tcounter.text('(' + Object.keys(RLR.trades).length + ')');
            });


        },
        removeTrade: function (t) {
            RLR.trades[t].e.remove();
            delete RLR.trades[t];
        },
        appendTrade: function (trade) {
            const t = trade.id;
            trade.e.appendTo(RLR.tradeContainer);
            RLR.trades[t] = trade;
            RLR.addRefreshFunc(t);
            if (RLR.settings.SHOW_PROGRESS_BAR)
                RLR.addProgress(t);
        },
        genTrades: function (d) {
            const obj = {};
            $(d).find('.rlg-trade-display-container.is--user').each(function () {
                const trade = new RLR.Trade($(this));
                obj[trade.id] = trade;
            });
            return obj;
        },
        Trade: function (e) {
            const self = this;
            self.e = e;
            self.time = {};
            self.time.g = e.find('.rlg-trade-display-added');
            if (self.time.g.find('.rlg-trade-display-added-number').length === 0)
                self.time.g.html(self.time.g.html()
                    .replace(/\d+/, '<span class=\'rlg-trade-display-added-number\'>$&</span>'));
            if (self.time.g.find('.rlg-trade-display-added-scale').length === 0)
                self.time.g.html(self.time.g.html()
                    .replace(/(?:second|minute|hour|day|week|month|year)s?/, '<span class=\'rlg-trade-display-added-scale\'>$&</span>'));
            self.time.num = self.time.g.find('.rlg-trade-display-added-number');
            self.time.scale = self.time.g.find('.rlg-trade-display-added-scale');
            self.time.active = RLR.timeController.getTime(self.time.num.html(), self.time.scale.html());
            self.bookmark = e.find('.rlg-trade-display-bookmark');
            self.id = self.bookmark.attr('data-alias');
            self.refresh = {};
            self.refresh.e = e.find('.rlg-trade-display-refresh');
            if (self.refresh.e.length === 0)
                self.refresh.e = $('<button class=\'rlg-trade-display-refresh\' name=\'refresh\' ><img class=\'fa-refresh-o\' aria-hidden=\'true\' src=\'https://i.imgur.com/DaYwkeR.png\' />').insertBefore(self.bookmark);
            self.refresh.state = 'dead';
            self.refresh.fails = 0;
            self.refresh.pause = {};
            self.refresh.pause.state = false;
            self.refresh.pause.e = e.find('.rlg-trade-display-pause');
            if (self.refresh.pause.e.length === 0) {
                self.refresh.pause.e = $('<button class=\'rlg-trade-display-pause\' name=\'refresh\'><img class=\'fa-pause-o\' aria-hidden=\'true\' src=\'https://i.imgur.com/2cMJYQq.png\' data-normal-src=\'https://i.imgur.com/2cMJYQq.png\' data-toggled=\'false\' data-toggled-src=\'https://i.imgur.com/kTaQ91J.png\' />').insertBefore(self.refresh.e);
                self.refresh.pause.icon = self.refresh.pause.e.find('img');
                self.refresh.pause.toggle = async function () {
                    await self.refresh.pause.set(await GM.getValue(self.id + '_paused') !== true);
                };
                self.refresh.pause.set = async function (state) {
                    const img = self.refresh.pause.icon;
                    img.data('toggled', state);
                    img.prop('src', img.data((state ? 'toggled' : 'normal') + '-src'));
                    self.refresh.pause.state = state;
                    if (state)
                        await GM.setValue(self.id + '_paused', true);
                    else
                        await GM.deleteValue(self.id + '_paused');
                };
                self.refresh.pause.e.click(self.refresh.pause.toggle);
            }
            self.refresh.icon = self.refresh.e.find('img');
            (async () => {
                if (await GM.getValue(self.id + '_paused') === true)
                    await self.refresh.pause.set(true);
            })();
        },
        toaster: {
            success: function (title, msg) {
                return RLR.toaster.toast(title, msg, 'rgb(39,174,96)');
            },
            error: function (title, msg) {
                return RLR.toaster.toast(title, msg, 'rgb(198,70,61)');
            },
            toast: function (title, msg, bgcolor) {
                $.amaran({
                    theme: 'colorful',
                    content: {
                        bgcolor: bgcolor || '#00A3FF',
                        color: '#f0f0f0',
                        message: title + (msg ? ('<br/>' + msg) : '')
                    },
                    delay: 10000,
                    position: 'bottom right',
                    outEffect: 'fade',
                    inEffect: 'slideBottom'
                });
                console.log(title + ' ' + (msg ? msg : ''));
            }
        },
        utils: {
            loadStyle: function (url) {
                GM.xmlHttpRequest({
                    url: url,
                    method: 'get',
                    onload: function (data) {
                        GM.addStyle(data.responseText);
                    }
                });
            },
            normalRandom: function () {
                return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
            }
        }
    };
    
    RLR.init();

})();
