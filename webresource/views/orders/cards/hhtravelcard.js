// HHTravel(高端旅游) Card
define('hhtravelcard', ['basecard'], function(BaseCardFactory) {
    return BaseCardFactory.getInstance({
        bizType: 'HHTravel',
        timeConfig: { format: 1, entity: "HHTravelOrderItems", collection: ["UsageDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
        },
        events: {
            detail: function(e) {
                BaseCardFactory.jump(e);
            }
        }
    });
});