define(['commonlist', 'MyCtripModel', 'cUtilCommon'], function (CommonListFactory, MyCtripModel, cUtilCommon) {
    return CommonListFactory.getInstance({
        pageid: '',
        bizType: '',
        viewType: 'searchresult',
        listModel: null,
        queries: [],
        byId: false,
        bCustomizeHead: true,
        onShow: function (self) {
            self.getQueries(self);
            self.byId = self.queries['byid'] == 'true' ? true : false;
            self.orderId = self.queries['orderid'];
            var searchFrom = self.queries['searchfrom'];
            var type = self.queries['type'];
            var status = self.queries['status'];
            self.listModel = MyCtripModel.OrdersSearchModel.getInstance();
            self.listModel.param = {
                'Channel': self.listModel.param.Channel,
                'ClientVersion': self.listModel.param.ClientVersion,
                'OrderStatusClassify': 'All',
                'PageIndex': 1
            };
            switch (searchFrom) {
                case 'allorders':
                    break;
                case 'hotelorderlist':
                    if (!self.byId) {
                        if (type == 'HotelDomestic') {
                            self.listModel.setParam('OrderTypes', ['Domestic']);
                        } else if (type == 'HotelInternational') {
                            self.listModel.setParam('OrderTypes', ['International']);
                        } else if (type == 'HotelMask') {
                            self.listModel.setParam('OrderTypes', ['Mask']);
                        }
                    }
                    self.bizType = 'Hotel';
                    break;
                case 'flightorderlist':
                    if (!self.byId) {
                        if (type == 'FlightDomestic') {
                            self.listModel.setParam('OrderTypes', ['Domestic']);
                        } else if (type == 'FlightInternational') {
                            self.listModel.setParam('OrderTypes', ['International']);
                        } else { }
                    }
                    self.bizType = 'Flight';
                    break;
                default:
                    searchFrom = 'allorders';
                    break;
            }
            self.frompageurl = Lizard.appBaseUrl + 'orders/searchresult?searchfrom=' + searchFrom;
            self._showHead('查找结果');
            if (self.byId) {
                if (self.orderId) {
                    self.listModel.setParam('OrderIDs', self.orderId);
                    if (searchFrom == 'allorders') {
                        self.listModel.setParam('TimeScope', 0);
                    }
                    self.frompageurl += ',byid=true,orderid=' + self.orderId;
                } else {
                    self.frompageurl += ',byid=false';
                }
            } else {
                //从详情页跳回到搜索页时，如果使用view.getQuery()获取from参数，参数中的&及后面的参数会被过滤掉，所以用，代替
                self.frompageurl += ',byid=false' + (type ? ',type=' + type : '') + (status ? ',status=' + status : '');
                status && self.listModel.setParam('OrderStatuses', status);
            }
            self.frompageurl = 'from=' + encodeURIComponent(self.frompageurl);
            var flag = self.queries["flag"];
            if (self.referrer == "orders/search" && flag == "nocache") {
                return true;
            }
        },
        onHide: function (self) {
            delete self.listModel.param.OrderTypes;
            delete self.listModel.param.TimeScope;
            delete self.listModel.param.BookingDateTime;
            delete self.listModel.param.OrderStatuses;
            delete self.listModel.param.OrderStatusClassify;
            delete self.listModel.param.OrderIDs;
        },
        onAfterRequest: function (self, data, bFirst) {
            if (bFirst) {
                self.elsBox.lstbox.empty();
            }
            if (data && data.Result && data.Result.ResultCode == 0) {
                if (bFirst && data.TotalCount > 0) {
                    self._showHead('查找结果（' + data.TotalCount + '）');
                }
                var items = data[self.entityName];
                if (items) {
                    if (self.byId && self.orderId) {
                        items = items.slice(0,1);
                        data[self.entityName] = items;
                    }
                    var bAllSearch = self.entityName == 'OrderEnities' ? true : false;
                    for (var i = 0, len = items.length; i < len; i++) {
                        items[i].bAllSearch = bAllSearch;
                    }
                }
            } else if (data && data.Result && (data.Result.ResultCode == -1 || data.Result.ResultCode == -2)) {
                self.$el.removeClass('order-bg');
                self.elsBox.lstbox.append('<div class="search-noresult"><i class="i-search-noresult"></i><p>暂时没有相关订单，请修改条件重新查找</p></div>');
            }
        },
        onError: function (self, error, bServerError, bFirst) {
            if (bFirst) {
                self.elsBox.lstbox.empty();
            }
        },
        _showHead: function(title) {
            var self = this;
            if (!this.isOnline) {
                self.headerview.set({
                    title: title,
                    back: true,
                    view: self,
                    events: {
                        returnHandler: function () {
                            var back = Lizard.appBaseUrl;
                            var searchFrom = self.queries['searchfrom'];
                            if (searchFrom == 'allorders' || searchFrom == 'hotelorderlist' || searchFrom == 'flightorderlist') {
                                back += 'orders/' + searchFrom;
                            }
                            Lizard.goTo(back);
                        }
                    }
                });
            }
        },
        getQueries: function (self) {
            var transformedParams = { //框架会自动把参数值转换成小写，后端查询时需要大小写匹配
                uncommitted: 'Uncommitted',
                waitpay: 'WaitPay',
                dealt: 'Dealt',
                returnticket: 'ReturnTicket',
                hoteldomestic: 'HotelDomestic',
                hotelinternational: 'HotelInternational',
                hotelmask: 'HotelMask',
                uncommit: 'Uncommit',
                confirming: 'Confirming',
                confirmed: 'Confirmed',
                completed: 'Completed',
                cancelled: 'Cancelled',
                flightdomestic: 'FlightDomestic',
                flightinternational: 'FlightInternational',
                ticketing: 'Ticketing',
                ticketed: 'Ticketed',
                unsubcribepart: 'UnsubcribePart',
                unsubcribeall: 'UnsubcribeAll',
                cancelling: 'Cancelling'
            };
            var queryStr = location.href.slice(location.href.indexOf('?') + 1);
            var queryArr = queryStr.replace('&', ',').split(',');
            var query = '';
            self.queries = [];
            for (var i = 0, len = queryArr.length; i < len; i++) {
                query = queryArr[i];
                var temp = query.split('='), name = '', value = '';
                if (temp.length === 2) {
                    name = temp[0].toLowerCase();
                    value = temp[1];
                    self.queries[name] = transformedParams[value] ? transformedParams[value] : value;
                }
            }
        }
    });
});