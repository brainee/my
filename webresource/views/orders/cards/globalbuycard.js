// 全球购 Card
define('globalbuycard', ['basecard', 'MyCtripModel'], function(BaseCardFactory, MyCtripModel) {
    return BaseCardFactory.getInstance({
        bizType: 'GlobalBuy',
        timeConfig: {format: 0, entity: "GlobalBuyOrderItems", collection: [], booking: 0 },
        handlerConfig: { //isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Pay: {content: "去付款", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, action: "GlobalBuy.pay"},
            AddView: { content: "点评", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'GlobalBuy.AddView' },
            ViewDetail: { content: "查看点评", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'GlobalBuy.ViewDetail' },
            Delete: { content: "删除", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'GlobalBuy.Delete' },
            Cancel: { content: "取消", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'GlobalBuy.Cancel' },
            Done: { content: "确认收货", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'GlobalBuy.Done' }
        },
        process: function(data) {
            data.items = data[this.timeConfig.entity] || [];
            // 需要后台返回商户信息，暂时做的容错处理
            if(data.items){
                data.SiteName = data.items[0].SiteName || '';
                data.VendorName = data.items[0].VendorName || '';
            }

            var arr = _.map(data.items, function(obj) { return obj.Quantity });
            // 商品总件数
            data.total = _.reduce(arr, function(n, m) { return n + m}, 0);
            // 商品种类
            data.Quantity = data.items.length;
            data.isMultiple = data.Quantity > 1 ? true : false;
        },
        events: {
            // 去付款
            pay: function(e) {
                BaseCardFactory.pay(e, 'GlobalBuy');
            },
            detail: function(e) {
                BaseCardFactory.jump(e);
            },
            AddView: function(e) {
                var url = BaseCardFactory.getJumpUrl(e);
                BaseCardFactory.jump(e, url);
            },
            ViewDetail: function(e) {
                var url = BaseCardFactory.getJumpUrl(e);
                BaseCardFactory.jump(e, url);
            },
            Delete: function(e) {
                BaseCardFactory.del(e, 'GlobalBuy');
            },
            Cancel: function(e) {
                var self = BaseCardFactory.getView(),
                    li = $(e.currentTarget).closest("li"),
                    cancelModel = MyCtripModel.GlobalBuyCancelModel.getInstance();

                cancelModel.setParam({
                    OrderID: li.data("oid"),
                    OrderStatus: 5
                });

                BaseCardFactory.cancel(e, cancelModel, function(data) {
                    if (data && data.ResponseStatus.Ack == 'Success' && data.RetCode == 0) {
                        self.showToast({
                            datamodel: {
                                content: '取消成功'
                            },
                            hideAction: function () {
                                self.onShow();
                            }
                        });
                    } else {
                        self.showToast("取消失败，请稍后再试");
                    }
                });
            },
            Done: function(e) {
                // 确认收货跳转到订单详情页
                BaseCardFactory.jump(e);
            }
        }
    });
});
