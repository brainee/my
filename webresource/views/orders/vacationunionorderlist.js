/**
 * Created by jl.gu on 2015/4/27.
 */
define(['commonlist', 'MyCtripModel'], function (CommonListFactory, MyCtripModel) {
    return CommonListFactory.getInstance({
        pageid: '',
        hpageid: '',
        isAggregated: true,
        bizType: ['DIY','Cruise', 'Vacation'],
        viewType: 'vacationunionorderlist',
        title: '旅游度假订单'
    });
});