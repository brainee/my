define(['commonlist', 'cUtilCommon', 'cGuiderService'], function (CommonListFactory, cUtilCommon, Guider) {
    return CommonListFactory.getInstance({
        pageid: '231014',
        hpageid: '231014',
        unionType: 'AwaitPay',
        viewType: 'unpaidorderlist',
        title: '待付款订单',
        bCustomizeHead: true,
        onShow: function (self) {
            if (!self.isOnline) {
                self.headerview.set({
                    title: '待付款订单',
                    back: true,
                    view: self,
                    events: {
                        returnHandler: function () {
                            Guider.apply({ callback: function () {
                                self.jump('/webapp/myctrip');
                            }, hybridCallback: function () {
                                Guider.backToLastPage();
                            }
                            });
                        }
                    }
                });
            }
        }
    });
});