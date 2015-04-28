define(['commonlist', 'MyCtripModel'], function (CommonListFactory, MyCtripModel) {
    return CommonListFactory.getInstance({
        pageid: '214332',
        hpageid: '214332',
        bizType: 'Taxi',
        viewType: 'taxiorderlist',
        entityName: 'TaxiOrderEntities',
        title: '出租车订单',
        listModel: MyCtripModel.CustomerTaxiListModel.getInstance()
    });
});