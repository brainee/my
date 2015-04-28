// 保险 Card
define('insurecard', ['basecard', 'cGuiderService'], function (BaseCardFactory, Guider) {
    return BaseCardFactory.getInstance({
        bizType: 'VacationInsurance',//relate是否起止日期
        timeConfig: { format: 0, entity: "VacationInsuranceOrderItems", collection: ["EffectDate", "ExpiredDate"], booking: 0, relate: true },
        handlerConfig: {
            HideOrder: { content: "删除", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: "VacationInsurance.del" },
            Cancel: { content: "取消", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: "VacationInsurance.detail" },
            Refund: { content: "退保", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: "VacationInsurance.detail" },
            Pay: { content: "去付款", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 1, action: "VacationInsurance.pay" }
        },
        events: {
            detail: function (e) {
                var url = BaseCardFactory.getJumpUrl(e);
                Guider.apply({
                    callback: function () {
                        Lizard.jump(url + '&' + BaseCardFactory.getView().frompageurl);
                    },
                    hybridCallback: function () {
                        Guider.jump({ url: url, targetModel: 'h5' });
                    }
                });
            },
            pay: function (e) {//只需要传event，和BizType，某些特殊处理可以在callback中处理，此处在callback中重写paymentUrl。
                BaseCardFactory.pay(e, 'VacationInsurance', function (data) {
                    var busType = data.PaymentInfos[0].BusType,
                        orderId = data.PaymentInfos[0].Oid;
                    data.paymentUrl = data.paymentUrl + "&oid=" + orderId + "&bustype=" + busType;
                });
            },
            del: function (e) {
                BaseCardFactory.del(e, 'VacationInsurance');
            }
        }
    });
});