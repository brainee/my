// 存款证明 Card
define('depositcard', ['basecard'], function (BaseCardFactory) {
    return BaseCardFactory.getInstance({
        bizType: 'Deposit',
        timeConfig: { format: 0, entity: "DepositOrderItems", collection: ['DepositTimeFrom', 'DepositTimeTo'], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            ContinuePay: { content: "去付款", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: "Deposit.pay" }
        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e);
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'Deposit');
            }
        }
    });
});