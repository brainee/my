// 当地玩乐 Card
define('activitycard', ['basecard', 'MyCtripModel'], function (BaseCardFactory, MyCtripModel) {
    return BaseCardFactory.getInstance({
        bizType: 'Activity',
        timeConfig: { format: 0, entity: "ActivityOrderItems", collection: ["UsageDate", "ExpiredDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Cancel: { content: "取消", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Activity.cancel' },//code不同都是取消：取消
            Unsubscribe: { content: "取消", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Activity.unsubscribe' },//code不同都是取消：退订
            Comment: { content: "点评", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Activity.addComment' },
            ReSendSMS: { content: "重发短信", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Activity.message' },
            ContinuePay: { content: "去付款", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Activity.pay' }
        },
        process: function (data) {
            var item = data.ActivityOrderItems[0];
            data.isWifi = false;
            if (item && item.ExpiredDate && item.UsageDate) {
                if (item.ExpiredDate[item.ExpiredDate.indexOf('(') + 1] == '-') {
                    data.isWifi = false;
                } else {
                    var expiredDate = item.ExpiredDate.replace(/\D/igm, "").substring(0, 13),
                    usageDate = item.UsageDate.replace(/\D/igm, "").substring(0, 13);
                    data.isWifi = (+expiredDate) - (+usageDate) > 0;
                }
            }
        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e, '', 'index.html#/');
            },
            addComment:function(e) {
                BaseCardFactory.jump(e, '', 'index.html#/');
            },
            // 取消订单 cancel optype:1
            cancel: function (e) {
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.ActivityCancelOrderModel.getInstance(),
                    li = $(e.currentTarget).closest("li");
                    cancelModel.setParam({
                        oid : li.data('oid'),
                        optype: 1
                    });
                    BaseCardFactory.cancel(e, cancelModel, function (data) {
                        if (!(data.data && data.data.rslt)) {
                            self.showToast("取消失败，请稍后再试");
                        } else {
                            self.showToast({
                                datamodel: {
                                    content: "取消成功"
                                },
                                hideAction: function () {
                                    li.find(".order-ft").hide();
                                    li.find('.order-status').text('取消中');
                                }
                            });
                        }
                });
            },
            // 退订订单 unsubscribe optype:2
            unsubscribe: function (e) {
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.ActivityCancelOrderModel.getInstance(),
                    li = $(e.currentTarget).closest("li");
                    cancelModel.setParam({
                        oid : li.data('oid'),
                        optype: 2
                    });
                    BaseCardFactory.cancel(e, cancelModel, function (data) {
                        if (!(data.data && data.data.rslt)) {
                            self.showToast("取消失败，请稍后再试");
                        } else {
                            self.showToast({
                                datamodel: {
                                    content: "退订成功"
                                },
                                hideAction: function () {
                                    li.find(".order-ft").hide();
                                    li.find('.order-status').text('退订中');
                                }
                            });
                        }
                });
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'Activity');
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
                        var sendMessageModel = MyCtripModel.ActivitySendMessageModel.getInstance();
                        self.showLoading();
                        sendMessageModel.setParam("oid", orderID);
                        sendMessageModel.setParam("mbi", mobile);
                        sendMessageModel.excute(function (data) {
                            self.hideLoading();
                            if (data && data.data && data.data.rslt) {
                                self.showToast({
                                    datamodel: {
                                        content: "发送成功！"
                                    },
                                    hideAction: function () {
                                        $target.removeClass("btn02").addClass("btn02_disabled").html("已发送");
                                    }
                                });
                            } else {
                                self.showToast("发送失败，请稍后再试");
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
            }
        }
    });
});