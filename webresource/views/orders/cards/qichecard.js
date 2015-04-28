// 汽车票 Card
define('qichecard', ['basecard', 'CommonStore', 'cGuiderService'], function (BaseCardFactory, CommonStore, Guider) {
    return BaseCardFactory.getInstance({
        bizType: 'QiChe',
        timeConfig: { format: 0, entity: "QicheOrderItems", collection: ["DepartureDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Pay: { content: "去付款", rankid: 4, isShow: [1, 1, 0, 1, 0], style: 1, action: 'QiChe.pay' },
            Cancel: { content: "取消", rankid: 1, isShow: [1, 1, 1, 1, 0], style: 0, action: 'QiChe.detail' },
            Consult: { content: "在线咨询", rankid: 3, isShow: [1, 1, 1, 1, 0], style: 0, action: 'QiChe.consult' },
            RecommendReturnTicket: { content: "返程推荐", rankid: 2, isShow: [1, 1, 1, 0, 0], style: 0, action: 'QiChe.recommend' },
            Delete: { content: '删除', rankid: 0, isShow: [1, 1, 1, 1, 0], style: 0, action: 'QiChe.hideOrder' }
        },
        process: function (data) {
            var QicheOrderItems = data[this.timeConfig.entity];
            data.depQicheInfo = (QicheOrderItems instanceof Array && QicheOrderItems.length) ? QicheOrderItems[0] : {};

            var depStationName = data.depQicheInfo.DepartureStationName,
                depCityName = data.depQicheInfo.DepartureCityName,
                arrStationName = data.depQicheInfo.ArrivalStationName,
                arrCityName = data.depQicheInfo.ArrivalCityName;

            data.depQicheInfo.departureDisplayName = depStationName && depStationName.indexOf(depCityName) === 0 ? depStationName || '' : (depCityName + depStationName) || '';
            data.depQicheInfo.arrivalDisplayName = arrStationName && arrStationName.indexOf(arrCityName) === 0 ? arrStationName || '' : (arrCityName + arrStationName) || '';

            //汽车票到达时间特殊处理 "09-21 17:50"
            if (data.depQicheInfo && data.depQicheInfo.ArriveTime && data.depQicheInfo.ArriveTime.length > 0) {
                var time = data.depQicheInfo.ArriveTime;
                var results = time.match(/^(\d{1,2})\-(\d{1,2})\s+(\d{1,2})\:(\d{1,2})$/);
                var d = '';
                var f = function (d) {
                    return d < 10 ? '0' + d : d;
                }
                //return ['09-21','17:50']
                if (results) {
                    data.depQicheInfo.ArriveTime = [f(+results[1]) + '-' + f(+results[2]), f(+results[3]) + ':' + f(+results[4])];
                } else {
                    data.depQicheInfo.ArriveTime = '';
                }
            }
        },
        events: {
            detail: function (e) {
                BaseCardFactory.jump(e);
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'QiChe');
            },
            consult: function (e) {//订单咨询直接跳线上铁友的地址
                var self = BaseCardFactory.getView(),
                    url = BaseCardFactory.getJumpUrl(e),
                    headStore = CommonStore.HeadStore.getInstance(),
                    token = headStore.get().auth || '',
                    result = /(.*[&|?]token=)(\w*)(&?.*)/.exec(url);
                if (result) {
                    url = result[1] + token + result[3];
                }
                Guider.jump({ url: url, targetModel: 'h5', title: '在线咨询' });
            },
            recommend: function (e) {
                BaseCardFactory.jump(e);
            },
            hideOrder: function (e) {
                BaseCardFactory.del(e, 'QiChe');
            }
        }
    });
});
