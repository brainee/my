define(['commonlist', 'cUtilCommon', 'cGuiderService'], function (CommonListFactory, cUtilCommon, Guider) {
    return CommonListFactory.getInstance({
        pageid: '231013',
        hpageid: '231013',
        unionType: 'AwaitReview',
        viewType: 'uncommentorderlist',
        title: '待评价订单',
        bCustomizeHead: true,
        onShow: function (self) {
            if (!self.isOnline) {
                self.headerview.set({
                    title: '待评价订单',
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