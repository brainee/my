// 酒店 Card
define('hotelcard', ['basecard', 'MyCtripModel', 'cGuiderService', 'myctripCommon'], function (BaseCardFactory, MyCtripModel, Guider, MyctripCommon) {
    return BaseCardFactory.getInstance({
        bizType: 'Hotel',
        timeConfig: { format: 0, entity: "HotelOrderItems", collection: ["CheckInDate", "CheckOutDate"], booking: 0, relate: true },
        handlerConfig: {//isshow[isapp,ish5,isnulogin,isyoung,istieyou] 1:显示 0:不显示
            Commit: { content: "继续预订", rankid: 8, isShow: [1, 0, 0, 1, 0], style: 1, action: 'Hotel.commit' },
            Modify: { content: "修改", rankid: 7, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Hotel.modify' },
            Extend: { content: "办理延住", rankid: 6, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Hotel.extend' },
            MakeUrgent: { content: "加急处理", rankid: 5, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Hotel.makeUrgent' },
            Share: { content: "分享", rankid: 4, isShow: [1, 0, 0, 1, 0], style: 0, action: 'Hotel.share' },
            AddComment: { content: "点评", rankid: 3, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Hotel.addComment' },
            Cancel: { content: "取消", rankid: 2, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Hotel.cancel' },
            HideOrder: { content: "删除", rankid: 1, isShow: [1, 1, 0, 1, 0], style: 0, action: 'Hotel.hideOrder' }
        },
        process: function (data) {//酒店增加share按钮
            //离线订单未登录时不显示share按钮
            if (data && data.OrderActions && !data.isOfflineOrder) {
                data.OrderActions.push({
                    ActionCode: 'Share',
                    ActionName: '分享'
                })
            }
        },
        afterFilterData: function (data) {//分享的内容
            if (data && data.HotelOrderItems && data.HotelOrderItems[0] && data.CheckInDate && data.CheckOutDate) {
                var currency = data.Currency;
                if (currency == "CNY" || currency == "RMB") {
                    currency = '¥';
                }
                data.shareItem = [
                    data.OrderName,
                    currency + data.OrderTotalPrice,
                    data.HotelOrderItems[0].RoomAmount,
                    data.HotelOrderItems[0].RoomType,
                    data.HotelOrderItems[0].HotelAddress,
                    data.CheckInDate[0],
                    data.CheckOutDate[0]
                ].join('|');
            }
        },
        events: {
            addComment: function (e) {//点评
                var self = BaseCardFactory.getView(),
                    li = $(e.currentTarget).closest("li"),
                    newName = li.data("name"),
                    newOrderid = li.data("oid"),
                    newHotelid = li.data("hotelid"),
                    value = {
                        value: {
                            oid: newOrderid,
                            hotelId: newHotelid,
                            hotelName: newName,
                            url: "/webapp/myctrip/orders/" + self.viewType
                        }
                    };
                if (self.viewType == 'searchresult' || self.viewType == 'home') {
                    value.value.url = decodeURIComponent(self.frompageurl.slice(5));
                }
                localStorage.setItem("CUSTOMER_HOTELORDER_ID", JSON.stringify(value));
                Guider.jump({ targetModel: 'app', url: '/webapp/hotel/ordercomment', module: "HotelCommentSubmit", param: { hotelId: newHotelid, orderId: newOrderid, hotelName: newName } });
            },
            extend: function (e) {//办理延住
                //只跳转native
                var newOrderid = $(e.currentTarget).closest("li").data("oid");
                Guider.jump({
                    targetModel: 'app',
                    module: 'hotel_inland_delayorder',
                    param: { c1: newOrderid }
                });
            },
            cancel: function (e) {//取消
                var self = BaseCardFactory.getView(),
                    cancelModel = MyCtripModel.CustomerHotelOrderCancelModel.getInstance(),
                    li = $(e.currentTarget).closest("li");
                cancelModel.setParam('oid', li.data("oid"));
                BaseCardFactory.cancel(e, cancelModel, function (data) {
                    if (data.res) {
                        self.showToast({
                            datamodel: {
                                content: '订单取消成功'
                            },
                            hideAction: function () {
                                self.onShow();
                            }
                        });
                    } else {
                        self.showToast('订单取消失败');
                    }
                });
            },
            modify: function (e) {//修改订单
                //只跳转native
                var orderId = $(e.currentTarget).closest("li").data("oid");
                Guider.jump({
                    targetModel: 'app',
                    module: 'hotel_inland_modifyorder',
                    param: { c1: orderId, c2: "0" }
                });
            },
            makeUrgent: function (e) {//订单加急
                var self = BaseCardFactory.getView(),
                    orderlistMakeUrgentModel = MyCtripModel.CustomerHotelOrderUrgentModel.getInstance(),
                    newOrderid = $(e.currentTarget).closest("li").data("oid");
                self.showLoading();
                self.showMessage({
                    datamodel: {
                        content: '您的订单已加急,请耐心等待'
                    },
                    okAction: function () {
                        this.hide();
                        self.onShow();
                    }
                });
                orderlistMakeUrgentModel.setParam('OrderID', newOrderid);
                orderlistMakeUrgentModel.excute(function (data) {
                    if (data.Result["ResultCode"] == "0") {
                        self.hideLoading();
                        self.confirm.show();
                    } else {
                        self.hideLoading();
                        self.showToast('订单加急失败，请您稍后再试');
                    }
                    self.hideLoading();
                }, function (e) {
                    self.hideLoading();
                    self.showToast('加载失败，请稍后再试');
                }, true, self, function () {
                    self.hideLoading();
                    self.showToast('操作失败，请稍后再试');
                });
            },
            commit: function (e) {//继续预定
                //只hybrid跳转
                var newOrderid = $(e.currentTarget).closest("li").data("oid");
                Guider.jump({
                    targetModel: 'app',
                    module: 'hotel_inland_modifyorder',
                    param: { c1: newOrderid, c2: "1" }
                });
            },
            detail: function (e) {//详情页
                //未登录下的离线订单不能进详情页
                if (BaseCardFactory.checkOfflineJump()) {
                    return;
                }
                //酒店团购非会员不能进详情页
                var loginStatus = MyctripCommon.checkLogin();
                if (loginStatus === 3 || loginStatus === 0) {
                    return;
                }
                var self = BaseCardFactory.getView(),
                orderid = $(e.currentTarget).closest("li").data("oid"),
                tokenurl = (self.token == "" || self.token == undefined) ? "" : "&token=" + self.token,
                allianceId = '&allianceid=23823&sid=458871',
                url = '/webapp/hotel/orderdetail?orderid=' + orderid + "&" + self.frompageurl + tokenurl;
                if (MyctripCommon.isTieYou()) {
                    url = '/webapp/hotel/orderdetail?orderid=' + orderid + allianceId + "&" + self.frompageurl + tokenurl;
                }
                Guider.jump({
                    targetModel: 'app',
                    url: url,
                    module: "NormalHotelOrder",
                    param: { orderId: orderid }
                });
            },
            hideOrder: function (e, orderid) {//删除
                BaseCardFactory.del(e, 'HotelDomestic');
            },
            share: function (e) {
                var param = $(e.currentTarget).closest("li").data('share').split('|') || '';
                if (param instanceof Array) {
                    var text = '携程旅行客户端帮我预订了' + param[0] + '总价为' + param[1] + '元的' + param[2] + '间' + param[3] + '。地址：' + param[4] + '，日期：' + param[5] + '至' + param[6] + '。';
                    BaseCardFactory.share({ title: '推荐携程酒店', text: text });
                }
            }
        }
    });
});