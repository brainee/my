
define(['cPageView', 'MyCtripStore', 'cGuiderService', 'myctripCommon', 'cMemberService', 'indexCommon', 'cUtilCryptBase64'], function (basePageView, MyCtripStore, Guider, MyctripCommon, Member, indexCommon, Crypt) {

    var messgeStore = MyCtripStore.GetMessageListStore.getInstance();//存储小红点信息

    var View = basePageView.extend({
        isAggregated: true,//是否为复合订单列表
        viewType: 'home',
        isInApp: Lizard.isHybrid,
        frompageurl: 'from=' + encodeURIComponent('/webapp/myctrip/index'),
        fullfrom: 'from=' + encodeURIComponent((location.protocol || 'http:') + '//' + location.host + location.pathname),
        onCreate: function () {
            this.renderTpl();
        },
        renderTpl: function () {
            var tpl = Lizard.T('hybrid_index');
            if (MyctripCommon.checkLogin() != 1) {
                tpl = Lizard.T('unlogin');
            } else {
                //调用左边栏
                cPublic.ctripMenu({ show: true, buName: 'home' });
            }
            this.$el.html(tpl);
            this.elsBox = {
                msgCentre: this.$el.find('#message_centre'),//消息中心
                tabCan: this.$el.find('#ordertab'),//tab容器
                orderCan: this.$el.find('#orderlist'),//订单容器
                favoriteCan: this.$el.find('#favoritelist'),//收藏容器
                progressBar: this.$el.find('#progress'),//会员等级进度条
                currentLvl: this.$el.find('#startlvl'),//会员当前等级
                nextLvl: this.$el.find('#endlvl'),//会员下一级升级等级
                orderMore: this.$el.find('#viewMore'),//更多订单入口
                userName: this.$el.find('#username'),//用户名
                memberbox: this.$el.find('#memberbox')//用户等级icon
            };
        },
        onShow: function () {
            //更多页面兼容
            var hash = window.location.hash, matchs, redirect = false;
            var arr = [
                { old: '#more/index', news: '/webapp/myctrip/more/index' },
                { old: '#more', news: '/webapp/myctrip/more/index' }
            ];
            $.each(arr, function (i, n) {
                var url;
                if (matchs = hash.match(n.old + '(.*)')) {
                    url = n.news + (matchs[1] || '');
                    redirect = true;
                    n.out ? Lizard.jump(url) : Lizard.goTo(url);
                    return false;
                }
            });
            if (redirect) { return; }


            $("#headerview") && $("#headerview").hide();
            var self = this;
            //设置头部在APP&&PAD
            if (this.isInApp && MyctripCommon.isPad) {
                this.setHead();
            }
            //注册回调，在回调中重置登陆态
            indexCommon.resetUserInfo(self);
            if (MyctripCommon.checkLogin() === 1) {
                this.handleBaseUserInfo();
                this.wallet();//加载钱包数据
                //消息中心 如果 localStorage 没有数据，就去请求接口；
                if (messgeStore.get() === null) {
                    indexCommon.requestMessageInfo(function (items) {
                        self.renderMessageInfo(items);
                    });
                } else {
                    var store = messgeStore.get();
                    self.renderMessageInfo(store);
                }
                //订单数量
                indexCommon.orderCount(function (item) {//订单数量
                    for (var i in item) {
                        self.elsBox.tabCan.find('#' + i).text(item[i]);
                    }
                });
                this.requestOrder();//加载订单数据
                this.favoriteOrder();//加载收藏订单
            }
        },
        onHide:function(){
            $("#headerview") && $("#headerview").show();
        },
        events: {
            'click #viewMore': 'moreJump',//更多取到相应的页面
            'click #favoritelist li': 'favoriteJump',//收藏跳转
            'click .mywallet': 'walletJump',//钱包跳转
            'click #promocode': 'promocodeJump',//优惠券跳转逻辑
            'click #i-mail': 'mailAction', //站内信
            'click [data-href]': 'nextPage',//跳转
            'click #ordertab li': 'tabClick',//订单tab事件
            /*未登录*/
            'click #gotologin': 'loginAction'
        },
        setHead: function () {
            this.headerview.set({
                title: '我的携程',
                back: true,
                view: this,
                events: {
                    returnHandler: function () {
                        Guider.jump({ url: 'ctrip://wireless/home', targetModel: 'app' });
                    }
                }
            });
            this.headerview.show();
        },
        renderMessageInfo: function (items) {
            var count = items.MessageList.length;
            if (items && count > 0) {
                var messageTpl = '';
                this.elsBox.msgCentre.find(".home-mail").append('<span class="unread2"></span>');
                messageTpl += '<div class="message-alert"><ul>';
                for (var i = 0, l = count > 3 ? 3 : count; i < l; i++) {
                    var  RedirectUrl = items.MessageList[i].ContentList.RedirectUrl || '/webapp/message/messagecenter';
                    messageTpl += '<li data-href="'+ RedirectUrl +'" data-h5="'+ RedirectUrl +'">' + items.MessageList[i].Title + '</a></li>';
                }
                messageTpl += '</ul></div>';
                this.elsBox.msgCentre.append(messageTpl);
            }
        },
        handleBaseUserInfo: function () {
            var data = indexCommon.handleBaseUserInfo();
            if (data) {
                data.grade && this.elsBox.memberbox.find('#' + data.grade).show();
                data.lvlName && this.elsBox.memberbox.find('#userlvl').html(data.lvlName);
                data.userName && this.elsBox.userName.html(data.userName);
                if (data.degree) {
                    this.elsBox.currentLvl.text(data.degree[0]);
                    this.elsBox.nextLvl.text(data.degree[1]);
                }
            };
        },
        tabClick: function (e) {
            var currentKey = this.elsBox.tabCan.find('.current') && this.elsBox.tabCan.find('.current').data('key');
            var targetKey = $(e.currentTarget).data('key');
            if (currentKey && targetKey && currentKey != targetKey) {
                this.$el.find('#ordertab li').removeClass();
                $(e.currentTarget).addClass('current');
                this.requestOrder();
            }
        },
        loginAction: function () {
            var self = this;
            Member.memberLogin({
                param: window.location.href,
                callback: function (userinfo) {
                    if (userinfo) {
                        self.renderTpl();
                        self.onShow();
                    }
                }
            });
        },
        nextPage: function (e) {
            var target = $(e.currentTarget);
            h5Url = target.data('h5'),
            hybridUrl = target.data('href');
            var url = this.isInApp ? hybridUrl : h5Url;
            if (url && url.indexOf('ctrip://') > -1) {
                Guider.jump({ targetModel: 'app', url: url });
            } else {
                Lizard.jump(url, { targetModel: 4 });
            }
        },
        moreJump: function (e) {
            var tabRules = { NotTravel: 'unuseorderlist', AwaitPay: 'unpaidorderlist', AwaitReview: 'uncommentorderlist', All: 'allorders' };
            var key = this.elsBox.tabCan.find('.current').data('key');//tab当前的key
            Lizard.jump(Lizard.appBaseUrl + 'orders/' + tabRules[key]);
        },
        favoriteJump: function (e) {//收藏跳转
            var self = this,
                e = $(e.currentTarget);
            var statusid = e.data("statusid") || '';
            var bizType = e.data('biz') || '',
                url = e.data('url');

            if (bizType) {
                // 如果是邮轮、攻略，默认都是上架
                if (bizType.indexOf('DEST') > -1 || bizType.toLowerCase() === 'cruise' || statusid !== 0) {
                    url = url + (url.indexOf('?') > -1 ? '&' : '?');
                    var matchArr = url.match(/\/webapp\/([^\/]+)\/(.+)/);

                    Guider.apply({
                        hybridCallback: function () {
                            if (url.indexOf('ctrip://') > -1) {
                                Guider.jump({ targetModel: 'app', url: url });
                            } else if (matchArr && matchArr.length) {
                                // 如果是高端商户、 新开webview
                                if (bizType.toLowerCase() === 'high') {
                                    return Lizard.jump(url, { targetModel: 4 });
                                }
                                Guider.cross({ path: matchArr[1], param: matchArr[2] + self.frompageurl });
                            } else {
                                Lizard.jump(url, { targetModel: 4 });
                            }
                        },
                        callback: function () {
                            if (bizType == "hotel_domestic" || bizType == "hotel_international") {
                                url = url + self.fullFrom;
                            } else {
                                url = url + self.frompageurl;
                            }
                            Lizard.jump(url);
                        }
                    });
                } else {
                    this.showToast('此产品已下架');
                }
            }
        },
        mailAction: function () {
            var store = messgeStore.get(),
                count = store ? store.count : 0;
            // messgeStore.set({ "count": count, "hasRead": 1 });
            var webUrl = '/webapp/message/messagecenter';
            Lizard.jump(webUrl, { targetModel: 4 });
        },
        wallet: function () {
            var self = this;
            indexCommon.requestBalanceInfo(function (item) {
                if (item && item.balanceInfo && item.avatarUrl && item.lvlProgress) {
                    for (var i in item.balanceInfo) {
                        var figure = item.balanceInfo[i];
                        self.$el.find("._" + i.toLowerCase()).text(figure);
                    }
                    self.elsBox.progressBar.css('width', item.lvlProgress);
                    var memberpic = self.$el.find(".member-pic").find("img")[0];
                    if (memberpic) {
                        memberpic.onerror = function () {
                            this.src = "http://pic.c-ctrip.com/h5/rwd_myctrip/portrain_unlogin.png";
                        }
                        memberpic.src = item.avatarUrl;
                    }
                }
            });
        },
        requestOrder: function () {
            var self = this;
            indexCommon.showLocalLoading('#orderlist');
            var tabCan = self.elsBox.tabCan,
                orderCan = self.elsBox.orderCan;
            var orderType = self.elsBox.tabCan.find('.current').data('key') || 'All';//tab当前的key
            var param = {
                PageSize: 3,
                PageIndex: 1,
                OrderStatusClassify: orderType
            };

            indexCommon.filterOrderData(self, param, function (data) {
                if (data && data.resultCode === 0) {
                    if (typeof (data.orderCount) != "undefined" && data.orderCount > 0) {
                        var htmlStr = data.htmlStr || "";
                        var isShowMore = data.orderCount > 3 ? 'block' : 'none';
                        htmlStr += '<li style="display:' + isShowMore + ';"><span id="viewMore">• • •</span></li>';
                        tabCan.find('#' + orderType).text(data.orderCount);
                        orderCan.css('height', 'auto').html(htmlStr);//给容器一个默认高度，隐藏时重置为auto
                    } else {
                        var noneTpl = '<div class="home-none" style="height: 240px;"><i class="none-product-order"></i>暂时没有相关订单</div>';
                        orderCan.css('height', 'auto').html(noneTpl);//给容器一个默认高度，隐藏时重置为auto
                    }
                } else {
                    indexCommon.showErrorTpl('#orderlist', function () {
                        self.requestOrder();
                    });
                }
            });
        },
        favoriteOrder: function () {//加载收藏数据
            var self = this,
                favoriteCan = self.elsBox.favoriteCan;
            indexCommon.showLocalLoading('#favoritelist');
            var param = {
                QueryList: [{ BizType: 'All', ProductType: 'All', }],
                SortBy: 'CreateTime',
                SortType: 0,
                StartOffset: 1,
                ReturnCount: 4
            };
            indexCommon.filterfavoriteData(param, function (data) {
                if (data && data.resultCode === 0) {
                    var htmlStr = data.htmlStr || "";
                    var noneTpl = '<div class="home-none" style="height: 240px;"><i class="none-product-favorite"></i>暂时没有相关产品</div>';
                    htmlStr && favoriteCan.css('height', 'auto').html(htmlStr);//给容器一个默认高度，隐藏时重置为auto
                    !htmlStr && favoriteCan.css('height', 'auto').html(noneTpl);
                } else {
                    indexCommon.showErrorTpl('#favoritelist', function () {
                        self.favoriteOrder();
                    });
                }
            });
        },
        promocodeJump: function () {
            var url = "";
            if (location.host.match(/^(localhost|172\.16|127\.0)/i) || location.host.match(/^waptest\.ctrip|^210\.13\.100\.191|fat\d*\.qa\.nt\.ctripcorp\.com/i)) {
                url = "https://smarket.fat21.qa.nt.ctripcorp.com/webapp/promocode/#index";
            } else if (location.host.match(/^m\.uat\.qa\.nt\.ctripcorp\.com/i)) {
                url = "https://smarket.uat.qa.nt.ctripcorp.com/webapp/promocode/#index";
            } else {
                url = "https://smarket.ctrip.com/webapp/promocode/#index";
            }
            if (this.isInApp) {
                Lizard.jump('/webapp/promocode/index.html#index?' + this.frompageurl, { targetModel: 4 });
                //Guider.cross({ path: 'promocode', param: 'index.html#index?' + this.frompageurl });
            } else {
                var userInfo = JSON.parse(localStorage.getItem('USERINFO'));
                if (userInfo && userInfo.data && userInfo.data.Auth) {
                    var tokenJson = { auth: userInfo.data.Auth };
                    window.location.href = url + (url.indexOf("?") > 0 ? "&" : "?") + "token=" + encodeURIComponent(Crypt.Base64.encode(JSON.stringify(tokenJson)));
                } else {
                    this.loginJump();
                }
            }
        },
        walletJump: function (e) {
            var jumpUrl = '';
            var fromUrl = '';
            if (location.host.match(/^m\.fat\d*\.qa\.nt\.ctripcorp\.com|^210\.13\.100\.191/i)) {
                jumpUrl = 'https://secure.fws.qa.nt.ctripcorp.com/webapp/wallet/index.html';
                fromUrl = 'http://m.fat19.qa.nt.ctripcorp.com/webapp/myctrip/';
            } else if (location.host.match(/^m\.uat\.qa\.nt\.ctripcorp\.com/i)) {
                jumpUrl = 'https://secure.uat.qa.nt.ctripcorp.com/webapp/wallet/index.html';
                fromUrl = 'http://m.uat.qa.nt.ctripcorp.com/webapp/myctrip/';
            } else {
                jumpUrl = 'https://secure.ctrip.com/webapp/wallet/index.html';
                fromUrl = 'http://m.ctrip.com/webapp/myctrip/';
            }
            var tokenArr = {
                from: fromUrl,
                eback: fromUrl
            }
            if (this.isInApp) {
                Lizard.jump('/webapp/wallet/index.html', { targetModel: 4 });
            } else {
                jumpUrl = jumpUrl + '#index?token=' + encodeURIComponent(Crypt.Base64.encode(JSON.stringify(tokenArr)));
                window.location.href = jumpUrl;
            }
        }
    });
    return View;
});
