define(['cPageView', 'MyCtripModel', 'cMemberService', 'cUIInputClear', 'text!template', 'myctripCommon', 'cUtilCommon'], function (cPageView, MyCtripModel, Member, InputClear, tempHtml, MyctripCommon, cUtilCommon) {
    var searchModel = null;
    var View = cPageView.extend({
        pageid: '231039',
        hpageid: '231039',
        searchFrom: '',
        queries: [],
        filters: {
            allorders: {
                statuses: [
                    { code: 'NULL', name: '不限' },
                    { code: 'Uncommitted', name: '未提交/待提交' },
                    { code: 'WaitPay', name: '待支付' },
                    { code: 'Dealt', name: '已成交/已出票' },
                    { code: 'ReturnTicket', name: '退票' }
                ]
            },
            hotelorderlist: {
                types: [
                    { code: 'NULL', name: '不限' },
                    { code: 'HotelDomestic', name: '国内' },
                    { code: 'HotelInternational', name: '海外' },
                    { code: 'HotelMask', name: '惠选' }
                ],
                statuses: [
                    { code: 'NULL', name: '不限' },
                    { code: 'Uncommit', name: '未提交' },
                    { code: 'Confirming', name: '确认中' },
                    { code: 'Confirmed', name: '已确认' },
                    { code: 'Completed', name: '已成交' },
                //                    { code: 'Payed', name: '已付款' },
                    {code: 'Cancelled', name: '已取消' }
                ]
            },
            flightorderlist: {
                types: [
                    { code: 'NULL', name: '不限' },
                    { code: 'FlightDomestic', name: '国内' },
                    { code: 'FlightInternational', name: '国际' }
                ],
                statuses: [
                    { code: 'NULL', name: '不限' },
                    { code: 'Ticketing', name: '出票中' },
                    { code: 'Ticketed', name: '已出票' },
                    { code: 'UnsubcribePart', name: '部分退票' },
                    { code: 'UnsubcribeAll', name: '全部退票' },
                    { code: 'Cancelling', name: '取消申请中' },
                //                    { code: 'Uncommit', name: '待提交' },
                    {code: 'Cancelled', name: '已取消' }
                ]
            }
        },
        filter: {
            type: 'NULL',
            status: 'NULL'
        },
        events: {
            'click .tab-model li': 'doSwitchAction',
            'click .search-list li': 'doFilterAction',
            'click .g_btn_s': 'doSearchAction',
            'input .txt_order': 'doCheckAction'
        },
        onCreate: function () {
            
        },
        onShow: function () {
            this.bShowMenu = cPublic.ctripMenu({ show: true, buName: 'order' });

            $('body')[0].scrollTop = 0; //Iphone下Chrome有时会向下滚动

            var self = this;
            this.getQueries();

            this.headerview.set({
                title: "查找订单",
                back: true,
                view: self,
                tel: null,
                home: null,
                events: {
                    returnHandler: function () {
                        var to = 'orders/';
                        if (self.referrer == 'orders/' + self.searchFrom) {
                            to += self.searchFrom + '?flag=nocache';
                        } else if (self.referrer == 'orders/searchresult') {
                            var query = location.href.indexOf('?') > -1 ? location.href.slice(location.href.indexOf('?')) : '';
                            if (query) {
                                if (query.indexOf('flag=nocache') === -1) {
                                    query += ',flag=nocache';
                                }
                            } else {
                                query += '?flag=nocache';
                            }
                            to += 'searchresult' + query;
                        } else {
                            to += self.searchFrom;
                        }
                        Lizard.goTo(Lizard.appBaseUrl + to);
                    }
                }
            });

            var statuses = [], types = [];
            this.searchFrom = this.queries['searchfrom'];
            this.filter.type = 'NULL';
            this.filter.status = 'NULL';
            searchModel = MyCtripModel.OrdersSearchModel.getInstance();
            searchModel.param = {
                'ClientVersion': searchModel.param.ClientVersion,
                'Channel': searchModel.param.Channel,
                'OrderStatusClassify': 'All',
                'PageIndex': 1
            };
            switch (this.searchFrom) {
                case 'allorders':
                    statuses = this.filters.allorders.statuses;
                    break;
                case 'hotelorderlist':
                    types = this.filters.hotelorderlist.types;
                    statuses = this.filters.hotelorderlist.statuses;
                    break;
                case 'flightorderlist':
                    types = this.filters.flightorderlist.types;
                    statuses = this.filters.flightorderlist.statuses;
                    break;
                default:
                    this.searchFrom = 'allorders';
                    statuses = this.filters.allorders.statuses;
                    break;
            }
            var byid = this.queries['byid'];
            var orderid = this.queries['orderid'];
            var type = this.queries['type'];
            var status = this.queries['status'];
            if (type) {
                for (var i = 0, len = types.length; i < len; i++) {
                    if (types[i].code.toLowerCase() == type.toLowerCase()) {
                        type = types[i].code;
                        break;
                    }
                }
                type = i == len ? 'NULL' : type;
            }
            if (status) {
                for (var i = 0, len = statuses.length; i < len; i++) {
                    if (statuses[i].code.toLowerCase() == status.toLowerCase()) {
                        status = statuses[i].code;
                        break;
                    }
                }
                status = i == len ? 'NULL' : status;
            }
            this.filter.type = type || 'NULL';
            this.filter.status = status || 'NULL';

            var result = /<script type=\"text\/template\" id=\"searchTpl\">(((?!<\/script>)[\w\W])*)<\/script>/.exec(tempHtml),
                template = result && result[1] || '',
                content = _.template(template)({ types: types, statuses: statuses, filter: this.filter });
            this.$el.html(content);
            if (this.searchFrom == 'allorders') {
                this.$el.find('.tab-model li').eq(0).text('按状态');
                this.$el.find('.search-list.status').css('margin-top', '20px').prev('.search-title').hide();
            }

            //有输入后输入框最右边显示X按钮
            InputClear(this.$el.find('#order_field'));

            if (this.bShowMenu) {
                this.$el.find('.tab-model').css('position', 'relative');
            }

            this.showView();
        },
        showView: function () {
            var self = this;
            var from = "from=" + encodeURIComponent("/webapp/myctrip/orders/search?searchfrom=" + this.searchFrom);
            if (MyctripCommon.checkLogin() !== 1) {
                var callback = $.proxy(self.onShow, self);
                Member.memberLogin({ param: from, callback: callback });
            }
        },
        doSwitchAction: function (e, target) {
            var target = target || $(e.target),
                parent = target.parent(),
                index = target.parent().children().index(target);
            target.siblings().removeClass("tab-current");
            target.addClass("tab-current");
            this.$el.find('.search').hide().eq(index).show();
            this.$el.find('.txt_order').val('');
            this.$el.find('.g_btn_s.order').addClass('g_btns_disable');
            var lists = this.$el.find('.search-list');
            for (var i = 0, len = lists.length; i < len; i++) {
                lists.eq(i).find('li').removeClass('current').eq(0).addClass('current');
            }
            this.filter.type = 'NULL';
            this.filter.status = 'NULL';
            if (index === 1) {
                $('.txt_order').focus();
            }
        },
        doFilterAction: function (e) {
            var target = $(e.target),
                parent = target.parent(),
                code = target.data('code');
            parent.find('li').removeClass("current");
            target.addClass("current");
            if (parent.hasClass('type')) {
                this.filter.type = code;
            } else if (parent.hasClass('status')) {
                this.filter.status = code;
            }
        },
        doCheckAction: function (e) {
            var orderId = $.trim($(e.target).val()),
                searchBtn = $(e.target).closest('.search').find('.g_btn_s');
            if (orderId.length > 0) {
                searchBtn.removeClass('g_btns_disable');
            } else {
                searchBtn.addClass('g_btns_disable');
            }
        },
        doSearchAction: function (e) {
            if ($(e.currentTarget).hasClass('g_btns_disable')) {
                return;
            }
            var self = this,
                to = 'orders/searchresult?searchfrom=' + self.searchFrom;
            if ($(e.target).hasClass('type')) {
                to += ',byid=false' + (self.filter.type == 'NULL' ? '' : ',type=' + self.filter.type) + (self.filter.status == 'NULL' ? '' : ',status=' + self.filter.status); //从详情页跳回到搜索页时，如果使用view.getQuery()获取from参数，参数中的&及后面的参数会被过滤掉，所以用，代替
                self.gotoSearch(to);
            } else if ($(e.target).hasClass('order')) {
                var orderId = $.trim(this.$el.find('.txt_order').val());
                to += ',byid=true,orderid=' + orderId;
                if (!orderId || !/^[0-9]+$/.test(orderId)) {
                    this.showMessage('订单号输入有误，请重新输入。');
                    return;
                }
                searchModel.param.PageIndex = 1;
                delete searchModel.param.BookingDateTime;
                searchModel.setParam('OrderIDs', orderId);
                self.showLoading();
                searchModel.excute(function (data) {
                    self.hideLoading();
                    if (data && data.Result && data.Result.ResultCode == 0 && data['OrderEnities'] && data['OrderEnities'].length > 0) {
                        self.gotoSearch(to);
                    } else {
                        self.emptyAlert(orderId);
                    }
                }, function (err) {
                    self.hideLoading();
                    self.emptyAlert(orderId);
                }, true, this, function (err) {
                    self.hideLoading();
                    self.emptyAlert(orderId);
                });
            }
        },
        onHide: function () {
            delete searchModel.param.OrderIDs;
        },
        getQueries: function () {
            var queryStr = location.href.slice(location.href.indexOf('?') + 1);
            var queryArr = queryStr.split('&');
            var query = '';
            var tempArr = null;
            var temp = '';
            this.queries = [];
            for (var i = 0, len = queryArr.length; i < len; i++) {
                query = queryArr[i];
                if (query.indexOf(',') > -1) {
                	tempArr = query.split(',');
                	for (var j = 0, len1 = tempArr.length; j < len1; j++) {
                		temp = tempArr[j].split('=');
		                if (temp.length === 2) {
		                    this.queries[temp[0].toLowerCase()] = temp[1];
		                }
                	}
                } else {
					temp = query.split('=');
	                if (temp.length === 2) {
	                    this.queries[temp[0].toLowerCase()] = temp[1];
	                }
                }
            }
        },
        gotoSearch: function (to) {
            Lizard.jump(Lizard.appBaseUrl + to);
        },
        emptyAlert: function (orderid) {
            this.showMessage('您没有编号为' + orderid + '的订单');
        }
    });
    return View;
});