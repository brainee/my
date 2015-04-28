// 礼遇商城 Card
define('mallcard', ['basecard', 'MyCtripModel'], function (BaseCardFactory, MyCtripModel) {
    return BaseCardFactory.getInstance({
        bizType: 'Mall',
        timeConfig: { format: 0, entity: "MallOrderItems", collection: [], booking: 0 },
        handlerConfig: { //isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            ContinuePay: { content: "去付款", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, action: "Mall.pay" },
            DeleteOrder: { content: '删除', rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Mall.DeleteOrder' }
        },
        process: function (data) {
            data.items = data[this.timeConfig.entity] || [];
            if (data.items) {
                data.Point = data.items[0].Point;
                data.ProductName = data.items[0].ProductName || '';
                data.ProductDesc = data.items[0].ProductDesc || '';
                data.Quantity = data.items[0].Quantity || '';
                data.ImageURL = data.items[0].ImageURL || '';
            }
        },
        events: {
            // 去付款
            pay: function (e) {
                BaseCardFactory.pay(e, 'Mall');
            },
            detail: function (e) {
                BaseCardFactory.jump(e, '', '', true);
            },
            DeleteOrder: function (e) {//basecard中提供删除的方法
                BaseCardFactory.del(e, 'Mall');
            }
        }
    });
});