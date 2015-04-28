// 自由行 Card
define('diycard', ['basecard'], function (BaseCardFactory) {
    return BaseCardFactory.getInstance({
        bizType: 'DIY',
        timeConfig: { format: 0, entity: "DIYOrderItems", collection: ["BeginUsageDate", "EndUsageDate"], booking: 0, relate: true },
        handlerConfig: {
            HideOrder: { content: "删除", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'DIY.hideOrder' }
//            ,
//            Cancel: { content: "取消", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'DIY.cancel' }
//            ,
//            ContinuePay: { content: "去付款", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'DIY.continuePay' }
        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e);
            },
            hideOrder: function (e) {//删除
                BaseCardFactory.del(e, 'DIY');
            },
//            cancel: function (e) {
//                debugger;
//                BaseCardFactory.jump(e);
//            },
            modify: function (e) {//修改订单
                BaseCardFactory.jump(e);
            }
//            ,
//            // 继续付款
//            continuePay: function(e) {
//                BaseCardFactory.pay(e, 'DIY');
//            }
        }
    });
});