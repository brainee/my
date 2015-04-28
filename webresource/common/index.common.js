define(['MyCtripModel', 'cHybridShell', 'cardloader'], function (MyCtripModel, cHybridShell, Card) {
    var redSpotModel = MyCtripModel.GetMessageListsModel.getInstance();//request messageCenter information
    var fortuneModel = MyCtripModel.UserInfoModel.getInstance();//request member account information
    var orderStatusModel = MyCtripModel.OrderStatusModel.getInstance();//request orderstatsu information
    var OrdersSearchModel = MyCtripModel.OrdersSearchModel.getInstance();//request order list
    var favoriteModel = MyCtripModel.favoriteModel.getInstance();//request favorite list
    /*
    *  member lelvl configration
    */
    var vipRules = {
        0: [0, '普通', 'ordinary'],
        10: [2000, '金牌', 'gold'],
        20: [8000, '白金', 'platinum'],
        30: [20000, '钻石', 'diamond']
    };

    var fnGetDateFormat = function (fmt) {
        var self = new Date();
        var o = {
            "M+": self.getMonth() + 1, //月份
            "d+": self.getDate(), //日
            "h+": self.getHours(), //小时
            "m+": self.getMinutes(), //分
            "s+": self.getSeconds(), //秒
            "q+": Math.floor((self.getMonth() + 3) / 3), //季度
            "S": self.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (self.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    var common = {
        /**
         * This function read basic userinfo from localDB & handle it
         * @method handleBaseUserInfo
         * @return {Object}
         * userName : {String} username,
         * grade : {String} memberlelvl,
         * lvlName : {String} memberlelvl content,
         * degree : {Array}[current lelvl , next lelvl]
         */
        handleBaseUserInfo: function () {
            var userInfoStr = localStorage.getItem('USERINFO');
            var userInfo = userInfoStr && JSON.parse(userInfoStr);
            userInfo = userInfo && userInfo.data;
            if (userInfo && typeof (userInfo.VipGrade) != 'undefined' && typeof (userInfo.UserName) != 'undefined') {
                var userName = userInfo.UserName ? userInfo.UserName : '尊敬的会员';
                var degree = ['普通', '金牌'];
                var grade = +userInfo.VipGrade > 0 && +userInfo.VipGrade < 10 ? 10 : +userInfo.VipGrade;
                degree = [vipRules[(+grade === 30 ? 20 : +grade)][1], vipRules[(+grade === 30 ? 30 : +grade + 10)][1]];

                return {
                    userName: userName,
                    grade: vipRules[grade][2],
                    lvlName: vipRules[grade][1] + '会员',
                    degree: degree
                };
            }
        },
        /**
         * This function for requesting information of messageCenter
         * @method requestMessageInfo
         * @param {function} this function will run when dataInterface return information successfully,other status won't run callback
         * @callback(data) {recent three messages,if exsist unread message or not }
        */
        requestMessageInfo: function (callback) {
            var sChannelType = '';
            if (window.deviceEnv === 0) {//pad for h5, online for h5
                sChannelType = 'ONLINE';
            } else {//pad for hybrid and mobile
                sChannelType = 'MOBILE';
            }
            redSpotModel.setParam({
                'ChannelType': sChannelType,
                'EndTime': fnGetDateFormat("yyyy-MM-dd hh:mm:ss")
            });
            redSpotModel.excute(function (data) {
                if (data && data.ResultMessage === '成功' && data.ResultCode === 0) {
                    (typeof callback === 'function') && callback(data);
                }
            }, function (err) {
                console.error(err);
            }, true, this, function (complete) {
                console.error(complete);
            });
        },
        /**
         * This function monitor orientation change
         * if orientation changed,this function will relayout buttons
         * @method orientationChange
         */
        orientationChange: function () {
            window.addEventListener('orientationchange', function (e) {
                Card.relayoutButton();
            });
        },
        /**
         * request member wallet information and handle it
         * @method requestBalanceInfo
         * @param {function} this function will run when dataInterface return information successfully,other status won't run callback
         * @callback(data)
         * {
         *   balanceInfo:{
         *      BasicPoint:{String},basic point
         *      MerchantBalance:{String},
         *      Gift:{String},gift card
         *      Cash:{String},cash account
         *      Promocode:{String},
         *      Point:{String} available point
         *  },
         *  lvlProgress:{String},progress bar
         *  avatarUrl:{String} avatar url
         *}
        */
        requestBalanceInfo: function (callback) {
            var item = {
                balanceInfo: {
                    MerchantBalance: '',
                    Gift: '',
                    Cash: '',
                    Promocode: '',
                    Point: '',
                    GroupTicketCount: ''
                },
                lvlProgress: '',
                avatarUrl: ''
            };
            fortuneModel.excute(function (data) {
                var basicPoint = 0;//basic point
                //member account information handle logic
                if (data && data.Result && data.Result.ResultCode == 0) {
                    if (data.MemberAssetSummaries && (data.MemberAssetSummaries instanceof Array)) {
                        for (var i = 0, len = data.MemberAssetSummaries.length; i < len; i++) {
                            var asset = data.MemberAssetSummaries[i];
                            if (asset["AssetType"]) {
                                var assetType = asset["AssetType"],
                                    fortune = (assetType == 'MerchantBalance') ? +asset["Balance"] / 100 : +asset["Balance"],
                                    wealth = '';
                                if (assetType == 'MerchantBalance' || assetType == 'Gift' || assetType == "Cash") {
                                    fortune = fortune.toFixed(2);//with two digits after the decimal point
                                    if (fortune > 100000) {//greater than one hundred thousand，output '>10万'
                                        wealth = '>10万';
                                    } else if (fortune == 100000) {//equal to one hundred thousand，output '10万'
                                        wealth = '¥10万';
                                    } else {//calculate fortune if there has '角' or '分',exact to '分',if not exact to '元'
                                        var o = (assetType == 'Cash') ? false : fortune - parseInt(fortune) > 0;
                                        wealth = o ? '¥' + fortune : '¥' + parseInt(fortune);
                                    }
                                } else if (assetType == 'Promocode' || assetType == 'Point' || assetType == 'GroupTicketCount') {
                                    wealth = fortune;
                                } else if (assetType == 'BasicPoint') {
                                    wealth = "基本积分：" + fortune;
                                    basicPoint = fortune;
                                }
                                item.balanceInfo[asset["AssetType"]] = wealth;
                            }
                        }
                    }
                    //basic point progress bar
                    if (typeof (+data.Grade) == 'number') {
                        var grade = +data.Grade < 10 ? 0 : +data.Grade;//if data.Grade lesser than ten,,member grade is defaults to ordinary member.

                        var progress = '0%';
                        if (typeof (basicPoint) != 'undefined') {
                            var currentLvl = vipRules[(+grade === 30 ? 20 : +grade)][0];//amount of basic point is desired to upgrade current lelvl
                            var nextGrade = vipRules[(+grade === 30 ? 30 : +grade + 10)][0];//amount of basic point is desired to upgrade next lelvl

                            if (basicPoint > currentLvl && basicPoint <= nextGrade) {
                                var upStaries = basicPoint - currentLvl;
                                var downStairs = nextGrade - currentLvl;
                                progress = (upStaries / downStairs).toFixed(2) * 100 + '%';
                            } else if (basicPoint > nextGrade) {
                                progress = '100%';
                            }
                            item.lvlProgress = progress;
                        }
                    }
                    //avatar url
                    if (data.AvatarNameEntities && (data.AvatarNameEntities instanceof Array)) {
                        var avatar = data.AvatarNameEntities[0];
                        if (avatar && avatar.URL) {
                            var avatartype = ['.jpg', '.jpeg', '.jpe', '.jfif', '.gif', '.png'],
                                suffix = 0,
                                avatarurl = "";

                            for (var i = 0; i < avatartype.length; i++) {
                                if (avatar.URL.indexOf(avatartype[i]) > -1) {
                                    suffix = avatar.URL.indexOf(avatartype[i]);
                                    avatarurl = avatar.URL.substr(0, suffix) + avatar.URL.substr(suffix);
                                    break;
                                }
                            }
                            item.avatarUrl = avatarurl;
                        }
                    }
                    (typeof callback === 'function') && callback(item);
                }
            }, function (err) {
                console.log(err);
            }, true, this, function (complete) {
                console.log(complete);
            });
        },
        /**
        * request order's count
        * @method orderCount
        * @param {function} this function will run when dataInterface return information successfully,other status won't run callback
        * @callback(data)
        *  NotTravel:0,//未出行
        *  AwaitPay:0,//待付款
        *  AwaitReview:0//待点评
        */
        orderCount: function (callback) {
            orderStatusModel.setParam('OrderStatisticsGroups', [{ GroupName: 'NotTravel' }, { GroupName: 'AwaitPay' }, { GroupName: 'AwaitReview' }]);
            orderStatusModel.excute(function (data) {
                var item = {};
                if (data && data.Result && data.Result.ResultCode == 0) {
                    if (data.OrderStatisticsGroupList && data.OrderStatisticsGroupList.length) {
                        var list = data.OrderStatisticsGroupList;
                        for (var i in list) {
                            if (list[i] && list[i].GroupName && typeof (list[i].Count) != 'undefined') {
                                item[list[i].GroupName] = list[i].Count;
                            }
                        }
                    }
                    (typeof callback === 'function') && callback(item);
                }
            }, function (err) {
                console.error(err);
            }, true, this, function (complete) {
                console.error(complete);
            });
        },
        /**
         * set HeadView
         * @method setHead
         * @param this
         */
        setHead: function (self) {
            self.setTitle('我的携程');
            self.headerview.set({
                title: '我的携程',
                back: true,
                view: self,
                events: {
                    returnHandler: function () {
                        Guider.jump({ url: 'ctrip://wireless/home', targetModel: 'app' });
                    }
                }
            });
            self.headerview.show();
        },
        /**
         *****only in App*****
         * this function for reset userInfo in Hybrid
         * if member already login write userinfo in localDB,else remove it.
         * @method resetUserInfo
         * @param (this)
        */
        resetUserInfo: function (self) {
            var fn = function () {
                //in web_view_did_appear's callback，register member_auto_login to get userInfo(NOT localDB).
                cHybridShell.Fn('member_auto_login', function (userinfo) {
                    if (!userinfo) {
                        localStorage.removeItem("USERINFO");
                        localStorage.removeItem("USER");
                        //hide broadside bar
                        cPublic.ctripMenu({ show: false, buName: 'home' });
                        self.renderTpl();
                        self.onShow();
                    }
                    //if member user modify their avtar pic,update it.
                    if (userinfo.data && userinfo.data.headIcon) {
                        var memberpic = self.$el.find(".member-pic").find("img")[0];
                        memberpic.src = userinfo.data.headIcon;
                    }
                }).run();
            };
            //register tag：web_view_did_appear，any page comes to this page will run fn
            cHybridShell.upon('web_view_did_appear', fn);
        },
        /**
         * request order list & handle it
         * this function for reset userInfo in Hybrid
         * @method filterOrderData
         * @param {this:Object, param:ModelParam, callback:function}
        */
        filterOrderData: function (self, param, callback) {
            Card.setView(self, (deviceEnv === 0));
            //初始化Pad方法
            Card.initForPad();
            OrdersSearchModel.setParam(param);
            OrdersSearchModel.abort();//abort last request
            var result = {
                resultCode: 0
            };
            OrdersSearchModel.excute(function (data) {
                var entity = data.OrderEnities;
                if (data && data.Result && data.Result.ResultCode == 0) {
                    var tpl = "";
                    if (entity.length > 0) {
                        for (var i = 0, len = entity.length; i < len; i++) {
                            tpl += Card.render(entity[i]);
                        }
                        $.extend(result, { htmlStr: tpl });
                    }
                    if (typeof (data.TotalCount) != "undefined") {
                        $.extend(result, { orderCount: data.TotalCount });
                    }
                } else {
                    $.extend(result, { resultCode: 1 });
                }
                (typeof callback === 'function') && callback(result);
            }, function (err) {
                $.extend(result, { resultCode: 1 });
                (typeof callback === 'function') && callback(result);
            }, true, this, function (complete) {
                console.error(complete);
            });
        },
        /**
         * request favourite list & handle it
         * this function for filter favourite data
         * @method filterfavoriteData
         * @callback(data)
         *  htmlStr:string,//error/noresult
         *  resultCode:0/1//success/failure
        */
        filterfavoriteData: function (param, callback) {
            var result = { resultCode: 0 };
            favoriteModel.setParam(param);
            favoriteModel.excute(function (data) {
                var favoriteString = '';
                if (data && data.ResultCode == 0) {
                    if (data.FavoriteList && data.FavoriteList.length) {
                        var item = data.FavoriteList;
                        for (var i = 0; i < data.FavoriteList.length; i++) {
                            favoriteString += this.favoriteRender(item[i]);
                        }
                    }
                    $.extend(result, { htmlStr: favoriteString });
                    (typeof callback === 'function') && callback(result);
                } else {
                    $.extend(result, { resultCode: 1 });
                    (typeof callback === 'function') && callback(result);
                }
            }, function (err) {
                $.extend(result, { resultCode: 1 });
                (typeof callback === 'function') && callback(result);
            }, true, this, function (complete) {
                console.log(complete);
            });
        },
        /**
         * render favourite list
         * this function for render favourite list
         * @method favoriteRender
         * @return(String)
        */
        favoriteRender: function (item) {
            var favoriteTpl = '';
            var isRender = false;

            if (item) {
                var statusid = " data-statusid='" + (typeof item.StatusID === 'undefined' ? '' : item.StatusID) + "'",
                    bizType = " data-biz='" + (item.BizType.toLowerCase() || '') + "'",
                    url = " data-url='" + (deviceEnv === 0 ? item.Url : (Lizard.isHybrid ? item.UrlForApp : item.UrlForH5)) + "'";
                var PicUrl = item.PicUrl || '',
                    ProductName = item.ProductName || '',
                    star = item.Star || 0,
                    CommentScore = item.CommentScore || 0,
                    Price = item.Price || '0',
                    // 优先取 ProductType，没有则取 BizType
                    ProductType = item.ProductType || item.BizType || '';

                var sBizType = '';
                // 根据 ProductType 判断是否存在该产品
                // 如果有，则显示相应的Tag

                if(ProductType){
                    var FavoriteConfig = {
                        HOTEL_DOMESTIC: { name: '酒店'},
                        HOTEL_INTERNATIONAL: { name: '酒店'},
                        VIEW_HOTEL: { name: '景+酒'},
                        GROUP_TRAVEL: { name: '团队游'},
                        CRUISE: { name: '邮轮'},
                        TUAN_HOTEL: { name: '酒店'},
                        TUAN_TRAVEL: { name: '旅游'},
                        TUAN_TICKET: { name: '门票'},
                        TUAN_LIFE: { name: '餐饮'},
                        HIGH_MERCHANT: { name: '商户'},
                        HIGH_PACKAGE: { name: '套餐'},
                        //DEST: { name: '攻略'},
                        DEST_FOOD: { name: '美食'},
                        DEST_LIFE: { name: '娱乐'},
                        DEST_SHOPPING: { name: '购物'},
                        DEST_VIEWSPOT: { name: '景点'},
                        DEST_ITINERARY: { name: '行程'},
                        DEST_JOURNAL: { name: '游记'},
                        GLOBAL_SHOPPING: { name: '全球购'},
                        VISA: { name: '签证'},
                        WEEKEND: { name: '周末游'},
                        PLANE_HOTEL: { name: '自由行'},
                        WEEKEND_ACTIVITY: { name: '周末游'},
                        WEEKEND_VIEWHOTEL: { name: '周末游'},
                        TICKET: { name: '门票' },
                        ACTIVITY: { name: '玩乐' }
                    };

                    for(var oType in FavoriteConfig) {
                        if (ProductType === oType) {
                            if(FavoriteConfig[ProductType]) {
                                sBizType = FavoriteConfig[ProductType]['name'];
                                isRender = true;
                                break;
                            }
                        }
                    }
                }

                // 如果没有,则不显示该产品
                if(!isRender) return favoriteTpl;

                favoriteTpl = '<li' + statusid + bizType + url + '><div class="fav-pic">'+
                                '<span class="fav-tag">'+ sBizType +'</span>'+
                                '<img width="90" height="90" src="' + PicUrl + '" alt=""></div>' +
                                '<h4>' + ProductName + '</h4>' +
                                '<p><span class="fav-diamond fav-diamond0' + star + '"></span></p>' +
                                '<p class="fav-score"><em>' + CommentScore + '分</em>/5分</p>' +
                                '<span class="fav-price">¥<em>' + Price + '</em>起</span></li>';
            }
            return favoriteTpl;
        },
        /**
         * loading
        */
        showLocalLoading: function (sellector) {
            //设置最小高度
            ($(sellector).height() < 240) && ($(sellector).css('height', '240px'));
            var Network = new cPublic.network({ parent: sellector });
            Network.loading();

        },
        /**
         *loadingfailed
         */
        showErrorTpl: function (sellector, callback) {
            var Network = new cPublic.network({
                parent: sellector,
                left: 200,
                right: 200
            });
            Network.loadFailed(function (close) {
                close();
                (typeof callback === 'function') && callback();
            });
        }
    }
    return common;
});
