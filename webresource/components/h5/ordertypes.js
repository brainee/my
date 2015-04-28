define(['cUtilCommon', 'MyCtripModel'], function (cUtilCommon, MyCtripModel) {
    //横竖屏切换时，重新设置弹出层高度
    window.onorientationchange = function (e) {
        var container = $('#orderlist-menu');
        if (container.css('display') === 'block') {
            container.find('.cui-select-view').css('max-height', document.body.clientHeight - (isShowSlideMenu ? 100 : 50) - (Lizard.isHybrid ? 0 : 30));
        }
    };

    return {
        /**
         * 初始化操作，把HTML插入到页面中
         */
        append: function (view, orderTypes) {
            var self = this,
                html = '',
                orderType = null,
                additional = '';

            //若已经存在，则不用再插入DOM（单页应用不刷新加载会用到）
            if ($('#orderlist-menu').length) {
                return;
            }

            html = '<div id="orderlist-menu" class="cui-layer" style="display:none;padding:0"><div class="dropdown-group-modal" style="z-index:1001"><div class="dropdown-group-bd"><div class="ordercenter-list"><ul class="cui-select-view" style="overflow:auto;">';
            for (var i = 0, len = orderTypes.length; i < len; i++) {
                orderType = orderTypes[i];
                if (cUtilCommon.isInApp && orderType.name === '火车票订单') {
                    additional = '<span class="placeholder">支持12306订单</span>';
                } else {
                    additional = '';
                }
                html += '<li class="' + orderType.classname + '" data-biztype="' + orderType.biztype + '" data-href="' + orderType.url + '">' + orderType.name + '<span></span>' + additional + '</li>';
            }
            html += '</ul></div></div></div></div><div id="orderlist-layer" style="position:fixed;top:0;left:0;z-index:1000;width:100%;height:110%;background-color:rgba(0,0,0,0.6);display:none"></div>';
            $('body').append(html);
            $('#orderlist-menu li').on('click', function (e) {
                var element = $(e.currentTarget),
                    url = element.data('href');
                self.hide();
                Lizard.jump(Lizard.appBaseUrl + url);
            });
            $('#orderlist-layer').on('touchmove', function (e) {
                e.preventDefault();
            }).on('click', self.hide);
        },

        /**
         * 显示订单选择弹层
         */
        show: function (view, e, OrderNumbersModel) {
            var left = 0,
                bShowMenu = isShowSlideMenu || false,
                top = cUtilCommon.isInApp ? (bShowMenu ? top = '50px' : top = '13px') : (bShowMenu ? top = '94px' : top = '50px'),
                maxHeight = document.body.clientHeight - (bShowMenu ? 100 : 50) - (Lizard.isHybrid ? 0 : 30),
                layer = $('#orderlist-layer'),
                container = $('#orderlist-menu'),
                elements = container.find('li'),
                result = /\/webapp\/myctrip\/.*(orders\/\w+)/.exec(location.href);

            if (container.css('display') === 'none') {
                if (bShowMenu) {
                    var offset = $(e.currentTarget).offset();
                    left = $(e.currentTarget).offset().left - parseInt((320 - offset.width) / 2) - 5;
                } else {
                    left = (document.body.clientWidth - 320) / 2;
                }

                elements.removeClass('on');
                if (result) {
                    elements.filter('[data-href*="' + result[1] + '"]').addClass('on');
                }
                layer.show();
                container.css({
                    'left': left,
                    'top': top,
                    'display': 'block'
                }).addClass('cm-up-in').find('.cui-select-view').css('max-height', maxHeight);
                setTimeout(function () {
                    container.removeClass('cm-up-in');
                }, 300);

                this._loadData(view, OrderNumbersModel);
            } else {
                this.hide();
            }
        },

        //隐藏订单选择弹层
        hide: function () {
            var container = $('#orderlist-menu'),
                layer = $('#orderlist-layer');
            layer.hide();
            container.addClass('cm-up-out');
            setTimeout(function () {
                container.removeClass('cm-up-out').hide();
            }, 300);
        },

        /**
         * 加载各订单数量数据，首次点击时加载
         */
        _loadData: function (view, OrderNumbersModel) {
            if (!view.bLoadedOrdersCount) {
                OrderNumbersModel.excute(function (data) {
                    if (data && data.ResponseStatus && data.ResponseStatus.Ack === 'Success') {
                        view.bLoadedOrdersCount = true;
                        var orderNumbersObj = {},
                            orderNumbers = data.OrderNumbers,
                            orderNumber = null,
                            elements = $('#orderlist-menu li'),
                            biztype = '',
                            count = '';
                        if (orderNumbers && orderNumbers.length > 0) {
                            for (var i = 0, len = orderNumbers.length; i < len; i++) {
                                orderNumber = orderNumbers[i];
                                if (orderNumber.BizType && parseInt(orderNumber.OrderNum, 10) > 0) {
                                    count = orderNumber.OrderNum;
                                    biztype = orderNumber.BizType;
                                    //火车票的国内和国际的数据分开下发的，此处拼接在一起
                                    if (biztype.indexOf('Train') === 0) {
                                        orderNumbersObj['Train'] = orderNumbersObj['Train'] ? orderNumbersObj['Train'] + count : count;
                                    } else {
                                        orderNumbersObj[biztype] = count;
                                    }
                                }
                            }
                            elements.each(function (index, element) {

                                biztype = $(this).data('biztype');

                                var isUnion = biztype.indexOf(",") > -1 ? true : false;

                                if (isUnion == false) {
                                    if (orderNumbersObj.hasOwnProperty(biztype)) {
                                        $(this).find('span').eq(0).html('（' + orderNumbersObj[biztype] + '）');
                                    }
                                }
                                else {
                                    var bizArray = biztype.split(",");
                                    var bizOrderCount = 0;
                                    $.each(bizArray, function (i, o) {
                                        if (orderNumbersObj.hasOwnProperty(o)) {
                                            bizOrderCount += orderNumbersObj[o];
                                        }
                                    });
                                    $(this).find('span').eq(0).html('（' + bizOrderCount + '）');
                                }
                            });
                        }
                    }
                }, null, true, view, null);
            }
        }
    }
});