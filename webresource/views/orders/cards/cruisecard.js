// 邮轮 Card
define('cruisecard', ['basecard', 'MyCtripModel'], function (BaseCardFactory, MyCtripModel) {
    return BaseCardFactory.getInstance({
        bizType: 'Cruise',
        timeConfig: { format: 0, entity: "CruiseOrderItems", collection: ["UsageDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            CancelOrder: { content: "取消", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: "Cruise.cancel" },
            Comment: { content: "点评", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: "Cruise.guide" },
            LinkOrder: { content: "关联订单", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: "Cruise.guide" },
            ContinueBooking: { content: "继续预订", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, action: "Cruise.guide" },
            ContinuePay: { content: "去付款", rankid: 4, isShow: [1, 1, 0, 1, 0], style: 1, action: "Cruise.guide" }
        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e);
            },
            cancel: function (e) {
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.CruiseCancelOrderModel.getInstance(),
                    li = $(e.currentTarget).closest("li");
                cancelModel.setParam({ OrderID: li.data("oid") });
                BaseCardFactory.cancel(e, cancelModel, function (data) {
                    if (data.ResponseStatus.Ack == "Success") {
                        self.showToast('取消成功');
                        li.find(".order-status").text("已取消");
                        li.find(".order-ft").hide();
                    } else {
                        self.showToast('网络不给力，请稍后再试');
                    }
                });
            },
            guide: function (e) {
                BaseCardFactory.jump(e);
            }
        }
    });
});