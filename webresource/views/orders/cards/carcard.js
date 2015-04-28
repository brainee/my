// 用车 Card
define('carcard', ['basecard'], function (BaseCardFactory) {
    return BaseCardFactory.getInstance({
        bizType: 'Car',
        timeConfig: { format: 0, entity: "CarOrderItems", collection: ["UsageDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Remove: { content: "删除", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: "Car.del" },
            Cancel: { content: "取消", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: "Car.guide" },
            Comment: { content: "点评", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: "Car.guide" },
            SearchComment: { content: "查看点评", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: "Car.guide" },
            ContinueBook: { content: "继续预订", rankid: 4, isShow: [1, 1, 0, 1, 0], style: 0, action: "Car.guide" }
        },
        events: {
            detail: function (e) {
                var url = BaseCardFactory.getJumpUrl(e);
                url = url.indexOf('/webapp/') === -1 && deviceEnv != 0 ? '/webapp' + url : url;
                BaseCardFactory.jump(e, url);
            },
            guide: function (e) {
                var url = BaseCardFactory.getJumpUrl(e);
                url = url.indexOf('/webapp/') === -1 && deviceEnv != 0 ? '/webapp' + url : url;
                BaseCardFactory.jump(e, url);
            },
            del: function (e) {
                BaseCardFactory.del(e, 'Car');
            }
        }
    });
});