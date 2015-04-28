// 出租车 Card
define('taxicard', ['basecard'], function (BaseCardFactory) {
    return BaseCardFactory.getInstance({
        bizType: 'Taxi',
        timeConfig: { format: 0, entity: "TaxiOrderItems", collection: ["UsageDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Cancel: { content: "取消", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Taxi.cancel' }
        },
        events: {
            detail: function (e) {
                //未登录下的离线订单不能进详情页
                if (BaseCardFactory.checkOfflineJump()) {
                    return;
                }

                var url = $(e.currentTarget).data('url'),
                    orderId = $(e.currentTarget).closest("li").data('oid');
                if (!url) {
                    url = '/car/#taxiorderdetail!orderlist?id=' + orderId;
                }
                url = url.indexOf('/webapp/') === -1 ? '/webapp' + url : url;
                BaseCardFactory.jump(e, url);
            },
            cancel: function (e) {
                var url = BaseCardFactory.getJumpUrl(e);
                url = url.indexOf('/webapp/') === -1 ? '/webapp' + url : url;
                BaseCardFactory.jump(e, url);
            }
        }
    });
});