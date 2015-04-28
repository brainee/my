define(['commonlist'], function (CommonListFactory) {
    return CommonListFactory.getInstance({
        pageid: '231060',
        hpageid: '231060',
        bizType: 'Lipin',
        viewType: 'travelticketorderlist',
        title: '礼品卡订单',
        onAfterRequest: function (self, data, bFirst) {
            if (data && data.Result && data.Result.ResultCode == 0) {
                if (data.LipinOrderEntities && data.LipinOrderEntities.length > 0) {
                    var item = null;
                    for (var i = 0, len = data.LipinOrderEntities.length; i < len; i++) {
                        item = data.LipinOrderEntities[i];
                        if (item["OrderID"] != null) {
                            item["OrderID"] = this.zeroFill(item["OrderID"], 9); //补充为9位
                        } else {
                            item["OrderID"] = "";
                        }
                    }
                }
            }
        },
        zeroFill: function (num, n) {//填充位数
            var len = num.toString().length;
            while (len < n) {
                num = "0" + num;
                len++;
            }
            return num;
        }
    });
});