define(['cStore', 'cCoreInherit'], function (AbstractStore, cBase) {
    var S = {};


    S.FlightOrderParamStore = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'USER_FLIGHT_ORDERPARAM';
            this.lifeTime = '1D';
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    //用户从国际机票订单详情返回时，判断跳转至哪页
    S.FltintlOrderId = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'fltintlOrderId';
            this.lifeTime = '1D';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    //公告列表
    S.CustomerNoticesListStore = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'MYCTRIP_NOTICES_LIST';
            this.lifeTime = '3M';
            this.isUserData = true; //若用户更换帐号后，自动清除
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    //公告列表的最后出版时间
    S.CustomerNoticesDateStore = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'MYCTRIP_NOTICES_DATE';
            this.lifeTime = '365D';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    //公告详情
    S.CustomerNoticesDetailStore = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'MYCTRIP_NOTICES_DETAIL';
            this.lifeTime = '1D';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /****************************************
    * @description:  hotel orderid
    * @author:       zhang_f@Ctrip.com
    */
    S.CustomerHotelOrderId = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'CUSTOMER_HOTELORDER_ID';
            this.lifeTime = '5H';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    //未读消息数
    S.UnreadMessageNumStore = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'UNREAD_MESSAGE_NUM';
            this.lifeTime = '1M';
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  站内信接口Store
    * @author:       gongyq@Ctrip.com
    */
    S.GetMessageListStore = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'MESSAGE_LIST';
            this.lifeTime = '2S';
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /*描述：订单列表后退 store
      作者：yjxu
      日期：2014-10-14
    */
    S.OrderlistBackStore = new cBase.Class(AbstractStore, {
        __propertys__: function () {
            this.key = 'ORDERLIST_BACK';
            this.lifeTime = '1D';
            this.isUserData = true; //若用户更换帐号后，自动清除
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    return S;
});
