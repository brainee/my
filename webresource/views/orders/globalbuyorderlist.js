// 全球购订单
define(['commonlist'], function (CommonListFactory) {
    return CommonListFactory.getInstance({
        pageid: '',
        hpageid: '',
        bizType: 'GlobalBuy',
        viewType: 'globalbuyorderlist',
        title: '全球购订单'
    });
});