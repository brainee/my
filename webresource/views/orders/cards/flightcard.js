// 机票 Card
define('flightcard', ['basecard', 'MyCtripModel', 'MyCtripStore', 'cGuiderService', 'cUtilHybrid'], function (BaseCardFactory, MyCtripModel, MyCtripStore, Guider, cUtilHybrid) {
    return BaseCardFactory.getInstance({
        bizType: 'Flight',
        timeConfig: { format: 0, entity: "FlightOrderItems", collection: [{ field: 'DepartureDateTimeStr', name: 'DepartureDate', format: '' }, { field: 'ArrivalDateTimeStr', name: 'ArrivalDate', format: '' }, { field: 'DepartureDateTimeStr', name: 'BackDepartureDate', format: '' }, { field: 'ArrivalDateTimeStr', name: 'BackArrivalDate', format: '' }], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            CheckIn: { content: "值机", rankid: 6, isShow: [1, 0, 0, 1, 0], style: 1, action: 'Flight.checkin' },
            HideOrder: { content: "删除", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Flight.del' },
            Cancel: { content: "取消", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Flight.cancel' },
            Refund: { content: "退票", rankid: 4, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Flight.refund' },
            Rebook: { content: "改签", rankid: 5, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Flight.rebook' },
            ReBookPost: { content: "修改配送", rankid: 3, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Flight.rebookpost' },
            DelayedToImmediately: { content: "付款出票", rankid: 8, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Flight.delayedToImmediately' },
            EditPayType: { content: "去支付", rankid: 9, isShow: [1, 0, 0, 1, 0], style: 1, action: 'Flight.detail' }
        },
        process: function (data) {
        	var that = this;
            var FlightOrderItems = data[this.timeConfig.entity];
            data.depFlightInfo = (FlightOrderItems instanceof Array && FlightOrderItems.length) ? FlightOrderItems[0] : {};
            var tripType = FlightOrderItems[0].TripType;
            data.isSingleTrip = tripType === '单程'; //单程订单
            data.isConnecting = tripType === '联程'; //联程订单
            data.isTypeReturn = tripType === '往返'; //往返订单
            data.isFlightAndTrain = data.isSingleTrip && data.TrainOrderItems && data.TrainOrderItems.length > 0 || false; //空铁组合订单
            data.timeIndexes = [0, 0];
            //出于考虑飞机票去和回来的时候，中间有转折，如果有转折的话，取去的SegmentNo为1的第一条数据的开始时间和SegmentNo为1的最后一条数据的到达时间。
            if (data.isSingleTrip) {//单程的到达时间取SegmentNo=1的最后一个
                for (var i = 0, len = FlightOrderItems.length; i < len; i++) {
                    if (FlightOrderItems[i].SegmentNo == 1) {
                        data.timeIndexes[1] = i;
                    } else {
                        break;
                    }
                }
            } else if (data.isConnecting) {//联程的到达时间取最后一个
                data.timeIndexes[1] = FlightOrderItems.length - 1;
            } else if (data.isTypeReturn) {//往返时去程到达时间取SegmentNo=1的最后一个，回程的起始时间分别取SegmentNo=2的第一个和最后一个
                var bGetArriTime = false;
                for (var i = 0, len = FlightOrderItems.length; i < len; i++) {
                    if (FlightOrderItems[i].SegmentNo == 1) {
                        data.timeIndexes[1] = i;//去程到达时间取SegmentNo=1的最后一条数据
                    }
                    else if (FlightOrderItems[i].SegmentNo == 2) {
                        if (!bGetArriTime) {
                            bGetArriTime = true;
                            data.timeIndexes[2] = i; //返程出发时间取SegmentNo=2的第一条数据
                        }
                        data.timeIndexes[3] = i; //返程到达时间取SegmentNo=2的最后一条数据
                    }
                }
                //是否是弃程，当往返的机票订单中没有出现SegmentNo=2的数据的时候，为弃程
                data.isUnAbandon = bGetArriTime;
            }
            data.arrFlightInfo = data.isTypeReturn && bGetArriTime ? FlightOrderItems[data.timeIndexes[2]] : FlightOrderItems[data.timeIndexes[1]];
            data.depFlightInfo.DepartureDisplayName = this._getSiteName(data.depFlightInfo, 'DepartureCity', 'DepartureAirport');
            data.depFlightInfo.ArrivalDisplayName = this._getSiteName(data.depFlightInfo, 'ArrivalCity', 'ArrivalAirport');
            data.arrFlightInfo.DepartureDisplayName = this._getSiteName(data.arrFlightInfo, 'DepartureCity', 'DepartureAirport');
            data.arrFlightInfo.ArrivalDisplayName = this._getSiteName(data.arrFlightInfo, 'ArrivalCity', 'ArrivalAirport');

            if (data.isFlightAndTrain) {
                //如果是空铁组合，将飞机和铁路的数据组合到一个新的字段集合中，便于后续操作
            	data.FlightsAndTrains = data.FlightOrderItems.concat(data.TrainOrderItems);
                //按出发时间给空铁组合数据排序
            	data.FlightsAndTrains.sort(this._sortDate);
            	data.flightAndTrainHtml = '';
            	data.FlightsAndTrains.forEach(function(v) {
            		if (v.hasOwnProperty('TrainNumber')) {
						data.flightAndTrainHtml += '<p class="order-info">铁: ' + that._getRangeDate(v.DepartureDateStr, v.ArrivalDateStr) + '<span class="item">' + v.TrainNumber + '</span></p>';
            		} else {
            			data.flightAndTrainHtml += '<p class="order-info">空: ' + that._getRangeDate(v.DepartureDateTimeStr, v.ArrivalDateTimeStr) + '<span class="item">' + v.FlightNo + '</span></p>';
            		}
            	});
            }
        },
        events: {
            detail: function (e) {
                //未登录下的离线订单不能进详情页
                if (BaseCardFactory.checkOfflineJump()) {
                    return;
                }
                var self = BaseCardFactory.getView(),
                    $li = $(e.currentTarget).closest("li"),
                    orderId = $li.data('oid'),
                    orderType = $li.data('type'),
                    url = '';
                if (self.frompageurl) {
                    if (self.frompageurl.indexOf('from=') == 0) {
                        url = self.frompageurl.slice(5);
                        url = decodeURIComponent(decodeURIComponent(url));
                    }
                } else {
                    url = '/webapp/myctrip/orders/' + self.viewType;
                }
                data = { Id: orderId, url: url };
                if (orderType == 'FlightDomestic') {
                    var orderParamStore = MyCtripStore.FlightOrderParamStore.getInstance();
                    orderParamStore.set(data);
                    Guider.jump({ targetModel: 'app', url: '/webapp/flight/index.html#flightorderdetail', module: 'InlandFlightOrder', param: { orderId: orderId } });
                } else {
                    var fltintlOrderId = MyCtripStore.FltintlOrderId.getInstance();
                    fltintlOrderId.set(data);
                    Guider.jump({ targetModel: 'app', url: "/webapp/fltintl/index.html#fltintlorderdetail", module: "InternationalFlightOrder", param: { orderId: orderId } });
                }
            },
            checkin: function (e, url) {
                var self = BaseCardFactory.getView(),
                    $li = $(e.currentTarget).closest("li"),
                    orderId = $li.data('oid'),
                    orderType = $li.data('type'),
                    data = { Id: orderId, url: "/webapp/myctrip/orders/" + self.viewType };
                if (self.viewType == 'home') {
                    data.url = decodeURIComponent(self.frompageurl.slice(5));
                }
                if (orderType == 'FlightDomestic') {
                    var orderParamStore = MyCtripStore.FlightOrderParamStore.getInstance();
                    orderParamStore.set(data);
                    Guider.jump({ targetModel: 'app', url: '/webapp/flight/index.html#flightorderdetail', module: 'flight_checkin_list', param: { orderId: orderId } });
                } else {
                    var fltintlOrderId = MyCtripStore.FltintlOrderId.getInstance();
                    fltintlOrderId.set(data);
                    Guider.jump({ targetModel: 'app', url: "/webapp/fltintl/index.html#fltintlorderdetail", module: "flight_checkin_list", param: {} });
                }
            },
            del: function (e) {
                BaseCardFactory.del(e, 'FlightDomestic');
            },
            cancel: function (e) {
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.FlightCancelModel.getInstance(),
                    li = $(e.currentTarget).closest("li");
                cancelModel.setParam('oid', li.data("oid"));
                BaseCardFactory.cancel(e, cancelModel, function (data) {
                    if (data && data.res == 0) {
                        self.showToast({
                            datamodel: {
                                content: '取消成功'
                            },
                            hideAction: function () {
                                self.onShow();
                            }
                        });
                    } else {
                        self.showToast(data && data.msg || "取消失败，请稍后再试");
                    };
                });
            },
            refund: function (e) {
                var $li = $(e.currentTarget).closest("li"),
                    orderId = $li.data('oid'),
                    orderType = $li.data('type'),
                    self = BaseCardFactory.getView();
                // FlightDomestic 国内机票
                // FlightInternational 国际机票
                if (orderType == 'FlightDomestic') {
                    // 国内机票-退票，跳机票的Native页面
                    Guider.jump({ targetModel: 'app', url: "/webapp/flight/index.html#flightorderdetail", module: "flight_inland_refund", param: { c1: orderId } });
                } else {
                    // 我携6.4，国际机票-退票，跳机票的Hybrid页面
                    var appProtocol = '',
                        str = "/webapp/flighthybrid/fltintlRefund.html?oid=" + orderId + "&source=app&";

                    str += decodeURIComponent(self.frompageurl);

                    if (cUtilHybrid.isPreProduction() == 0) {
                        appProtocol = 'http://w-flight-m.fat19.qa.nt.ctripcorp.com';
                    } else {
                        appProtocol = 'http://m.ctrip.com';
                    }

                    var appUrl = appProtocol + str + "&type=2";

                    Guider.jump({
                        targetModel: 'h5',
                        url: appUrl
                    });
                    // 国际机票-退票，跳机票的Native页面
                    // Guider.jump({ targetModel: 'app', url: "/webapp/fltintl/index.html#fltintlorderdetail", module: "flight_int_refund", param: { c1: orderId } });
                }
            },
            rebook: function (e) {
                var $li = $(e.currentTarget).closest("li"),
                    orderId = $li.data('oid'),
                    orderType = $li.data('type');
                if (orderType == 'FlightDomestic') {
                    Guider.jump({ targetModel: 'app', url: "/webapp/flight/index.html#flightorderdetail", module: "flight_inland_change", param: { c1: orderId } });
                } else {
                    Guider.jump({ targetModel: 'app', url: "/webapp/fltintl/index.html#fltintlorderdetail", module: "InternationalFlightOrder", param: { orderId: orderId, orderType: 0 } });
                }
            },
            rebookpost: function (e) {
                var $li = $(e.currentTarget).closest("li"),
                    orderId = $li.data('oid'),
                    orderType = $li.data('type');
                if (orderType == 'FlightDomestic') {
                    Guider.jump({ targetModel: 'app', url: '/webapp/flight/index.html#flightorderdetail', module: 'flight_inland_orderedit', param: { c1: orderId } });
                } else {
                    Guider.jump({ targetModel: 'app', url: "/webapp/fltintl/index.html#fltintlorderdetail", module: "flight_int_orderedit", param: { c1: orderId } });
                }
            },
            delayedToImmediately: function (e) {
                var $li = $(e.currentTarget).closest("li"),
                    orderId = $li.data('oid'),
                    orderType = $li.data('type');
                //if (orderType == 'FlightInternational') {
                    Guider.jump({ targetModel: 'app', url: "/webapp/fltintl/index.html#fltintlorderdetail", module: "flight_int_temp", param: { c1: orderId } });
                //}
            },
            editPayType: function (e) {

            }
        },

        //根据时间排序
        _sortDate: function(a, b) {
        	var pattern = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/,
            	result1 = null,
            	result2 = null;
        		first = a.DepartureDateTimeStr || a.DepartureDateStr,
        		second = b.DepartureDateTimeStr || b.DepartureDateStr;
        	if (first === second) {
    			return 0;
    		}
    		result1 = pattern.exec(first);
    		result2 = pattern.exec(second);
    		if (result1 && result2) {
    			for (var i = 1, len = result1.length; i < len; i++) {
    				if (result1[i] > result2[i]) {
    					return 1;
    				} else if (result1[i] < result2[i]) {
    					return -1;
    				}
    			}
    		}
    		return 0;
        },

        //获取机场/火车站应该显示的名字。规则：城市名称+机场/火车站名称
        _getSiteName: function(data, city, name) {
        	return data[name] && data[name].indexOf(data[city]) === 0 ? data[name] : data[city] + (data[name] || '');
        },

        //获取显示的时间区间
        _getRangeDate: function(fromDate, toDate) {
        	var pattern = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
        		result1 = pattern.exec(fromDate),
        		result2 = pattern.exec(toDate),
        		result = '';
        	if (result1 && result2) {
        		result = '<span class="date">' + result1[2] + '-' + result1[3] + '</span>&nbsp;<span class="hour">' + result1[4] + ':' + result1[5] + '</span>&nbsp;至&nbsp;';
        		if (result1[2] === result2[2]) {
        			result += '<span class="hour">' + result2[4] + ':' + result2[5] + '</span>';
        		} else {
        			result += '<span class="hour">' + result2[2] + '-' + result2[3] + '</span>&nbsp;<span class="hour">' + result2[4] + ':' + result2[5] + '</span>';
        		}
        	} else {
        		result = '<span class="date">' + fromDate + '</span>&nbsp;至&nbsp;<span class="date">' + toDate + '</span>';
        	}
        	return result;
        }
    });
});