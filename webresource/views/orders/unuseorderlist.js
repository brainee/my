define(['commonlist', 'MyCtripModel', 'cUtilCommon', 'cGuiderService'], function (CommonListFactory, MyCtripModel, cUtilCommon, Guider) {
    return CommonListFactory.getInstance({
        pageid: '214375',
        hpageid: '214375',
        unionType: 'NotTravel',
        viewType: 'unuseorderlist',
        title: '未出行订单',
        bCustomizeHead: true,
        onShow: function (self) {
            if (!self.isOnline) {
                self.headerview.set({
                    title: '未出行订单',
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