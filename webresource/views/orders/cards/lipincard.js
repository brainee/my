// 礼品卡 Card
define('lipincard', ['basecard', 'CommonStore', 'MyCtripModel', 'cUtilCommon'], function (BaseCardFactory, CommonStore, MyCtripModel, cUtilCommon) {
    return BaseCardFactory.getInstance({
        bizType: 'Lipin',
        timeConfig: { format: 0, entity: "LipinOrderItems", collection: [], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            AbandonRebates: { content: '放弃优惠', rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Lipin.abandon' },
            Shipped: { content: '确认收货', rankid: 1, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Lipin.shipped' },
            ViewReceive: [{ content: '领用', rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, 'class': 'receive', action: 'Lipin.receive' }, //礼品卡的查看和领用共用一个ActionCode
                          { content: '查看', rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, 'class': 'view', action: 'Lipin.view' }],
            AwaitingPayment: { content: '去付款', rankid: 4, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Lipin.pay' },
            HideOrder: { content: '删除', rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Lipin.hideOrder' }
        },
        process: function (data) {
            var LipinOrderItems = data[this.timeConfig.entity];
            data.orderInfo = (LipinOrderItems instanceof Array && LipinOrderItems.length) ? LipinOrderItems[0] : {};
        },
        events: {
            detail: function (e) {
                //未登录下的离线订单不能进详情页
                if (BaseCardFactory.checkOfflineJump()) {
                    return;
                }

                var orderid = $(e.currentTarget).closest("li").attr('data-onum');
                var url = cUtilCommon.isInApp ? '/webapp/lipin/#webapp/lipin/orderdetail?onum=' + orderid : "/webapp/lipin/orderdetail?onum=" + orderid;
                BaseCardFactory.jump(e, url, '', true);
            },
            //查看礼品卡
            view: function (e) {
                var orderNumber = $(e.currentTarget).closest("li").attr('data-onum'),
                    orderId = $(e.currentTarget).closest("li").data('oid'),
                    url = cUtilCommon.isInApp ? "/webapp/lipin/#webapp/lipin/ordercardpwd?onum=" + orderNumber + "&oid=" + orderId : "/webapp/lipin/ordercardpwd?onum=" + orderNumber + "&oid=" + orderId;
                BaseCardFactory.jump(e, url, '', true);
            },
            //领用礼品卡
            receive: function (e) {
                var orderNumber = $(e.currentTarget).closest("li").attr('data-onum'),
                    orderId = $(e.currentTarget).closest("li").data('oid'),
                    url = cUtilCommon.isInApp ? "/webapp/lipin/#webapp/lipin/ordercardreceive?onum=" + orderNumber + "&oid=" + orderId : "/webapp/lipin/ordercardreceive?onum=" + orderNumber + "&oid=" + orderId;
                BaseCardFactory.jump(e, url, '', true);
            },
            abandon: function (e) {
                var self = BaseCardFactory.getView(),
                    tardom = $(e.currentTarget).closest("li"),
                    lipinAbandonRebateModel = MyCtripModel.LipinAbandonRebateModel.getInstance();
                lipinAbandonRebateModel.setParam('OrderID', tardom.data("oid"));
                self.showConfirm({
                    datamodel: {
                        content: '放弃优惠后您将可以领用订单中的礼品卡，但您将不会再获得本订单约定赠送的礼品卡，请慎重考虑！',
                        btns: [{
                            name: '点错了', className: 'cui-btns-cancel'
                        }, {
                            name: '确认放弃', className: 'cui-btns-ok'
                        }],
                    },
                    okAction: function () {
                        this.hide();
                        self.showLoading();
                        lipinAbandonRebateModel.execute(function (data) {
                            self.hideLoading();
                            if (data && data.Result && data.Result.ResultCode == 0) {
                                self.showToast({
                                    datamodel: {
                                        content: '操作成功'
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
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'Lipin');
            },
            shipped: function (e) {
                var self = BaseCardFactory.getView(),
                    tardom = $(e.currentTarget).closest("li"),
                    confirmModel = MyCtripModel.CustomerLipinConfirmModel.getInstance();
                var cnt = tardom.data("cnt");
                self.showConfirm({
                    datamodel: {
                        content: "您确认已收到" + cnt + "张礼品卡（实体卡）？",
                        btns: [{
                            name: '取消', className: 'cui-btns-cancel'
                        }, {
                            name: '确定', className: 'cui-btns-ok'
                        }],
                    },
                    okAction: function () {
                        this.hide();
                        confirmModel.setParam({ "OrderId": tardom.data("oid") });
                        confirmModel.excute(function (data) {
                            self.hideLoading();
                            if (data.ResultInfo.IsSuccessful) {
                                self.onShow();
                                self.showToast('确认收货成功');
                            }
                            else {
                                self.showToast(data.ResultInfo.ResultMessage);
                            }
                        }, function (data) {
                            self.hideLoading();
                            self.showToast('网络不给力，请稍候重试');
                        }, true, self, function (data) {
                            self.hideLoading();
                            self.showToast('网络不给力，请稍候重试');
                        });
                    },
                    cancelAction: function () {
                        this.hide();
                    }
                });
            },
            hideOrder: function (e) {
                BaseCardFactory.del(e, 'Lipin');
            }
        }
    });
});