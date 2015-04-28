// 团购 Card
define('tuancard', ['basecard', 'CommonStore', 'MyCtripModel', 'cUtilCryptBase64', 'myctripCommon'], function (BaseCardFactory, CommonStore, MyCtripModel, cUtilityCrypt, MyctripCommon) {
    return BaseCardFactory.getInstance({
        bizType: 'Tuan',
        timeConfig: {
            case1: { format: 1, entity: "TuanOrderItems", collection: ["ExpireDate"], booking: 0 },
            case2: { format: 1, entity: "TuanOrderItems", collection: ["TakeEffectDate"], booking: 0 }
        },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Delorder: { content: "删除", rankid: 1, isShow: [1, 1, 1, 1, 0], style: 0, action: "Tuan.del" },
            Closeorder: { content: "取消", rankid: 2, isShow: [1, 1, 1, 1, 0], style: 0, action: "Tuan.cancel" },
            PayBack: { content: "申请退款", rankid: 3, isShow: [1, 1, 1, 1, 0], style: 0, action: "Tuan.payBack" },
            Pay: { content: "去付款", rankid: 4, isShow: [1, 1, 1, 1, 0], style: 1, action: "Tuan.pay" }
        },
        process: function (data) {
            if (data && data.TuanOrderItems && data.TuanOrderItems[0]) {
                var items = data.TuanOrderItems[0];
                data.RobType = 'F';
                data.field = 'case1';
                data.TicketStatusesDesc = '';
                if (items.RobType) {
                    data.RobType = items.RobType;
                    data.field = items.RobType == 'Y' ? 'case2' : 'case1';
                }
                if (items.TicketStatusesDesc) {
                    data.TicketStatusesDesc = items.TicketStatusesDesc;
                }
            }
        },
        events: {
            detail: function (e) {
                if (BaseCardFactory.checkOfflineJump()) {
                    return;
                }
                //酒店团购非会员不能进详情页
                var loginStatus = MyctripCommon.checkLogin();
                if (loginStatus === 3 || loginStatus === 0) {
                    return;
                }
                /*6.4为团购景酒做兼容，6.5服务端区分H5和Hybrid之后删除该段代码*/
                var url = BaseCardFactory.getJumpUrl(e);
                if (url && url.indexOf('diyshx')) {
                    return BaseCardFactory.jump(e, url, 'index.html#/');
                }
                /***********************************************************/
                BaseCardFactory.jump(e);
            },
            payBack: function (e) {
                BaseCardFactory.jump(e);
            },
            del: function (e) {
                BaseCardFactory.del(e, 'Tuan');
            },
            pay: function (e) {
                BaseCardFactory.pay(e, 'Tuan');
            },
            cancel: function (e) {
                var self = BaseCardFactory.getView(),
                    li = $(e.currentTarget).closest("li"),
                    oid = li.data("oid"),
                    cancelModel = MyCtripModel.TuanOrderCancelModel.getInstance(),
                    userStore = CommonStore.UserStore.getInstance();
                cancelModel.setParam('Operator', {
                    SourceForm: "Online",
                    UID: userStore.getUser().LoginName
                });
                cancelModel.setParam("oid", oid);
                BaseCardFactory.cancel(e, cancelModel, function(data) {
                    if (data && data.ResponseStatus && data.ResponseStatus.Ack === "Success") {
                        var msg = data.messages && data.messages[0] ? data.messages[0].Text : "订单取消成功";
                        self.showToast({
                            datamodel: {
                                content: msg
                            },
                            hideAction: function () {
                                if (data.status && +data.status === 1) {
                                    self.onShow();
                                }
                            }
                        });
                    }
                });
            }
        }
    });
});