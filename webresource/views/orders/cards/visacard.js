// 签证 Card
define('visacard', ['basecard', 'cUtilCommon', 'cGuiderService'], function (BaseCardFactory, cUtilCommon, Guider) {
    return BaseCardFactory.getInstance({
        bizType: 'Visa',
        timeConfig: { format: 0, entity: "VisaOrderItems", collection: ["DepartureDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            ToPay: { content: "去付款", rankid: 8, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Visa.pay' },
            ModifyOrder: { content: "修改", rankid: 7, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Visa.detail' },
            ModifyInvoice: { content: "修改发票", rankid: 6, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Visa.detail' },
            Modify: { content: "修改联系人", rankid: 5, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Visa.detail' },
            //ViewComment: { content: "查看点评", rankid: 4, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Visa.detail' },//6.1不做了
            //Comment:{ content: "点评", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Visa.detail' },
            Cancel: { content: "取消", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Visa.detail' },
            HideOrder: { content: "删除", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Visa.del' }
        },
        events: {
            detail: function (e) {
                var url = BaseCardFactory.getJumpUrl(e) + '&' + BaseCardFactory.getView().frompageurl;
                Guider.apply({
                    callback: function () {
                        Lizard.jump(url);
                    },
                    hybridCallback: function () {
                        Guider.jump({ url: url, targetModel: 'h5', title: '' });
                    }
                });
            },
            del: function (e) {
                BaseCardFactory.del(e, 'Visa');
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'Visa', function (data) {
                    if (data.paymentUrl) {
                        if (cUtilCommon.isInApp) {
                            var reg = /.*(\/webapp\/)(\w*)(\/)(.*)/;
                            var hybridpayurl = reg.exec(data.paymentUrl);
                            if (hybridpayurl && hybridpayurl[4]) {
                                if (hybridpayurl[4].indexOf('index.html') < 0) {
                                    hybridpayurl[4] = hybridpayurl[4][0] == '#' ? 'index.html' + hybridpayurl[4] : 'index.html#' + hybridpayurl[4];
                                    data.paymentUrl = hybridpayurl[1] + hybridpayurl[2] + hybridpayurl[3] + hybridpayurl[4];
                                }
                            }
                        }
                    }
                });
            }
        }
    });
});