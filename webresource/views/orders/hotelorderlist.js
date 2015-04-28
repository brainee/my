define(['commonlist', 'cHybridFacade', 'myctripCommon', 'cUtility'], function (CommonListFactory, Facade, MyctripCommon, cUtility) {
    return CommonListFactory.getInstance({
        pageid: '231046', //之前212053
        hpageid: '231046',
        bizType: 'Hotel',
        viewType: 'hotelorderlist',
        bCustomizeHead: MyctripCommon.isTieYou() || false,
        title: '酒店订单',
        onShow: function (self) {
            var flag = Lizard.P('flag');
            if (self.referrer == "orders/search" && flag == "nocache") {
                return true;
            }
            Facade.register({
                tagname: Facade.METHOD_WEB_VEW_DID_APPEAR, callback: function (json) {
                    json = typeof json == "string" && json ? JSON.parse(json) : json;
                    if (json && json.callbackString) {
                        json = json.callbackString;
                        json = typeof json == "string" && json ? JSON.parse(json) : json;
                        if (json && json.from == 'hotel' && json.refresh == '1' && json.to == 'myctrip') {
                            self.onShow();
                        }
                    }
                }
            });
        }
    });
});