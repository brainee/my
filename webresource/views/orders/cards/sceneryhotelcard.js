// 酒店+景点 Card
define('sceneryhotelcard', ['basecard'], function (BaseCardFactory) {
    return BaseCardFactory.getInstance({
        bizType: 'SceneryHotel',
        timeConfig: { format: 0, entity: "PiaoOrderItems", collection: ["DepartureDate"], booking: 0 },
        handlerConfig: {
            HideOrder: { content: "删除", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'SceneryHotel.hideOrder' }
        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e, '', 'index.html#/');
            },
            hideOrder: function (e) {//删除
                BaseCardFactory.del(e, 'SceneryHotel');
            }
        }
    });
});