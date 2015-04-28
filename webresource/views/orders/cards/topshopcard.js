// 高端商户 Card
define('topshopcard', ['basecard', 'cUtilCommon', 'cUtilHybrid', 'MyCtripModel', 'CommonStore', 'cGuiderService'], function (BaseCardFactory, cUtilCommon, cUtilHybrid, MyCtripModel, CommonStore, Guider) {
    return BaseCardFactory.getInstance({
        bizType: 'TopShop',
        timeConfig: { format: 0, entity: "TopShopOrderItems", collection: ["BeginValidTime", "EndValidTime"], booking: 0, relate: true },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            ContinuePay: { content: '去付款', rankid: 2, isShow: [1, 1, 0, 1, 0], style: 1, action: 'TopShopEvent.pay' },
            OrderCancel: { content: '取消', rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'TopShopEvent.cancel' }
        },
        process: function (data) {
            var TopShopOrderItems = data[this.timeConfig.entity];
            data.orderInfo = (TopShopOrderItems instanceof Array && TopShopOrderItems.length) ? TopShopOrderItems[0] : {};
        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e);
            },
            pay: function (e) {
                var self = BaseCardFactory.getView();

                BaseCardFactory.pay(e, 'TopShop', function (data) {
                    if (data.PaymentInfos[0].PaymentInfoCode == 0) {
                        if (cUtilCommon.isInApp) {
                            var reg = /(.*)(\/)(.*)(\/)(index.html.*)/;
                            var hybridpayUrl = reg.exec(data.paymentUrl);
                            Guider.pay.callPay({ path: hybridpayUrl[3], param: hybridpayUrl[5] + "&" + self.frompageurl });
                        }
                        else {
                            self.jump(data.paymentUrl + "&" + self.frompageurl);
                        }
                    } else {
                        self.confirm.setViewData({
                            title: '',
                            message: '此订单2小时内未完成支付已被取消，请重新下单',
                            buttons: [{ text: '知道了', click: function () { this.hide(); self.onShow(); } }]
                        });
                        self.confirm.show();
                    }
                    return true;
                });
            },
            cancel: function (e) {
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.TopShopCancelModel.getInstance(),
                    orderID = $(e.currentTarget).closest("li").data('oid'),
                    userStore = CommonStore.UserStore.getInstance(),
                    userInfo = userStore ? userStore.getUser() : null,
                    requestHead = {
                        "Channel": "0000",
                        "ExternalChannel": "",
                        "Auth": userInfo ? userInfo.Auth : "",
                        "Culture": "zh-cn",
                        "SessionId": cUtilCommon.getGuid(),
                        "ClientIP": ""
                    };

                cancelModel.setParam("Body", { "OrderId": orderID });
                cancelModel.setParam("RequestHead", requestHead);

                //高端商户fat环境就是任性
                if (cUtilHybrid.isPreProduction() == 0 || window.location.host.match(/^m\.fat\d*\.qa\.nt\.ctripcorp\.com|^210\.13\.100\.191/i)) {
                    if (cancelModel.url.indexOf('subEnv=fat1') < 0) {
                        cancelModel.url += '?subEnv=fat1';
                    }
                }
                BaseCardFactory.cancel(e, cancelModel, function (data) {
                    if (data && data.ResponseStatus && data.ResponseStatus.Ack == 'Success') {
                        self.showToast({
                            datamodel: {
                                content: '订单已取消'
                            },
                            hideAction: function () {
                                self.onShow();
                            }
                        });
                    } else {
                        self.showToast("取消失败");
                    }
                });
            }
        }
    });
});