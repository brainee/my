// 门票 Card
define('piaocard', ['basecard', 'MyCtripModel'], function (BaseCardFactory, MyCtripModel) {
    return BaseCardFactory.getInstance({
        bizType: 'Piao',
        timeConfig: { format: 0, entity: "PiaoOrderItems", collection: ["DepartureDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Cancel: { content: "取消", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Piao.cancel' },//code不同都是取消,optype:1 取消
            Unsubscribe: { content: "取消", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Piao.unsubscribe' },//code不同都是取消,optype:2退订
            Comment: { content: "点评", class: "comment", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Piao.comment' },
            ReSendSMS: { content: "重发短信", class: "btn-message", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Piao.message' },
            ContinuePay: { content: "去支付", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Piao.pay' }
        },
        process: function (data) {
            var arrActions = data.OrderActions,
                ActionURLH5 = '';

            for (var i = 0, len = arrActions.length; i < len; i++) {
                var action = arrActions[i];
                if (action.ActionCode === 'Cancel') {
                    ActionURLH5 = action.ActionURLH5;
                    break;
                }
            }
            data.ActionURLH5 = ActionURLH5;
        },
        events: {
            detail: function (e) {
                //未登录下的离线订单不能进详情页
                if (BaseCardFactory.checkOfflineJump()) {
                    return;
                }

                var orderId = $(e.currentTarget).closest("li").data('oid');
                var url = "/webapp/ticket/orderdetail?orderid=" + orderId;
                BaseCardFactory.jump(e, url, 'index.html#/');
            },
            // 退订订单 cancel optype:1
            cancel: function (e) {
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.TicketCancelOrderModel.getInstance(),
                    li = $(e.currentTarget).closest("li"),
                    cancelURL = li.data('url');

                // 如果有下发取消的链接地址，则跳转链接；反之走以前的逻辑，直接调用门票接口，返回操作提示
                if (!cancelURL) {
                    cancelModel.setParam({
                        oid: li.data('oid'),
                        optype: 1
                    });
                    BaseCardFactory.cancel(e, cancelModel, function (data) {
                        if (!(data && data.ResponseStatus.Ack === 'Success')) {
                            self.showToast("取消失败，请稍后再试");
                        } else {
                            self.showToast({
                                datamodel: {
                                    content: '取消成功'
                                },
                                hideAction: function () {
                                    li.find(".order-ft").hide();
                                    li.find('.order-status').text('取消中');
                                }
                            });
                        }
                    });
                } else {
                    BaseCardFactory.jump(e, cancelURL, 'index.html#/');
                }
            },
            // 退订订单 unsubscribe optype:2
            unsubscribe: function (e) {
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.TicketCancelOrderModel.getInstance(),
                    li = $(e.currentTarget).closest("li"),
                    cancelURL = li.data('url');

                // 如果有下发取消的链接地址，则跳转链接；反之走以前的逻辑，直接调用门票接口，返回操作提示
                if (!cancelURL) {
                    cancelModel.setParam({
                        oid: li.data('oid'),
                        optype: 2
                    });
                    BaseCardFactory.cancel(e, cancelModel, function (data) {
                        if (!(data && data.ResponseStatus.Ack === 'Success')) {
                            self.showToast("取消失败，请稍后再试");
                        } else {
                            self.showToast({
                                datamodel: {
                                    content: '退订成功'
                                },
                                hideAction: function () {
                                    li.find(".order-ft").hide();
                                    li.find('.order-status').text('退订中');
                                }
                            });
                        }
                    });
                } else {
                    BaseCardFactory.jump(e, cancelURL, 'index.html#/');
                }
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'Piao');
            },
            message: function (e) {
                var self = BaseCardFactory.getView(),
                    $target = $(e.currentTarget);

                if ($target.hasClass("btn02_disabled")) {
                    return;
                }
                var orderID = $target.closest("li").data("oid"),
                    mobile = $target.closest("li").data("mobile") || "",
                    message = "入园凭证短信将发送至" + mobile;

                self.showConfirm({
                    datamodel: {
                        content: message,
                        btns: [{
                            name: '点错了', className: 'cui-btns-cancel'
                        }, {
                            name: '确定发送', className: 'cui-btns-ok'
                        }]
                    },
                    cancelAction: function () {
                        this.hide();
                    },
                    okAction: function () {
                        this.hide();
                        var sendMessageModel = MyCtripModel.TicketSendMessageModel.getInstance();
                        self.showLoading();
                        sendMessageModel.setParam("oid", orderID);
                        sendMessageModel.setParam("mbi", mobile);
                        sendMessageModel.excute(function (data) {
                            self.hideLoading();
                            if (data && data.ResponseStatus.Ack === 'Success') {
                                var msg = data.data.msg;
                                self.showToast({
                                    datamodel: {
                                        content: msg
                                    },
                                    hideAction: function () {
                                        $target.removeClass("btn02").addClass("btn02_disabled").html("已发送");
                                    }
                                });
                            } else {
                                self.showToast('发送失败');
                            }
                        }, function (error) {
                            self.hideLoading();
                            self.showToast("发送失败，请稍后再试");
                        }, true, self, function () {
                            self.hideLoading();
                            self.showToast("发送失败，请稍后再试");
                        });
                    }
                });
            },
            comment: function (e) {
                BaseCardFactory.jump(e, '', 'index.html#/');
            }
        }
    });
});