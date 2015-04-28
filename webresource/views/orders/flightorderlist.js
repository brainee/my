define(['commonlist'], function (CommonListFactory) {
    return CommonListFactory.getInstance({
        pageid: '231044',
        hpageid: '231044',
        bizType: 'Flight',
        viewType: 'flightorderlist',
        title: '机票订单',
        onShow: function (self) {
            var flag = Lizard.P('flag');
            if (self.referrer == "orders/search" && flag == "nocache") {
                return true;
            }
        }
    });
});