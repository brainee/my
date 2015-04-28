// 火车票 Card
define('traincard', ['basecard', 'CommonStore', 'cGuiderService', 'cUtilHybrid', 'MyCtripModel'], function (BaseCardFactory, CommonStore, Guider, cUtilHybrid, MyCtripModel) {
    return BaseCardFactory.getInstance({
        bizType: 'Train',
        timeConfig: { format: 0, entity: "TrainOrderItems", collection: [{ field: 'DepartureDateStr', name: 'DepartureDate', format: '' }, { field: 'ArrivalDateStr', name: 'ArrivalDate', format: '' }, { field: 'DepartureDateStr', name: 'BackDepartureDate', format: '' }, { field: 'ArrivalDateStr', name: 'BackArrivalDate', format: '' }], booking: 0 },
        handlerConfig: {
            OrderPay: { content: "去支付", rankid: 5, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Train.pay'},
            OrderConsult: { content: "咨询", rankid: 4, isShow: [1, 1, 1, 1, 0], style: 0, action: 'Train.consult' },//国内
            RefundTicket: { content: "退票", rankid: 2, isShow: [1, 1, 1, 1, 0], style: 0, action: 'Train.detail' },//国内
            Share: { content: "分享", rankid: 3, isShow: [1, 0, 1, 1, 0], style: 0, action: 'Train.share' },//国内
            CancelOrder: { content: "取消", rankid: 1, isShow: [1, 1, 1, 1, 0], style: 0, action: 'Train.detail' },//国内
            HideOrder: { content: "删除", rankid: 0, isShow: [1, 1, 1, 1, 0], style: 0, action: 'Train.del' },//国内
            //Pay: { content: "去付款", rankid: 4, isShow:[1,1,0,1,0], style: 1 ,action: 'Train.pay'},
            Refund: { content: "退票", rankid: 2, isShow: [1, 1, 1, 1, 0], style: 0, action: 'Train.process' },//国际
            Cancel: { content: "取消", rankid: 1, isShow: [1, 1, 1, 1, 0], style: 0, action: 'Train.process' },//国际
            Payment: { content: '去付款', rankid: 4, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Train.detail' }//国际
            //WaitPay: { content: "待支付", rankid: 3, isShow:[1,1,0,1,0], style: 1,action: 'Train.pay' }
        },
        process: function (data) {
            var TrainOrderItems = data[this.timeConfig.entity],
                len = TrainOrderItems.length;
            //时间选择，timeIndexes = [i, j, k, l] 对应  去程中的第i条item的起始时间和第j条item的达到时间；k, l对应返程
            data.timeIndexes = [0, 0];
            data.carriageSeat = '';
            data.isTypeReturn = false;
            data.depTrainInfo = (TrainOrderItems instanceof Array && len) ? TrainOrderItems[0] : {};

            //国内火车票特殊处理：座位号
            if (data.BizType === 'Train' && len > 0) {
                var temp = [], carriage = '', seat = '', carriageSeat = '';
                //取多条数据中的座位号信息，暂存数组
                for (var i = 0; i < len; i++) {
                    carriage = TrainOrderItems[i].CarriageNo ? TrainOrderItems[i].CarriageNo + '车' : '';
                    seat = TrainOrderItems[i].SeatNo ? TrainOrderItems[i].SeatNo : '';
                    carriageSeat = carriage + seat;

                    if (carriageSeat.length > 0) { temp.push(carriageSeat); }
                }

                //有座位号存在，一个或多个
                if (temp.length) {
                    //处理不在需求范围内的 国内火车票往返票问题
                    data.carriageSeat = (temp[0]) + (temp[1] !== undefined && Passagers && Passagers.length > 1 ? '、' + temp[1] : '') + (temp.length > 2 ? '等' : '');
                }
                //var CarriageNo = data.depTrainInfo.CarriageNo ? data.depTrainInfo.CarriageNo + '车' : '',
                //    SeatNo = data.depTrainInfo.SeatNo ? data.depTrainInfo.SeatNo : '',
                //    carriageSeat = CarriageNo + SeatNo;
                //data.carriageSeat = carriageSeat;

                //if (carriageSeat.length > 0 && (data.Passagers instanceof Array && data.Passagers.length > 1) && len > 1) {
                //    data.carriageSeat += '等';
                //}
            }

            //欧铁特殊处理：往返
            if (data.BizType === 'TrainInternational' && len > 0) {
                //diff Eurail ticket's type     0: through ticket, 1: single ticket, 2: return ticket
                var flag = TrainOrderItems.Validity ? 0 : (TrainOrderItems[len - 1].WayType === '返程' ? 2 : 1);
                var bGetArrTime = false;

                data.isTypeReturn = flag === 2;
                if (flag == 1) {
                    data.timeIndexes = [0, len - 1];
                } else if (flag = 2) {
                    for (i = 0; i < len; i++) {
                        if (TrainOrderItems[i].WayType === '去程') {
                            data.timeIndexes[1] = i;
                        } else if (TrainOrderItems[i].WayType === '返程') {
                            if (!bGetArrTime) {
                                data.timeIndexes[2] = i;//返程出发时间选WayType为'返程'的第一条
                                bGetArrTime = true;
                            }
                            data.timeIndexes[3] = i;//返程到达时间选WayType为'返程'的最后一条
                        }
                    }
                }
            }
            data.arrTrainInfo = data.isTypeReturn && bGetArrTime ? TrainOrderItems[data.timeIndexes[2]] : null;

            //国内火车票分享按钮有条件外露
            var orderStatus = ['已购票', '已配送', '已成交'];
            var status = data.OrderStatusName || '';
            if (data && data.OrderActions && !data.isOfflineOrder && data.BizType != 'TrainInternational') {//离线订单未登录时不显示share按钮   欧铁没有分享
                if ($.inArray(status, orderStatus) > -1) {
                    data.OrderActions.push({
                        ActionCode: 'Share',
                        ActionName: '分享'
                    })
                }
            }
        },
        afterFilterData: function (data) {//分享的内容
            data.shareItem = '';
            if (data && data.TrainOrderItems && data.TrainOrderItems[0] && data.ArrivalDate && data.DepartureDate && data.Passagers) {
                var length = data.Passagers.length;
                var passager = '';
                if (length) {
                    passager = (data.Passagers[0] || '') + (data.Passagers[0] && data.Passagers[1] ? '、' : '') + (data.Passagers[1] || '') + (length > 2 ? '等' : '');
                }
                data.shareItem = [
                    (data.TrainOrderItems[0].DepartureStation || ''),
                    (data.TrainOrderItems[0].ArrivalStation || ''),
                    data.DepartureDate[0] + '日' + data.DepartureDate[1],
                    data.ArrivalDate[0] + '日' + data.ArrivalDate[1],
                    (data.TrainOrderItems[0].TrainNumber || ''),
                    (passager ? '，出行人是' + passager : '')
                ].join('|');
            }
        },
        events: {
            detail: function (e) {
                //未登录下的离线订单不能进详情页
                if (BaseCardFactory.checkOfflineJump()) {
                    return;
                }
                var self = BaseCardFactory.getView(),
                    orderId = $(e.currentTarget).closest("li").data('oid');
                if (cUtilHybrid.getAppSys() === "youth") {
                    Guider.cross({
                        path: 'train',
                        param: 'index.html#bookingdetails?orderId=' + orderId + "&" + self.frompageurl
                    });
                } else {
                    BaseCardFactory.jump(e);
                }
            },
            share: function (e) {
                var param = $(e.currentTarget).closest("li").data('share').split('|') || '';
                //上海虹桥|北京南|01-08 07:00|01-08 12:20|G102|刘德华
                if (param instanceof Array) {
                    var title = param[0] + '到' + param[1] + '火车票';
                    var text = '携程旅行客户端帮我预订了从' + param[0] + '至' + param[1] + '，' + param[2] + '出发至' + param[3] + '到达，车次是' + param[4] + param[5] + '。';
                    BaseCardFactory.share({ title: title, text: text });
                }
            },
            del: function (e) {//删除订单
                BaseCardFactory.del(e, 'Train');
            },
            pay: function (e) {
                var orderType = $(e.currentTarget).closest('li').data('type');
                BaseCardFactory.pay(e, orderType);
            },
            consult: function (e) {//订单咨询
                var headStore = CommonStore.HeadStore.getInstance(),
                    token = headStore.get().auth || '',
                    url = BaseCardFactory.getJumpUrl(e);

                url += (url.indexOf('?') > -1 ? '&' : '?') + 'token=' + token;

                Guider.jump({ url: url, targetModel: 'h5', title: '订单咨询' });
            },
            process: function (e) {
                var dataModel = {
                    Cancel: {
                        reason: '用户申请取消',
                        confirmText: '您确定要取消这张订单？',
                        successText: '操作成功',
                        okText: '<strong>取消订单</strong>',
                        model: MyCtripModel.CancelOrder.getInstance()
                    },
                    Refund: {
                        reason: '用户申请退订',
                        confirmText: '您的订单已出票，现在退票可能会产生金额损失，详情请参考退改签政策，是否确认退票？',
                        successText: '您的退票申请已提交，稍后会有订单操作人员与您联系并办理退票事宜。',
                        okText: '<strong>确认退票</strong>',
                        model: MyCtripModel.RecedeOrder.getInstance()
                    }
                }

                var self = BaseCardFactory.getView(),
                    orderId = $(e.currentTarget).closest("li").data('oid'),
                    code = $(e.currentTarget).data('code'),
                    reason = dataModel[code].reason, // 无线写死，online需要用户填写
                    processModel = dataModel[code].model;

                processModel.setParam({
                    OrderID: orderId,
                    Reason1: reason
                });
                self.showConfirm({
                    datamodel: {
                        content: dataModel[code].confirmText,
                        btns: [{
                            name: '点错了', className: 'cui-btns-cancel'
                        }, {
                            name: dataModel[code].okText, className: 'cui-btns-ok'
                        }],
                    },
                    okAction: function () {
                        this.hide();
                        self.showLoading();
                        processModel.execute(function (data) {
                            self.hideLoading();
                            if (data && data.ResultCode == 0) {
                                self.showToast({
                                    datamodel: {
                                        content: dataModel[code].successText
                                    },
                                    hideAction: function () {
                                        self.onShow();
                                    }
                                });
                            } else {
                                self.showToast('操作失败，请稍后再试');
                            }
                        }, function (e) {
                            self.hideLoading();
                            self.showToast('操作失败，请稍后再试');
                        }, true, self, function () {
                            self.hideLoading();
                            self.showToast('操作失败，请稍后再试');
                        });
                    },
                    cancelAction: function () {
                        this.hide();
                    }
                });
            }
        }
    });
});
