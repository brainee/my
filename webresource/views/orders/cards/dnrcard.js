// 美食 Card
define('dnrcard', ['basecard'], function (BaseCardFactory) {
    return BaseCardFactory.getInstance({
        bizType: 'Dnr',
        timeConfig: { format: 0, entity: "DnrOrderItems", collection: ["BeginUsageDate", "EndUsageDate"], booking: 0, relate: true },
        handlerConfig: {

        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e);
            }
        }
    });
});