define(['cModel', 'cCoreInherit', 'MyCtripStore', "cUtilCommon", "CommonStore"], function (AbstractModel, cBase, MyCtripStore, cUtilCommon, CommonStore) {
    var M = {};
    var userInfo = CommonStore.UserStore.getInstance().getUser() || {};
    //业务Model,此类作用是重写url指向
    var BusinessModel = new cBase.Class(AbstractModel, {
        __propertys__: function () {
            this.param = {
                ClientVersion: '6.4',
                Channel: window.deviceEnv === 0?'Online':(cUtilCommon.isInApp ? 'Hybrid' : 'H5')
            }
        },
        initialize: function ($super, options) { },


        buildurl: function () {
            var baseurl = this.baseurl();
            var tempUrl = (baseurl.domain) + '/' + (baseurl.path) + (typeof this.url === 'function' ? this.url() : this.url);
            return tempUrl;
        },

        baseurl: function (protocol, interface) {
            var host = location.host;
            var domain = 'm.ctrip.com';
            var path = 'restapi';

            var domainarr = {
                https: {
                    damain: Lizard.restfullApiHttps,
                    path: "restapi"
                },
                http: {
                    common: {
                        domain: Lizard.restfullApi,
                        path: "restapi"
                    },
                    gateway: {
                        domain: Lizard.restfullApi,
                        path: "restapi"
                    }
                }
            };

            var protocoltemp = this.protocol || location.protocol;

            //使用当前环境地址
            domain = domainarr[protocoltemp][this.interface || "common"]["domain"];
            path = domainarr[protocoltemp][this.interface || "common"]["path"];

            return {
                'domain': domain,
                'path': path
            }
        }
    });

    var UnloginModel = new cBase.Class(AbstractModel, {
        __propertys__: function () {

        },
        initialize: function ($super, options) {
        },
        buildurl: function () {
            return this.url;
        }
    });

    M.SendValidateCodeModel = new cBase.Class(UnloginModel, {//发送短信验证码
        __propertys__: function () {
            this.method = 'POST';
            this.datatype = 'json';
            this.url = '/html5/ClientData/ValidVerifyCode/json';
            this.param = {};
        }
    });

    M.GetPicValCodeModel = new cBase.Class(UnloginModel, {//获取图片验证码
        __propertys__: function () {
            this.method = 'POST';
            this.datatype = 'json';
            this.url = '/html5/ClientData/GetVerifyCode/';
            this.param = {};
        }
    });

    M.CheckVerifyCodeModel = new cBase.Class(UnloginModel, {//获取短信验证码
        __propertys__: function () {
            this.method = 'POST';
            this.datatype = 'json';
            this.url='/html5/Custom/CheckVerifyCode';
            this.param = {};
        }
    });
    /********************************
    * @description:  机票取消订单Model
    * @author:
    */
    M.FlightCancelModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10400/Basic/Order/Cancel';//服务功能 订单取消
            this.method = 'POST';
            this.param = {};
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  公告查询Model
    * @author:       rhhu@Ctrip.com
    */
    M.CustomerNoticesListModel = new cBase.Class(BusinessModel, {//不分?
        __propertys__: function () {
            this.url = '/soa2/10060/GetNoticeInfo.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.debug = false;
            this.param = {
                "PublishDate": "1970-01-01 01:01:01",
                "NoticeType": 1
            };
            this.result = MyCtripStore.CustomerNoticesListStore.getInstance();
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  意见反馈Model
    */
    M.CustomeFeedbackModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10060/AddFeedbackInfo.json';
            this.interface = "gateway";
            this.debug = false;
            this.method = 'POST';
            this.param = {
                "BusinessType": 201,
                "Feedback": "",
                "Mobilephone": "",
                "SendDisplayName": "",
                "SendEMailAddress": ""
            };
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  取消酒店订单Model
    * @author:       fengk@Ctrip.com
    */
    M.CustomerHotelOrderCancelModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.param = {
                "ver": 1,
                "oid": 0,
                "reason": ""
            };
            this.isUserData = true;
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10324/hotel/order/cancel';//requestUrl
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  删除酒店订单Model
    * @author:       fengk@Ctrip.com
    */
    M.HideOrderModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = true;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10098/HideOrders.json';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  加急订单催单Model
    * @author:       fengk@Ctrip.com
    */
    M.CustomerHotelOrderUrgentModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = true;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10098/HandleHotelOrderReminder.json';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /******************************************
    * @description:  团购取消订单
    * @author     :
    */
    M.TuanOrderCancelModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10101/OrderCancel.json';
            this.interface = "gateway";
            this.method = 'POST';
            this.isUserData = true;
            this.param = {
                oid: 0
            };
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /******************************************
    * @description:  团购删除订单
    * @author     :
    */
    M.TuanOrderDeleteModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10101/OrderDelete.json';
            this.interface = "gateway";
            this.method = 'POST';
            this.isUserData = true;
            this.param = {
                oid: 0
            };
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  机场巴士取消订单
    * @author:       gongyq@Ctrip.com
    */
    M.AirportbusCancelModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10440/cancelorder.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  全球购取消订单
    * @author:       gongyq@Ctrip.com
    */
    M.GlobalBuyCancelModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10419/UpdateOrderStatus.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
     * @description:  礼品卡订单确认收货Model
     */
    M.CustomerLipinConfirmModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10140/restfulconfirmgoods.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  new出租车订单查询Model
    */
    M.CustomerTaxiListModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10098/GetTaxiOrders.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  高端商户取消订单
    */
    M.TopShopCancelModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10267/AppMyCtripOrderCancel.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  订单搜索查询Model
    */
    M.OrdersSearchModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10098/GetOrdersSearch.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  订单数目查询Model
    */
    M.OrderNumbersModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10098/GetOrderNumbers.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
    * 用户信息接口
    */
    M.UserInfoModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10098/GetMemberSummaryInfo.json';
            this.interface = "gateway";
            this.method = 'POST';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
    * 未出行等订单状态接口
    */
    M.OrderStatusModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10098/getmemberorderstatistics.json';
            this.interface = "gateway";
            this.method = 'POST';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
    * 未读信息数接口
    */
    M.UnreadMessageNumModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10364/GetMessageLists.json';
            this.method = 'POST';
            this.param = {
                "ChannelType": "H5",
                "BizType": "ALL",
                "MessageTab": "NULL",
                "MessageStatus": "NULL",
                "Operate": 1
            };
            this.interface = "gateway";
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
    * @description: 礼品卡取消订单Model
    * @author yjxu
    */
    M.LipinAbandonRebateModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10098/handlelipinorderabandonrebate.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
     * @description: 订单继续支付Model
     * @author yjxu
     */
    M.OrderPaymentModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10098/HandleOrderPayment.json';
            this.method = 'POST';
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  邮轮取消订单Model
    */
    M.CruiseCancelOrderModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10184/CancelOrder.json';
            this.interface = "gateway";
            this.method = 'POST';
            this.isUserData = true;

        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /*
     * @description:  景点门票取消订单Model
     */
    M.TicketCancelOrderModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = "/soa2/10131/OrderManagementQOC.json";
            this.method = 'POST';
            this.param = {
                "oid": 0,
                "reason": "行程不确定",
                "optype": "1"
            };
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /*
     * @description:  景点门票发送短信Model
     */
    M.TicketSendMessageModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = "/soa2/10131/SendMessageQOC.json";
            this.method = 'POST';
            this.param = {
                "oid": 0,
                "mbi": 0
            };
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /*
    * @description:  当地玩乐取消订单Model
    */
    M.ActivityCancelOrderModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = "/soa2/10220/OrderManagement.json";
            this.method = 'POST';
            this.param = {
                "oid": 0,
                "reason": "行程不确定",
                "optype": "1"
            };
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /*
    * @description:  当地玩乐发送短信Model
    */
    M.ActivitySendMessageModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = "/soa2/10220/SendMessage.json";
            this.method = 'POST';
            this.param = {
                "oid": 0,
                "mbi": 0
            };
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
     * @description: 验证是否登录Model
     * @author yjxu
     */
    M.ValidateAndGetNewTokenModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10093/ValidateAndGetNewToken.json';
            this.method = 'POST';
            this.param = {};
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
     * @description: 验证是否绑定微信，若绑定，自动关联微信并登陆
     * @author yjxu
     */
    M.ValidateWechatBindModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10060/WeiXinLogin.json';
            this.method = 'POST';
            this.param = {};
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
     * @description: 自动创建账号并绑定、关联微信和登录
     * @author yjxu
     */
    M.AutoCreateAccountModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10060/WeiXinRegister.json';
            this.method = 'POST';
            this.param = {};
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /**
     * @description: 绑定并关联微信
     * @author yjxu
     */
    M.RefreshRelationModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.debug = false;
            this.url = '/soa2/10060/WeiXinBind.json';
            this.method = 'POST';
            this.param = {};
            this.interface = "gateway";
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /*
     * @description:  小米联合登录Model
     */
    M.XiaomiAccountBindModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10060/MiLogin.json';
            this.interface = "gateway";
            this.param = {
            };
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /*
     * @description:  非会员查询check验证码Model
     */
    M.UnLoginCheckModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.url = '/soa2/10261/validatemobilephone.json';
            this.param = {
                "ver": 0,
                "AppID": 100
            };
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /*
     * @description:  非会员查询订单Model
     */
    M.UnLoginGetOrderModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            //this.url = '/soa2/10098/getnonmemberorders.json';
            this.url = '/soa2/10098/GetOrderByMobile.json';
            this.isUserData = true;
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });
    /********************************
    * @description:  我携首页最近收藏
    * @author:       fengk@ctrip.com
    */
    M.favoriteModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = true;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10279/json/GetMyFavorites';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });


    /********************************
    * @description:  关于 升级条栏、应用推荐条栏，我携 广告条栏
    * @author:       dcjin@ctrip.com
    */
    M.BasicConfInfoModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = false;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10606/GetBasicConfInfo.json';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  我携关于 升级检查
    * @author:       gongyq@ctrip.com
    */
    M.AppUpdateServiceModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = false;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10348/GetAppUpdateInfo.json';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  站内信接口Model
    * @author:       gongyq@Ctrip.com
    */
    M.GetMessageListsModel = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = true;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10612/GetMessageList.json';
            this.param = {
                "MsgType": "SERVICE",
                "Status": "NEW",
                "SortType": "TIME_DESC",
                "Options": "CONTENT_SUMMARY",
                "StartTime": '1970/1/1',
                "StartIndex": 0,
                "MaxRecords": 50
            };
            this.result = MyCtripStore.GetMessageListStore.getInstance();
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  欧铁取消订单
    * @author:       dcjin@ctrip.com
    */
    M.CancelOrder = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = false;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10487/CancelOrder.json';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    /********************************
    * @description:  欧铁退票
    * @author:       dcjin@ctrip.com
    */
    M.RecedeOrder = new cBase.Class(BusinessModel, {
        __propertys__: function () {
            this.isUserData = false;
            this.datatype = 'json';
            this.interface = "gateway";
            this.method = 'POST';
            this.url = '/soa2/10487/RecedeOrder.json';
        },
        initialize: function ($super, options) {
            $super(options);
        }
    });

    return M;
});