// 机场巴士 Card
define('airbuscard', ['basecard', 'MyCtripModel'], function(BaseCardFactory, MyCtripModel) {
    return BaseCardFactory.getInstance({
        bizType: 'AirportBus',
        timeConfig: {format: 0, entity: "AirportBusOrderItems", collection: [], booking: 0 },
        handlerConfig: { //isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Cancel: {content: "取消", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: "AirBus.cancel"},
            RefundTicket: {content: "退票", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: "AirBus.payBack"},
            ToPay: {content: "去付款", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, action: "AirBus.pay"},
            Delete: { content: "删除", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'AirBus.del' }
        },
        process: function (data) {
            var AirportBusOrderItems = data[this.timeConfig.entity];

            data.depAirbusInfo = (AirportBusOrderItems instanceof Array && AirportBusOrderItems.length) ? AirportBusOrderItems[0] : {};

            // “已退票”不显示取票号，已出票，部分退票会显示 。
            data.TicketNumber = '';
            if(data.OrderStatusName === '已退票') {
               return data.TicketNumber;
            }
            if (data && data.AirportBusOrderItems[0] && data.AirportBusOrderItems[0].TicketNumber) {
                var ticketsArr = data.AirportBusOrderItems[0].TicketNumber.split('、');
                data.TicketNumber = ticketsArr.length > 1 ? ticketsArr[0] + '等' : ticketsArr[0];
            }
        },
        events: {
            // 去付款
            pay: function(e) {
                BaseCardFactory.pay(e, 'AirportBus');
            },
            detail: function(e) {
                BaseCardFactory.jump(e);
            },
            // 退票
            payBack: function(e) {
                BaseCardFactory.jump(e);
            },
            del: function (e) {//basecard中提供删除的方法
                BaseCardFactory.del(e, 'AirportBus');
            },
            // 取消订单
            cancel: function(e) {
                var self = BaseCardFactory.getView(),
                    li = $(e.currentTarget).closest("li"),
                    cancelModel = MyCtripModel.AirportbusCancelModel.getInstance();

                cancelModel.setParam({
                    OrderID: li.data("oid")
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
            }
        }
    });
});
