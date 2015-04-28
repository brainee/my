define(['cPageView', 'cMemberService', 'MyCtripModel', 'MyCtripStore', 'myctripCommon', 'indexCommon', 'text!indexTpl_online'], function (basePageView, Member, MyCtripModel, MyCtripStore, MyctripCommon, indexCommon, html) {

    var messgeStore = MyCtripStore.GetMessageListStore.getInstance();

    var View = basePageView.extend({
        isAggregated: true,//是否为复合订单列表
        viewType: 'home',
        frompageurl: encodeURIComponent('http://' + window.location.host + '/webapp/myctrip/?for=test'),
        onCreate: function () {
            this.renderTpl();
        },
        renderTpl: function () {
            if (MyctripCommon.checkLogin() === 1) {
                this.$el.html(html);
                cPublic.ctripMenu({ show: true, buName: 'home' });
            } else {
                this.loginAction();
            }
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
                memberbox: this.$el.find('#memberbox'),//用户等级icon
                userLevel: this.$el.find('#user_lvl')//用户会员等级
            };
        },
        onShow: function () {
            var self = this;
            if (MyctripCommon.checkLogin() === 1) {
                this.handleBaseUserInfo();//用户名用户等级从userStore中取
                this.renderUserInfo();// 根据会员等级显示相应的特权信息
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
            } else {
                self.loginAction();
            }
        },
        events: {
            'click #viewMore': 'moreJump',//更多取到相应的页面
            'click #favoritelist li': 'favoriteJump',//收藏跳转
            'click #i-mail': 'mailAction', //站内信
            'click [data-href]': 'nextPage',//跳转
            'click #ordertab li': 'tabClick'//订单tab事件
        },
        renderUserInfo: function () {
            var data = indexCommon.handleBaseUserInfo(), userInfoTpl = '';

            if (data.grade === 'diamond') {// 钻石
                userInfoTpl += '<dl>';
                userInfoTpl += '<dt>免费为乘机人订制航班信息</dt>';
                userInfoTpl += '<dd>网上预订机票，您可在乘机人信息界面填写相关手机号，订单确认后，携程将为乘机人免费发送航班信息。</dd>';
                userInfoTpl += '<dt>贵宾俱乐部活动</dt>';
                userInfoTpl += '<dd>携程贵宾俱乐部每月举办各类精彩活动，如精英论坛、聚会沙龙、演出展览等，诚邀尊贵的您参与！</dd>';
                userInfoTpl += '<dt>钻石兑换专享</dt>';
                userInfoTpl += '<dd>当达到钻石级别，可享积分商城钻石专区低积分奖品兑换特权。</dd>';
                userInfoTpl += '</dl>';
            } else if (data.grade === 'platinum') {// 白金
                userInfoTpl += '<dl>';
                userInfoTpl += '<dt>专享优惠旅游度假产品</dt>';
                userInfoTpl += '<dd>携程旅游度假专家，将为尊贵的您提供专属您的旅游线路，折扣实惠，线路优选！</dd>';
                userInfoTpl += '<dt>贵宾俱乐部活动</dt>';
                userInfoTpl += '<dd>携程贵宾俱乐部每月举办各类精彩活动，如精英论坛、聚会沙龙、演出展览等，诚邀尊贵的您参与！</dd>';
                userInfoTpl += '<dt>美好旅游纪念品</dt>';
                userInfoTpl += '<dd>自2012年5月31日起，凡您在携程成交任一旅游线路（部分不可享受），将赠您丰富的旅游纪念品。</dd>';
                userInfoTpl += '</dl>';
            } else if (data.grade === 'gold') {// 金牌
                userInfoTpl += '<dl>';
                userInfoTpl += '<dt>关怀短信</dt>';
                userInfoTpl += '<dd>预定出行时，免费提供目的地城市的天气状况短信。</dd>';
                userInfoTpl += '<dt>参加精彩纷呈的积分活动，享有抽奖机会</dt>';
                userInfoTpl += '<dd>可以参加丰富多彩的积分活动，可赢取旅游产品抵用券、携程刊物、海外旅游度假等机会。</dd>';
                userInfoTpl += '<dt>订酒店臻享哈根达斯</dt>';
                userInfoTpl += '<dd>每预订一张酒店订单，即可使用积分兑换“哈根达斯买一送一”礼券一张</dd>';
                userInfoTpl += '</dl>';
            } else {// 普通
                userInfoTpl += '<dl>';
                userInfoTpl += '<dt>订海外旅游度假，享24小时中文热线</dt>';
                userInfoTpl += '<dd>已开通夏威夷、普吉岛中文热线，为会员提供咨询和紧急帮助服务。</dd>';
                userInfoTpl += '<dt>积分累计加快</dt>';
                userInfoTpl += '<dd>预订成交享有积分奖励，无线预订，积分累加更多！参与有奖调查、抽奖等都也可获得积分！</dd>';
                userInfoTpl += '<dt>积分兑换丰富礼品</dt>';
                userInfoTpl += '<dd>参与积分活动，有机会获得旅游产品抵用券、携程刊物、海外度假游等奖品。</dd>';
                userInfoTpl += '</dl>';
            }

            this.elsBox.userLevel.append(userInfoTpl);
        },
        renderMessageInfo: function (items) {
            var count = items.MessageList.length;
            if (items && count > 0) {
                var messageTpl = '';
                this.elsBox.msgCentre.find(".home-mail").append('<span class="unread2"></span>');
                messageTpl += '<div class="message-alert"><ul>';
                for (var i = 0, l = count > 3 ? 3 : count; i < l; i++) {
                    var RedirectUrl = items.MessageList[i].ContentList.RedirectUrl || 'http://my.ctrip.com/home/Message/MessageList.aspx';
                    messageTpl += '<li><a target="_blank" href="' + RedirectUrl + '">' + items.MessageList[i].Title + '</a></li>';
                }
                messageTpl += '</ul></div>';
                this.elsBox.msgCentre.append(messageTpl);
            }
        },
        handleBaseUserInfo: function () {
            var data = indexCommon.handleBaseUserInfo();
            if (data) {
                data.grade && this.elsBox.memberbox.find('#' + data.grade).show();
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
            //Lizard.jump('https://accounts.ctrip.com/member/login.aspx?BackUrl=' + this.frompageurl);
            Member.memberLogin({
                param: this.frompageurl
            });
        },
        nextPage: function (e) {
            var webUrl = $(e.currentTarget).data('href');
            Lizard.jump(webUrl);
        },
        moreJump: function (e) {
            var tabRules = { NotTravel: 'unuseorderlist', AwaitPay: 'unpaidorderlist', AwaitReview: 'uncommentorderlist', All: 'allorders' };
            var key = this.elsBox.tabCan.find('.current').data('key');//tab当前的key
            Lizard.jump(Lizard.appBaseUrl + 'orders/' + tabRules[key] + '?for=test');
        },
        favoriteJump: function (e) {//收藏跳转
            // 如果是在online 或者是 pad for online，
            // 则不执行该跳转方法
            if (MyctripCommon.isOnline) return;
            var e = $(e.currentTarget);
            var statusid = e.data("statusid") || '';
            if (statusid == 0) {
                this.showToast('此产品已下架');
            } else {
                var url = e.data('url');
                url = url.indexOf('?') > -1 ? (url + '&') : (url + '?');
                Lizard.jump(url);
            }
        },
        mailAction: function () {
            var store = messgeStore.get(),
                count = store ? store.count : 0;
            var webUrl = '/webapp/message/messagecenter';
            Lizard.jump(webUrl, 4);
        },
        wallet: function () {
            var self = this;
            indexCommon.requestBalanceInfo(function (item) {
                if (item && item.balanceInfo && item.avatarUrl && item.lvlProgress) {
                    for (var i in item.balanceInfo) {
                        var figure = item.balanceInfo[i];
                        self.$el.find("#_" + i.toLowerCase()).text(figure);
                    }
                    self.elsBox.progressBar.css('width', item.lvlProgress);
                    var memberpic = self.$el.find(".member-pic").find("img")[0];

                    var maxLeft = 220;
                    var _left = maxLeft * parseFloat(item.lvlProgress) / 100 || 0;
                    $('#_basicpoint').css('left', _left + 'px');

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
                        var htmlStr = data.htmlStr && data.htmlStr || "";
                        var isShowMore = data.orderCount > 3 ? 'block' : 'none';
                        htmlStr += '<li class="load-more" id="viewMore" style="display:' + isShowMore + ';"><a href="javascript:;">更多订单&nbsp;&gt;</a></li>';
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
                QueryList: [
                    {
                        BizType: "HOTEL",
                        ProductType: "",
                    }
                ],
                SortBy: 'CreateTime',
                SortType: 0,
                StartOffset: 1,
                ReturnCount: 6
            };
            indexCommon.filterfavoriteData(param, function (data) {
                if (data && data.resultCode === 0) {
                    var htmlStr = data.htmlStr && data.htmlStr || "";
                    var noneTpl = '<div class="home-none" style="height: 240px;"><i class="none-product-favorite"></i>暂时没有相关产品</div>';
                    htmlStr && favoriteCan.css('height', 'auto').html(htmlStr);//给容器一个默认高度，隐藏时重置为auto
                    !htmlStr && favoriteCan.css('height', 'auto').html(noneTpl);
                    // 如果是在online 或者 pad for online的情况，
                    // 则为每个LI元素添加A标签，以达到新开窗口的目的。
                    // 暂且用这样的方式来做
                    if (MyctripCommon.isOnline) {
                        var elItems = favoriteCan.children('li'),
                            isEmpty = elItems.length > 0 ? false : true;
                        if (!isEmpty) {
                            elItems.each(function () {
                                var el = $(this),
                                    url = el.data('url'),
                                    statusid = el.data("statusid");
                                el.wrapInner('<a>');
                                el.find('a').attr({
                                    'href': url,
                                    'data-statusid': statusid,
                                    'target': '_blank'
                                });
                                el.find('a').on('click', function () {
                                    if (statusid == 0) {
                                        self.showToast('此产品已下架');
                                        return false;
                                    }
                                });
                            });
                        }
                    }
                } else {
                    indexCommon.showErrorTpl('#favoritelist', function () {
                        self.favoriteOrder();
                    });
                }
            });
        }
    });
    return View;
});
