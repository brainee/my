define('basecard', ['cUtilHybrid', 'cGuiderService', 'MyCtripModel', 'cUtilCryptBase64', 'myctripCommon', 'text!template', 'UILayerList', 'cHybridShell', 'UIMask'], function (cUtility, Guider, MyCtripModel, cUtilityCrypt, MyctripCommon, tempHtml, UILayerList, cHybridShell, UIMask) {

    //当前页面的view实例
    var currentView = null;

    //当前是否是online环境
    var isOnline = false;

    //各种按钮的长度配置
    var BTN_LEN_CNF = { 0: 66, 2: 66, 3: 76, 4: 90, 5: 104, 6: 118, 7: 132 };

    //"更多"按钮配置
    var MORE_BTN_CNF = { code: 'MoreBtn', content: "<i></i>", rankid: 20, 'class': 'btn-more', isapp: 0, style: 0 };

    //BizType转译,BizType不同规则相同。
    var C_biztype = {
        Hotel: ['Hotel', '国内'],
        HotelDomestic: ['Hotel', '国内'],
        HotelMask: ['Hotel', '惠选'],
        HotelInternational: ['Hotel', '海外'],
        Train: ['Train', '国内'],
        TrainDomestic: ['Train', '国内'],
        TrainInternational: ['Train', '国际'],
        Flight: ['Flight', '国内'],
        FlightDomestic: ['Flight', '国内'],
        FlightInternational: ['Flight', '国际']
    };

    //BizType转译
    var T_trans = function (b, type) {
        if (type) {
            var d = b && C_biztype.hasOwnProperty(b) ? C_biztype[b][1] : b;
            return d;
        } else {
            var d = b && C_biztype.hasOwnProperty(b) ? C_biztype[b][0] : b;
            return d;
        }
    };

    //时间处理函数
    var formatDate = function (date, type) {
        var pattern = /^(\d{1,4})\-(\d{1,2})\-(\d{1,2})\s+(\d{1,2})\:(\d{1,2})\:(\d{1,2})$/;
        var y = '', m = '', d = '', h = '', min = '';
        var f = function (d) {
            return d < 10 ? '0' + d : d;
        }
        if (date) {
            var dateArr = date.match(pattern);
            if (dateArr) {
                y = +dateArr[1];
                m = f(+dateArr[2]);
                d = f(+dateArr[3]);
                h = f(+dateArr[4]);
                min = f(+dateArr[5]);
            } else {
                var t = date.toDate(8);
                y = t.getFullYear();
                m = f(t.getMonth() + 1);
                d = f(t.getDate());
                h = f(t.getHours());
                min = f(t.getMinutes());
            }
        }
        switch (type) {
            case "yyyy-mm-dd":
                return [y + "-" + m + "-" + d, h + ":" + min];
                break;
            case "m月d日":
                return [m + "月" + d + "日", h + ":" + min];
                break;
            default:
                return [(m && d) ? (m + "-" + d) : "", (h && min) ? (h + ":" + min) : ""];
                break;
        }
    };
    /*-----End 定义变量，工具函数-----*/


    /*-----Begin 定义订单卡片类-----*/
    var Card = function (params) {
        //是否初始化过
        var isInited = false;

        //模板解析函数
        var template = null;

        //订单卡片的bizType
        var bizType = params.bizType;

        //订单卡片的按钮配置
        var btnConfig = params.handlerConfig;

        //处理订单按钮点击的事件
        var events = params.events;

        //订单卡片的时间配置
        var timeConfig = params.timeConfig;

        //代码运行环境
        var isInApp = !!cUtility.isInApp,//是否在app中
            isunlogin = MyctripCommon.isunlogin(bizType),//是否为非会员
            isYoung = cUtility.getAppSys() == "youth",//是否是青春版
            isTieYou = MyctripCommon.isTieYou();//是否是铁友

        //卡片模板的初始化操作（注册卡片类型的事件）
        var _init = function () {
            if (!isInited) {
                isInited = true;
                var pattern = '<script type=\"text\\/template\" id=\"' + bizType + '\">(((?!<\\/script>)[\\w\\W])*)<\\/script>',
                    regExp = RegExp(pattern);
                var result = regExp.exec(tempHtml);
                if (result) {
                    template = _.template(result[1]);
                }
                _handler();
            }
        };

        //注册卡片类型的事件
        var _trigger = function (method, e) {
            if (method && typeof events[method] === 'function') {
                events[method](e);
            }
        };

        //订单卡片的事件处理操作
        var _handler = function () {
            if (typeof params.handler === 'function') {
                params.handler.call(params);
            }
            var config = null,
                selector = '',
                action = '',
                handler = null,
                result = null,
                configs = $.extend({}, btnConfig, { 'order-cont': { action: '.detail' } });
            for (var i in configs) {
                if (configs.hasOwnProperty(i)) {
                    config = configs[i];
                    if (!(config instanceof Array)) {
                        config = [config];
                    }
                    for (var j = 0, len = config.length; j < len; j++) {
                        action = config[j]['action'];
                        result = /\w*\.(\w+)/.exec(action);
                        if (result && result[1]) {
                            action = result[1];
                            selector = '.' + bizType.toLowerCase() + ' .' + (config[j]['class'] || i);
                        }
                        handler = events[action];
                        if (handler && typeof handler === 'function') {
                            $(document).on('click', selector, handler);
                        }
                    }
                }
            }
        };

        //数据的预处理操作
        var _process = function (data) {
            if (!data) {
                return;
            }

            //如果订单卡片里提供了process方法，则先调用卡片的process
            if (typeof params.process === 'function') {
                params.process.call(params, data);
            }

            //聚合订单（全部订单、未支付订单、未出行订单、待评价订单）
            data.isAggregated = currentView.isAggregated;

            _processTime(data);

            _processButton(data);

            //如果订单卡片里提供了afterFilterData方法，在data处理完之后调用afterFilterData方法
            if (typeof params.afterFilterData === 'function') {
                params.afterFilterData.call(params, data);
            }
        };

        //根据卡片类型模板渲染每一个卡片
        var render = function (data) {
            var contentHtml = '';

            //预处理数据
            _process(data);

            contentHtml = template(data);

            return contentHtml;
        };

        //处理时间数据
        var _processTime = function (data) {
            var timeObj = data.field ? timeConfig[data.field] : timeConfig,
                timeIndexes = data.timeIndexes || [0, 0],
                entities = data[timeObj['entity']],
                timeItems = timeObj['collection'],
                timeRelate = timeObj['relate'] || false,
                timeItem = null,
                timeName = '',
                timeField = '',
                timeFormat = timeObj['format'],
                time = '';
            if (timeRelate) {//默认不显示年份,如果跨年则显示年份
                if (entities && entities[0]) {
                    var beginTime = entities[0][timeItems[0]].toDate(8),
                        endTime = entities[0][timeItems[1]].toDate(8);
                    if (beginTime instanceof Date && endTime instanceof Date) {
                        var beginYear = beginTime.getFullYear(),
                            endYear = endTime.getFullYear(),
                            nowYear = new Date().getFullYear();
                    }
                    var isShowFullYear = false;
                    if (beginYear && endYear) {
                        isShowFullYear = (beginYear == endYear) ? (endYear != nowYear) : true;
                    }
                    timeFormat = isShowFullYear ? 1 : timeFormat;
                }
            }
            for (var i = 0, len = timeIndexes.length; i < len; i++) {
                timeItem = timeItems[i];
                if (timeItem) {
                    if (typeof timeItem == 'string') {
                        timeName = timeField = timeItem;
                    } else {
                        timeName = timeItem.name || timeItem.field;
                        timeField = timeItem.field || timeItem.name;
                        timeFormat = timeItem.format || timeFormat;
                    }
                    timeFormat = !!timeFormat ? "yyyy-mm-dd" : "";
                    time = entities && entities[timeIndexes[i]] && entities[timeIndexes[i]][timeField] || '';
                    data[timeName] = formatDate(time, timeFormat);
                }
            }
            if (!!timeObj.booking && data.BookingDate) {
                data['BookingDate'] = formatDate(data.BookingDate, timeFormat);
            }
        };

        //处理操作数据
        var _processButton = function (data) {
            var btnActions = []; //筛选排序后的数据

            data.detail = "";//按钮处理(筛选排序)

            for (var i = 0, orderActions = data.OrderActions, len = orderActions.length; i < len; i++) {
                var actionCode = orderActions[i]['ActionCode'],
                    actUrl = orderActions[i]['ActionURLH5'];
                if (actionCode === 'Detail' || actionCode === 'ReadOrder' || actionCode === 'OrderDetailLink' || actionCode === 'ViewOrderDetail' || actionCode === 'ToDetail' || actionCode === 'OrderDetail' || actionCode === 'ViewOrderInfo') {//把detail跳转链接单独处理
                    data.detail = actUrl ? actUrl : '';
                }
                if (btnConfig && btnConfig.hasOwnProperty(actionCode)) {
                    var actions = btnConfig[actionCode] instanceof Array ? btnConfig[actionCode] : [btnConfig[actionCode]];//支持一个Code出现多个按钮
                    for (var j = 0; j < actions.length; j++) {
                        var act = actions[j];
                        //按钮外露逻辑
                        var isShowInApp = isInApp ? !!act.isShow[0] : !!act.isShow[1],//在H5||app中是否显示
                            isShowInUnlogin = isunlogin ? !!act.isShow[2] : true,//非会员是否显示
                            isShowInYoung = isYoung ? !!act.isShow[3] : true,//是否在青春版中显示（app）
                            isShowInTieYou = isTieYou ? !!act.isShow[4] : true;//铁友中是否显示

                        if (isShowInApp && isShowInUnlogin && isShowInYoung && isShowInTieYou) {
                            btnActions.push({
                                "code": actionCode,
                                "content": act['content'],
                                "rankid": act['rankid'],
                                "style": act['style'],
                                "action": act['action'],
                                "actUrl": actUrl,
                                "orderId": data.OrderID,
                                "bizType": bizType,
                                "class": act['class'] || actionCode
                            });
                        }
                    }
                }
            }
            btnActions.sort(function (a, b) { return b.rankid - a.rankid; }); //倒序

            //保存预处理好的按钮操作数据，需要重新布局按钮时从这里读数据
            data.actions = JSON.stringify(btnActions).replace(/\"/g, "'");

            data.btnhtml = _layoutButton(btnActions);
        };

        //布局订单卡片按钮
        var _layoutButton = function (btnActions) {
            var docLen = $(document).width();
            var menuLen = isShowSlideMenu ? $('#ctripmenu-wrap').width() + 10 : 0;
            var availableWidth = docLen - menuLen - 40, //最大可用于布局按钮的宽度
                moreActions = [], //未展现的在morebtn中展现
                tempL = [],
                tempR = [];

            //更多按钮处理（online环境下由于有足够的空间，不需要为更多订单做处理）
            if (!isOnline && btnActions.length) {
                var dl = btnActions.length;
                var p = dl - 1;//临界按钮在数组中的位置
                var BtnConfig = BTN_LEN_CNF;
                var ml = BTN_LEN_CNF[0];
                for (var i = 0; i < dl; i++) {
                    var l = btnActions[i].content.length;
                    LeftLen = availableWidth;
                    availableWidth -= BtnConfig[l];
                    if (availableWidth < 0) {
                        p = LeftLen - ml >= 0 ? i - 1 : i - 2;
                        break;
                    }
                }
                tempL = btnActions.slice(0, p + 1);
                if (p + 1 < dl) {//是否存在更多按钮
                    tempR = btnActions.slice(p + 1);
                    for (var i = 0; i < tempR.length; i++) {
                        moreActions.push({
                            key: tempR[i].code,
                            val: tempR[i].content,
                            action: tempR[i].action,
                            actUrl: tempR[i].actUrl
                        });
                    }
                    if (moreActions.length) {
                        var tmp = MORE_BTN_CNF;
                        tmp.more = moreActions;
                        tempL.unshift(tmp);
                        btnActions = tempL;
                    }
                }
            }

            return _renderButton(btnActions);
        };

        //渲染按钮HTML
        var _renderButton = function (btnActions) {
            var btnhtml = "";

            if (btnActions.length) {
                btnhtml += '<div class="order-ft">';
                for (var i = btnActions.length - 1; i >= 0; i--) {
                    var btnAction = btnActions[i];
                    if (btnAction) {
                        var buryId = btnAction.bizType + "_" + btnAction['class'] + "_" + btnAction.orderId,
                            h_id = btnAction['class'] !== 'btn-more' ? ' id="' + buryId + '"' : '',//埋点
                            h_class = ' class="' + (btnAction['style'] ? 'btn01 ' : 'btn02 ') + btnAction['class'] + '"',
                            h_code = btnAction['code'] ? ' data-code="' + btnAction['code'] + '"' : '',
                            h_action = btnAction['action'] ? ' data-action="' + btnAction['action'] + '"' : '',
                            h_more = btnAction['more'] ? " data-more='" + JSON.stringify(btnAction['more']) + "'" : '';

                        btnhtml += '<button' + h_id + h_class + h_code + h_action + h_more + '>' + btnAction['content'] + '</button>';
                    }
                }
                btnhtml += '</div>';
            }

            return btnhtml;
        };

        //返回订单卡片对象
        return {
            //卡片模板的初始化操作（注册卡片类型的事件）
            _init: _init,

            //注册卡片类型的事件
            _trigger: _trigger,

            //布局订单卡片按钮
            _layoutButton: _layoutButton,

            //根据当前数据渲染一条订单卡片
            render: render
        }
    };
    /*-----End 定义订单卡片类-----*/


    /*-----Begin 定义订单卡片工厂类-----*/
    var BaseCardFactory = (function () {

        //是否初始化过
        var isInited = false;

        //是否在Pad中初始化过
        var isInitedForPad = false;

        //缓存卡片模板，每种卡片模板只会被创建一次
        var cachedCards = {};

        //初始化
        var init = function () {
            if (!isInited) {
                isInited = true;

                //调用各个Card的init方法
                for (var i in cachedCards) {
                    if (cachedCards.hasOwnProperty(i)) {
                        cachedCards[i]._init();
                    }
                }

                //注册更多按钮点击事件
                $(document).on('click', '.order-ft .btn-more', _handleMore);
            }
        };

        //Pad中需要特殊处理的初始化方法
        var initForPad = function () {
            if (!isInitedForPad) {
                isInitedForPad = true;

                //注册Pad中特殊击事件
                $(document).on('click', '.operation-list li', _handleMorePad)
                           .on('click', '.orders-status-filter span', _handleSwitchPad);

                //注册Pad中切换横竖屏事件
                window.addEventListener('orientationchange', function (e) {
                    relayoutButton();

                    //修复iPad 7下横竖屏切换样式问题
                    if (currentView && currentView.bLoadDataError) {
                        currentView.hideWarning404();
                        currentView.showWarning404(function () {
                            currentView.hideWarning404();
                            currentView.showView();
                        });
                    }
                });
            }
        };

        //根据bizType获得订单卡片类
        var getCard = function (bizType) {
            if (bizType) {
                bizType = T_trans(bizType);//biztype转译，biztype不同规则相同。
                if (cachedCards[bizType]) {
                    return cachedCards[bizType];
                } else {
                    console.error('Please load the ' + bizType + ' type card file.'); //TODO
                }
            }
        };

        //获得当前view对象
        var getView = function () {
            return currentView;
        };

        //设置当前view对象
        var setView = function (view, bOnline) {
            currentView = view;

            if (typeof bOnline !== 'undefined' && bOnline === true) {
                isOnline = true;
            }
        };

        //渲染数据
        var render = function (data) {
            if (!currentView) {
                console.error('Please set currentView!');
                return;
            }
            data.viewType = currentView.viewType;

            //酒店非会员下发BizType
            if (!data.BizType) {
                data.BizType = currentView.bizType;
            }

            if (data && data.BizType) {
                data.orderType = T_trans(data.BizType, true);//酒店,火车票,机票卡片标识
                var card = this.getCard(data.BizType);
                if (card) {
                    try {
                        return card.render(data);
                    } catch (e) {
                        console.error(data.BizType + '订单数据异常:' + e);
                        return '';
                    }
                }
            }
        };

        //创建订单卡片模板实例
        var getInstance = function (params) {
            if (!params || !params.bizType || !params.handlerConfig || !params.events) {
                console.error('Missing parameter(s)');
            }
            var card = cachedCards[params.bizType];
            if (!card) {
                card = Card(params);
                cachedCards[params.bizType] = card;
            }
            return Card;
        };

        //处理更多按钮方法
        var _handleMore = function (e) {
            var self = currentView;
            var data = $(e.currentTarget).data("more");
            if (data.length) {
                if (isShowSlideMenu) {
                    _showMorePop(data, e);
                } else {
                    for (var i in data) {
                        data[i]['name'] = data[i]['val'];
                        delete data[i].val;
                    }
                    if (self.bottomPopup) {//释放资源
                        $('#' + self.bottomPopup.id).remove();
                        $('#' + self.bottomPopup.mask.id).remove();
                    }
                    self.bottomPopup = new UILayerList({
                        datamodel: {
                            list: data,
                            cancelText: '取消操作'
                        },
                        onItemAction: function (item) {
                            var actionStr = item.action,
                            actionArr = [],
                            bizType = null,
                            method = null,
                            card = null;
                            if (actionStr) {
                                actionArr = actionStr.split('.');
                                if (actionArr.length === 2) {
                                    bizType = actionArr[0];
                                    method = actionArr[1];
                                    card = getCard(bizType);
                                    if (card) {
                                        $(e.currentTarget).data('code', item.key);
                                        card._trigger(method, e);
                                    }
                                }
                            }
                            this.hide();
                        }
                    });
                    self.bottomPopup.show();
                }
            }
        };

        //获取按钮点击时需要跳转到url
        var getJumpUrl = function (e, code) {
            var url = '',
                target = $(e.currentTarget);
            if (target.hasClass('order-cont')) {
                url = target.data('url') || '';
            } else if (target.data('url')) {
                url = target.data('url');
            } else {
                var code = code || target.data('code'),
                    actions = target.closest("li").data("actions"),
                    action = null;
                if (actions) {
                    actions = JSON.parse(actions.replace(/\'/g, '"'));
                    for (var i = 0, len = actions.length; i < len; i++) {
                        action = actions[i];
                        if (action && action['code'] == code) {
                            url = action['actUrl'] || '';
                            break;
                        }
                    }
                }
            }
            return url;
        };

        //跳转页面通用方法
        var jump = function (e, url, page, bOldWay) { // @param {boolean} bOldWay 是否是旧的打开方式（不新开webview的Guider.cross）
            var self = currentView,
                result = null,
                page = page || 'index.html#',
                reg = /.*(\/webapp\/)(\w*)(\/)(.*)/;
            url = url || getJumpUrl(e);
            if (url === '' || typeof url === 'undefined') { return; }
            var result = reg.exec(url.toLowerCase());
            MyctripCommon.apply({
                callback: function () {
                    if (result) {
                        var href = result[1] + result[2] + result[3] + result[4];
                        href += href.indexOf('?') > -1 ? '&' : '?';
                        Lizard.jump(href + self.frompageurl);
                    }
                },
                onlineCallback: function () {
                    location.href = url;
                },
                hybridCallback: function () {
                    if (url.indexOf('ctrip://') === 0) {
                        return cHybridShell.Fn('open_url').run(url, 1);
                    } else {
                        if (result) {
                            var param = result[4];
                            //为某些不规范的url做兼容
                            (param.indexOf(page) === 0 && (page = '')) || (param.indexOf(page) === -1 && param[0] === '#' && (page = 'index.html'));
                            param = page + param;
                            //有些BU可能不正常跳转
                            if (bOldWay) {
                                //走老的跳转方式
                                param += param.indexOf('?') > -1 ? '&' : '?';
                                return Guider.cross({ path: result[2], param: param + self.frompageurl });
                            }
                            Lizard.jump(result[1] + result[2] + '/' + param, { targetModel: 4 });
                        } else {
                            location.href = url;
                        }
                    }
                }
            });
        };

        //删除订单通用方法
        var del = function (e, bizType, callback) {
            var self = currentView;
            var delModel = MyCtripModel.HideOrderModel.getInstance(),
                orderId = $(e.currentTarget).closest("li").data('oid'),
                hideOrderInfos = {
                    BizType: bizType,
                    OrderIDs: [orderId]
                };
            delModel.setParam({ HideOrderInfos: hideOrderInfos });

            self.showConfirm({
                datamodel: {
                    content: '<p style="padding-bottom:10px;font-weight:bold">删除订单后将无法还原</p>删除不等于取消，相关积分、返现等也可能受影响。确定完全删除此笔订单？',
                    btns: [
                        { name: '点错了', className: 'cui-btns-miss' },
                        { name: '删除', className: 'cui-btns-del' }
                    ]
                },
                events: {
                    'click .cui-btns-miss': 'missAction',
                    'click .cui-btns-del': 'delAction'
                },
                missAction: function () {
                    this.hide();
                },
                delAction: function () {
                    this.hide();
                    self.showLoading();
                    delModel.excute(function (data) {
                        self.hideLoading();
                        if (callback && typeof callback === 'function') {
                            if (callback(data)) {
                                return;
                            }
                        }
                        if (data && data.Result && data.Result.ResultCode == 0) {
                            self.showToast({
                                datamodel: {
                                    content: '删除成功'
                                },
                                hideAction: function () {
                                    self.onShow();
                                }
                            });
                        } else {
                            self.showToast('删除失败，请稍后再试');
                        }
                    }, function (e) {
                        self.hideLoading();
                        self.showToast('删除失败，请稍后再试');
                    }, true, self, function () {
                        self.hideLoading();
                        self.showToast('删除失败，请稍后再试');
                    });
                }
            });
        };

        //取消订单通用方法
        var cancel = function (e, cancelModel, callback) {
            var self = currentView;
            self.showConfirm({
                datamodel: {
                    content: '确定取消订单吗？',
                    btns: [
                        { name: '点错了', className: 'cui-btns-miss' },
                        { name: '取消订单', className: 'cui-btns-sure' }
                    ]
                },
                events: {
                    'click .cui-btns-sure': 'sureAction',
                    'click .cui-btns-miss': 'missAction'
                },
                sureAction: function () {
                    this.hide();
                    self.showLoading();
                    cancelModel.excute(function (data) {
                        self.hideLoading();
                        if (typeof callback === 'function') {
                            callback(data);
                        }
                    }, function (error) {
                        self.hideLoading();
                        self.showToast("取消失败，请稍后再试");
                    }, true, self, function () {
                        self.hideLoading();
                        self.showToast("取消失败，请稍后再试");
                    });
                },
                missAction: function () {
                    this.hide();
                }
            });
        };

        //支付订单通用方法
        var pay = function (e, orderType, callback) {
            var self = currentView,
                orderId = $(e.currentTarget).closest("li").data('oid'),
                payModel = MyCtripModel.OrderPaymentModel.getInstance(),
                from = self.frompageurl,
                result = /(.*\/webapp\/myctrip\/)(.*)/.exec(decodeURIComponent(self.frompageurl));

            //TODO，本期为支付跳转做兼容，后面需要去掉
            if (result) {
                from = result[1] + 'index.html#' + result[2];
            }
            //online 直接做跳转
            if (isOnline) {
                return BaseCardFactory.jump(e);
            }

            payModel.setParam({
                PaymentOrderInfos: [{ BizType: orderType, OrderIDs: [orderId] }],
                From: location.href,
                Platform: cUtility.isInApp ? "Hybrid" : "H5"
            });
            self.showLoading();
            payModel.excute(
                function (data) {
                    self.hideLoading();
                    if (data && data.Result && data.Result.ResultCode == 0) {
                        if (data.PaymentInfos && data.PaymentInfos[0] && data.PaymentInfos[0].PaymentPagePath) {
                            var itemObj = data.PaymentInfos[0];
                            data.paymentUrl = itemObj.PaymentPagePath;
                            //为签证做兼容（直连支付页面）
                            if (orderType == 'Visa' && !itemObj.Token) {
                                return Guider.jump({ url: data.paymentUrl, targetModel: 'h5', title: '' });
                            }
                            if (itemObj.Oid) {
                                var symbol = data.paymentUrl.indexOf('?') > -1 ? '&' : '?';
                                data.paymentUrl = data.paymentUrl + symbol + "oid=" + itemObj.Oid;
                            }

                            if (itemObj.BusType) {
                                var symbol = data.paymentUrl.indexOf('?') > -1 ? '&' : '?';
                                data.paymentUrl = data.paymentUrl + symbol + "bustype=" + itemObj.BusType;
                            }

                            if (itemObj.Token) {
                                var token = encodeURIComponent(cUtilityCrypt.Base64.encode(itemObj.Token));
                                var symbol = data.paymentUrl.indexOf('?') > -1 ? '&' : '?';
                                data.paymentUrl = data.paymentUrl + symbol + "token=" + token;
                            }

                            if (itemObj.Extend) {
                                var extend = encodeURIComponent(cUtilityCrypt.Base64.encode(itemObj.Extend));
                                var symbol = data.paymentUrl.indexOf('?') > -1 ? '&' : '?';
                                data.paymentUrl = data.paymentUrl + symbol + "extend=" + extend;
                            }

                            if (callback && typeof callback == 'function') {
                                if (callback(data)) {
                                    return;
                                }
                            }

                            if (cUtility.isInApp) {
                                var reg = /(.*)(\/)(.*)(\/)(index.html.*)/;
                                var hybridpayurl = reg.exec(data.paymentUrl);
                                var method = Guider.cross;
                                var nativePayBUs = ['TopShop', 'QiChe', 'GlobalBuy', 'Activity', 'Piao', 'Tuan', 'VacationInsurance', 'Mall', 'Train', 'Visa', 'Lipin'];//接入Native支付的BU
                                if (nativePayBUs.indexOf(orderType) > -1 || (orderType === 'Vacation' && itemObj.Token)) {//团队游的单笔支付订单需要接Native支付
                                    method = Guider.pay.callPay;
                                }
                                method({ path: hybridpayurl[3], param: hybridpayurl[5] + "&" + self.frompageurl });
                            } else {
                                self.jump(data.paymentUrl + "&" + self.frompageurl);
                            }
                        } else {
                            self.showToast('加载失败，请稍后再试');
                        }
                    } else {
                        self.showMessage(data.Result.ResultMsg || '加载失败，请稍后再试');
                    }
                },
                function (data) {
                    self.hideLoading();
                    self.showMessage(data.Result.ResultMsg || '加载失败，请稍后再试');
                },
                true,
                self,
                function (data) {
                    self.hideLoading();
                    self.showMessage(data.Result.ResultMsg || '加载失败，请稍后再试');
                }
            );
        };
        //分享通用方法
        var share = function (item) {
            var title = item && item.title || '推荐携程旅行',//邮件title
                text = item && item.text || '',//文本内容
                imgUrl = item && item.imageUrl || '',//图片链接
                linkUrl = item && item.linkUrl || '';//分享链接
            var commonOptios = [
                '客户端下载地址：http://m.ctrip.com/m/c925',
                '快来@携程旅行，开启自己的旅程吧！',
                '客服电话：400-821-6666，'
            ];
            var i = 0,
                increment = '';
            while ((text + increment + commonOptios[i]).length < 141 && i < 3) {
                increment = commonOptios[i] + increment;
                i++;
            }
            text += increment;

            Guider.apply({
                hybridCallback: function () {
                    CtripShare.wrap_call_default_share(imgUrl, title, text, linkUrl);
                },
                callback: function () {
                    console.error('H5没有分享组件！！');
                }
            });
        };
        //检查非登录状态下离线订单，不能跳转详情页（跳转详情页是非下发地址时需要调用）
        var checkOfflineJump = function () {
            if (currentView.viewType === 'allorders' && currentView.bOffline && !currentView.bLogin) {
                return true;
            }
            return false;
        }

        //重新布局订单卡片按钮(横竖屏切换时屏幕宽度变化，可显示的按钮数不同)
        var relayoutButton = function (selector) {
            if (!isShowSlideMenu) {
                return;
            }

            if (!selector) {
                selector = currentView.$el.find('.order-list-item');
            }

            for (var i = 0, len = selector.length; i < len; i++) {
                var item = selector.eq(i),
                    actions = item && item.data('actions'),
                    btnhtml = '',
                    card = null;
                if (actions && actions.length >= 5) {//TODO，多于或等于5个按钮时才做处理
                    card = getCard(actions[0].bizType);
                    if (card) {
                        btnhtml = card._layoutButton(actions);
                        if (btnhtml) {
                            item.find('.order-ft').remove();
                            item.append(btnhtml);
                        }
                    }
                }
            }
        };

        var _showMorePop = function (items, e) {
            if (items && items.length) {
                var moreHtml = '<div class="pop-myctrip"><ul class="operation-list">',
                    item = null,
                    more = null,
                    offset = $(e.currentTarget).offset(),
                    x = offset.left,
                    y = offset.top;

                for (var i = 0, len = items.length; i < len; i++) {
                    item = items[i];
                    moreHtml += '<li data-action="' + item.action + '" data-url="' + item.actUrl + '">' + item.val + '</li>';
                }
                moreHtml += '</ul></div>';
                more = $(moreHtml);
                x -= 267;
                y += 47;
                more.css({ 'position': 'absolute', 'z-index': 9999, 'width': '320px', 'left': x + 'px', 'top': y + 'px' }).appendTo($(document.body));
                var mask = new UIMask();
                mask.$el.addClass('myctrip-mask');
                mask.show();
                $('#' + mask.id).click(function () {
                    $(this).remove();
                    more.remove();;
                });
            }
        };

        var _handleMorePad = function (e) {
            var actionStr = $(e.currentTarget).data('action'),
                actionArr = [],
                bizType = null,
                method = null,
                card = null;
            if (actionStr) {
                actionArr = actionStr.split('.');
                if (actionArr.length === 2) {
                    bizType = actionArr[0];
                    method = actionArr[1];
                    card = getCard(bizType);
                    if (card) {
                        card._trigger(method, e);

                        //删除弹出浮层
                        $(e.currentTarget).parents('.pop-myctrip').remove();
                        $('body').children('.myctrip-mask').remove();
                    }
                }
            }
        };

        var _handleSwitchPad = function (e) {
            var target = $(e.currentTarget);
            if (!target.hasClass('current')) {
                currentView.jump(target.data('url'));
            }
        };

        //返回订单卡片工厂类BaseCardFactory对象
        return {
            //初始化方法
            init: init,

            //Pad中需要特殊处理的初始化方法
            initForPad: initForPad,

            //获取缓存的卡片模板
            getCard: getCard,

            //获取当前view对象
            getView: getView,

            //设置当前view对象
            setView: setView,

            //渲染数据
            render: render,

            //创建订单卡片模板实例
            getInstance: getInstance,

            //获取页面跳转到URL
            getJumpUrl: getJumpUrl,

            //页面跳转操作
            jump: jump,

            //取消订单操作
            cancel: cancel,

            //删除订单操作
            del: del,

            //支付订单操作
            pay: pay,

            //分享订单操作
            share: share,

            //检查是否是全部订单页中未登录状态下的离线订单
            checkOfflineJump: checkOfflineJump,

            //重新布局订单卡片按钮
            relayoutButton: relayoutButton
        }
    })();
    /*-----End 定义订单卡片工厂类-----*/

    return BaseCardFactory;
});
