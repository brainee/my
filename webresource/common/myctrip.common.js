define(['CommonStore', 'cLocalStorage', 'cHybridShell', 'cUtilCommon', 'cGuiderService'], function (CommonStore, cStorage, cHybridShell, cUtilCommon, Guider) {
    if (!String.prototype.toDate) {//string类型(处理json格式的日期)
        String.prototype.toDate = function (z) {
            var localOffset = new Date().getTimezoneOffset() * 60000 + (z ? z : 0) * 60 * 60000;
            if (isNaN(this)) {
                var d = this.replace(/\D/igm, "").substring(0, 13);
                var fmt = new Date(parseInt(d) + localOffset);
                return fmt;
            } else {
                console.log('wrong parameters!');
                return this;
            }
        };
    }
    if (!Date.prototype.ZoneDate) {//Date类型
        Date.prototype.ZoneDate = function (z) {
            var localOffset = new Date().getTimezoneOffset() * 60000 + (z ? z : 0) * 60 * 60000; //相对于8时区偏移量
            var d = this.getTime();
            var fmt = new Date(d + localOffset); //所在时区+相对于8时区的偏移量
            return fmt;
        };
    }
    var common = {
        /**
        *  获取当前环境
        *  isInApp: bool
        *  isOnline: bool
        *  isPad: bool//app或非app中
        *  isMobile: bool//app或非app中
        */
        isInApp: cUtilCommon.isInApp,
        isOnline: deviceEnv === 0,
        isPad: cUtilCommon.isInApp ? deviceEnv === 10 : deviceEnv === 11,
        isMobile: cUtilCommon.isInApp ? deviceEnv === 20 : deviceEnv === 21,
        /**
         *  判断是否登录。
         *  返回值: 0. 未登录
         *          1. 会员登录
         *          2. 非会员登录(分为2种,手机号码查询，和老的非会员，对我携来说没有区别)
         */
        checkLogin: function () {
            var result = 0,
                userStore = CommonStore.UserStore.getInstance(),
                userInfo = userStore ? userStore.getUser() : null;
            //会员登录优先级最高，如果已登录则忽略其他状态
            if (userInfo && userInfo.Auth && !userInfo.IsNonUser) {
                return 1;
            }
            //老的非会员登录方式
            if (userInfo && userInfo.Auth && userInfo.IsNonUser) {
                return 2;
            }
            return 0;
        },
        //是否接入新的手机号码查询
        isJoinMobileSearch: function (biztype) {
            //非会员接入只要改这里就可以
            var nonUserList = ['hotel', 'tuan'];
            biztype = typeof biztype === 'string' ? biztype.toLowerCase() : '';
            //目前只做H5的手机号码查询，app的情况先过滤掉
            return !this.isInApp && nonUserList.indexOf(biztype) > -1;
        },
        //是否是新的非会员
        isunlogin: function (bizType) {
            var isunlogin = this.checkLogin();
            //目前只做H5的手机号码查询，app的情况先过滤掉
            if (!this.isInApp && isunlogin && isunlogin === 2 && this.isJoinMobileSearch(bizType)) {
                return true;
            }
            return false;
        },
        isTieYou: function () {//来源是否是铁友
            var isTieYou = Lizard.P('istieyou') || localStorage.getItem("isTieYou");
            if (isTieYou == "true") {
                localStorage.setItem("isTieYou", true);
                return true;
            }
            localStorage.removeItem("isTieYou");
            return false;
        },
        getOrderTypeList: function (isOnline) {
            //flag标识环境：3-H5和Online都存在此订单，2-H5不存在此订单但Online存在，1-H5存在此订单但Online不存在
            var orderTypes = [
                { flag: 3, name: '全部订单', classname: 'o-all', biztype: 'All', url: 'orders/allorders' },
                { flag: 3, name: '酒店订单', classname: 'o-hotel', biztype: 'Hotel', url: 'orders/hotelorderlist' },
                { flag: 3, name: '机票订单', classname: 'o-flight', biztype: 'Flight', url: 'orders/flightorderlist' },
                { flag: 3, name: '火车票订单', classname: 'o-train', biztype: 'Train', url: 'orders/trainorderlist' },
                //{ flag: 3, name: '旅游订单', classname: 'o-team', biztype: 'Vacation', url: 'orders/tuantravelorderlist' },
                { flag: 3, name: '旅游度假订单', classname: 'o-team', biztype: ['Cruise', 'DIY', 'Vacation'], url: 'orders/vacationunionorderlist' },
                { flag: 3, name: '团购订单', classname: 'o-tuan', biztype: 'Tuan', url: 'orders/tuanorderlist' },
                { flag: 3, name: '景点门票订单', classname: 'o-ticket', biztype: 'Piao', url: 'orders/ticketsorderlist' },
                { flag: 3, name: '当地玩乐订单', classname: 'o-event', biztype: 'Activity', url: 'orders/localeventorderlist' },
                { flag: 1, name: '用车订单', classname: 'o-car', biztype: ['Car', 'CarTaxi'], url: 'orders/carunionorderlist' },
                // { flag: 2, name: '用车订单', classname: 'o-car', biztype: 'Car', url: 'orders/carorderlist' },
                // { flag: 2, name: '出租车订单', classname: 'o-taxi', biztype: 'Taxi', url: 'orders/taxiorderlist' },
                //{ flag: 3, name: '自由行订单', classname: 'o-free', biztype: 'DIY', url: 'orders/selftravelorderlist' },
                { flag: 3, name: '酒店+景点订单', classname: 'o-spots', biztype: 'SceneryHotel', url: 'orders/sceneryhotelorderlist' },
                //{ flag: 3, name: '邮轮订单', classname: 'o-cruise', biztype: 'Cruise', url: 'orders/cruiseorderlist' },
                { flag: 1, name: '签证订单', classname: 'o-visa', biztype: 'Visa', url: 'orders/visaorderlist' },
                { flag: 3, name: '礼品卡订单', classname: 'o-gcard', biztype: 'Lipin', url: 'orders/travelticketorderlist' },
                { flag: 1, name: '高端商户订单', classname: 'o-food', biztype: 'TopShop', url: 'orders/topshoporderlist' },
                { flag: 2, name: '美食订餐订单', classname: 'o-dnr', biztype: 'Dnr', url: 'orders/dnrorderlist' },
                { flag: 3, name: '汽车票订单', classname: 'o-bus', biztype: 'QiChe', url: 'orders/busorderlist' },
                { flag: 3, name: '保险订单', classname: 'o-insurance', biztype: 'VacationInsurance', url: 'orders/insureorderlist' },
                { flag: 3, name: '高尔夫订单', classname: 'o-golf', biztype: 'Golf', url: 'orders/golforderlist' },
                { flag: 3, name: '机场巴士订单', classname: 'o-airportbus', biztype: 'AirportBus', url: 'orders/airportbusorderlist' },
                { flag: 3, name: 'HHTravel订单', classname: 'o-hhtravel', biztype: 'HHTravel', url: 'orders/hhtravelorderlist' },
                { flag: 1, name: '礼遇商城订单', classname: 'o-gcardmall', biztype: 'Mall', url: 'orders/mallorderlist' },
                { flag: 3, name: '全球购订单', classname: 'o-global', biztype: 'GlobalBuy', url: 'orders/globalbuyorderlist' },
                { flag: 2, name: '存款证明订单', classname: 'o-certificate', biztype: 'Deposit', url: 'orders/depositorderlist' }
            ];
            if (typeof isOnline === 'undefined' || isOnline === false) {
                isOnline = false;
            } else {
                isOnline = true;
            }
            orderTypes = $.grep(orderTypes, function (item, index) {
                if (isOnline) {
                    if (item.flag === 2 || item.flag === 3) {
                        return true;
                    }
                } else {
                    if (item.flag === 1 || item.flag === 3) {
                        return true;
                    }
                }
            });
            return orderTypes;
        },
        sendUbtTrace: function (params) {
            /*  Hybrid页监控  - 取数
            *   使用native vs Hybrid API：CtripBusiness.app_send_ubt_trace。页面带的配置信息，可自定义，会传到UBT server，由BI分析。since 6.1
            *   所需参数：
                traceName：名称(需注册)
                pageId：页面pageid
                pageName：页面名称
                bServerError：是否是服务端错误
                err：错误对象
            */
            if (cUtilCommon.isInApp) {
                var NEEDED_PARAMS = ['traceName', 'pageId', 'pageName', 'bServerError', 'err'];
                NEEDED_PARAMS.forEach(function (param) {
                    if (params.hasOwnProperty(param)) {
                        if (params[param] === undefined) {
                            console.error('Some Params missed');
                            return;
                        }
                    }
                });

                var isAllorders = params.pageName === 'allorders' ? true : false;
                var tags = {
                    pageName: params.pageName,
                    pageId: params.pageId
                };

                if (params.bServerError) {
                    tags.msg = JSON.stringify(params.err);
                    cHybridShell.Fn('send_ubt_trace').run(params.traceName, tags);
                } else {
                    Guider.app_check_network_status({
                        callback: function (data) {
                            if (data && data.hasNetwork) {
                                tags.msg = 'Abort error';
                            } else {
                                if (isAllorders) {//全部订单无网络情况下进离线订单
                                    return;
                                }
                                tags.msg = 'Network error';
                            }
                            cHybridShell.Fn('send_ubt_trace').run(params.traceName, tags);
                        }
                    });
                }
            }
        },
        /*
        *   所需参数
        *   options：{
                onlineCallback : online回调,
                callback : H5回调,
                hybridCallback : hybrid回调
            }
        */
        apply: function (options) {
            var isOnline = deviceEnv === 0;
            if (options && typeof options === 'object') {
                if (isOnline) {
                    options.onlineCallback && typeof options.onlineCallback === 'function' && options.onlineCallback();
                } else {
                    delete options.onlineCallback;
                    Guider.apply(options);
                }
            }
        }
    };
    return common;
});
