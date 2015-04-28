define(['commonlist', 'MyCtripModel'], function (CommonListFactory, MyCtripModel) {
    return CommonListFactory.getInstance({
        pageid: '',
        hpageid: '',
        isAggregated: true,
        bizType: ['Car', 'CarTaxi'],
        viewType: 'carunionorderlist',
        title: '用车订单'
    });
});