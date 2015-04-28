// 旅游 Card
define('vacationcard', ['basecard', 'cUtilCommon', 'cGuiderService'], function (BaseCardFactory, cUtilCommon, Guider) {
    return BaseCardFactory.getInstance({
        bizType: 'Vacation',
        timeConfig: { format: 0, entity: "VacationOrderItems", collection: ["DepartureDate"], booking: 0 },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            ToPay: { content: "去付款", rankid: 13, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Vacation.pay' },
            Repeat: { content: "继续预订", rankid: 12, isShow: [1, 1, 0, 1, 0], style: 1, action: 'Vacation.guide' },
            ModifyOrder: { content: "修改", rankid: 11, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' },
            ModifyClient: { content: "修改旅客", rankid: 10, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' },
            ModifyInvoice: { content: "修改发票", rankid: 9, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' },
            Modify: { content: "修改联系人", rankid: 8, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' },
            TourAssistant: { content: "团队助手", rankid: 7, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.tourAssistant' },
            Comment: { content: "点评", rankid: 6, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' },
            Share: { content: "分享", rankid: 6, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Vacation.share' },
            ViewPKG: { content: "查看行程", rankid: 4, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.directToH5' },
            ViewConfirmation: { content: "查看确认单", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' },
            ViewTourNotice: { content: "出团说明", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.directToH5' },
            Cancel: { content: "取消", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' },
            HideOrder: { content: "删除", rankid: 0, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.del' },
            AddComment: { content: "追加点评", rankid: 5, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Vacation.guide' }
        },
        process: function (data) {
            //BaseCardFactory.getView().hasVacation = true;

            var orderStatus = ['已付款', '已出票', '已成交'];
            var status = data.OrderStatusName || '';
            if (data && data.OrderActions && !data.isOfflineOrder) {//离线订单未登录时不显示share按钮
                if ($.inArray(status, orderStatus) > -1) {
                    data.OrderActions.push({
                        ActionCode: 'Share',
                        ActionName: '分享'
                    })
                }
            }
        },
        afterFilterData: function (data) {//分享的内容
            data.shareItem = '';
            if (data && data.VacationOrderItems && data.VacationOrderItems[0] && data.DepartureDate && data.Passagers) {
                var length = data.Passagers.length;
                var passager = '';
                if (length) {
                    passager = (data.Passagers[0] || '') + (data.Passagers[0] && data.Passagers[1] ? '、' : '') + (data.Passagers[1] || '') + (length > 2 ? '等' : '');
                }
                data.shareItem = (data.VacationOrderItems[0].ProductName || '') + '|' +
                    (data.OrderTotalPrice || '') + '|' +
                    data.DepartureDate[0] + '日' + '|' +
                    (passager ? '，出行人是' + passager : '');
            }
        },
        events: {
            //查看行程，查看出团说明H5直连
            directToH5: function (e) {
                var url = BaseCardFactory.getJumpUrl(e),
                    self = BaseCardFactory.getView();
                //url = url + (url.indexOf('?') > -1 ? '&' + self.frompageurl : '?' + self.frompageurl);
                Guider.jump({ url: url, targetModel: 'h5', title: '' });
            },
            //继续预订，查看行程，出团说明，点评，取消都是跳转下发链接
            guide: function (e) {
                BaseCardFactory.jump(e);
            },
            detail: function (e) {//点击order-cont跳转详情页，默认方法名‘detail’
                BaseCardFactory.jump(e);
            },
            del: function (e) {//basecard中提供删除的方法
                BaseCardFactory.del(e, 'Vacation');
            },
            share: function (e) {
                var param = $(e.currentTarget).closest("li").data('share').split('|') || '';
                if (param instanceof Array) {
                    var title = param[0].length > 15 ? param[0].substring(0, 15) + '...' : param[0];
                    var text = '携程旅行客户端帮我预订了' + param[0] + '总价为' + param[1] + '元，' + param[2] + '出发' + param[3] + '。';
                    BaseCardFactory.share({ title: title, text: text });
                }
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'Vacation', function (data) {
                    if (data.paymentUrl) {
                        if (cUtilCommon.isInApp) {
                            var reg = /.*(\/webapp\/)(\w*)(\/)(.*)/;
                            var hybridpayurl = reg.exec(data.paymentUrl);
                            if (hybridpayurl && hybridpayurl[4]) {
                                if (hybridpayurl[4].indexOf('index.html#') < 0) {
                                    data.paymentUrl = hybridpayurl[1] + hybridpayurl[2] + hybridpayurl[3] + 'index.html#' + hybridpayurl[4];
                                }
                            }
                        }
                    }
                });
            },
            tourAssistant: function (e) {//团队助手H5直连
                var self = BaseCardFactory.getView(),
                    url = BaseCardFactory.getJumpUrl(e);
                url += url.indexOf('?') > -1 ? '&' : '?';
                self.jump(url + self.frompageurl);
            }
        }
    });
});