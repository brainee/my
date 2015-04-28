// 高尔夫 Card
define('golfcard', ['basecard', 'cUtilHybrid'], function (BaseCardFactory, cUtilHybrid) {
    return BaseCardFactory.getInstance({
        bizType: 'Golf',
        timeConfig: { format: 0, entity: "GolfOrderItems", collection: ["UsageDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示

        },
        events: {
            detail: function (e) {
                var from = BaseCardFactory.getView().frompageurl,
                    url = BaseCardFactory.getJumpUrl(e);

                //高尔夫订单只有fat环境，且是fat62    H5直接跳转，hybrid解析跳转
                if (window.location.host.match(/^m\.fat\d*\.qa\.nt\.ctripcorp\.com|^210\.13\.100\.191/i)) {
                    url += url.indexOf('?') > -1 ? '&' : '?';
                    return Lizard.jump(url + from);
                }
        		BaseCardFactory.jump(e);
        	}
        }
    });
});