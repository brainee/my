
define(['cUtilCryptBase64', 'cPageView', 'CommonStore', 'MyCtripStore', 'cMemberService', 'indexCommon', 'myctripCommon'], function (Crypt, basePageView, CommonStore, myCtripStore, Member, indexCommon, MyctripCommon) {

    var unreadMessageNumStore = myCtripStore.UnreadMessageNumStore.getInstance();
    var userStore = CommonStore.UserStore.getInstance(), userInfo = userStore ? userStore.getUser() : null;

    var View = basePageView.extend({
        pageid: '212051',
        hpageid: '212051',
        hasAd: true,
        isLogin: true,
        fromPageurl: 'from=' + encodeURIComponent("/webapp/myctrip/"),
        onHide: function () {
            $("#headerview") && $("#headerview").show();
        },
        onCreate: function () {
            this.loginboxfun = _.template(Lizard.T('logintpl'));
        },
        events: {
            'click #returnBack': 'returnAction', //后退
            'click #homeMail': 'mailAction', //消息
            'click #goLogin': 'loginAction', //登录
            'click [data-href]': 'nextAction', //查看下一项
            'click #promocodeUrl': 'goPromocodeAction',
            'click .goto-wallet': 'goWalletAction', //跳转到钱包页
            'click #couponUrl': 'goCouponAction'  // 跳转团购券页
        },
        onShow: function () {
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

            var self = this;
            this.setTitle('携程旅行触屏版-我的携程-m.ctrip.com');
            $("#headerview") && $("#headerview").hide();

            self.isLogin = MyctripCommon.checkLogin() === 1;
            self.isLogin ? userInfo.isLogin = true : userInfo = { isLogin: false };

            this.tplRender();
            self.isLogin && self.loadUserInfo();
            self.loadUnreadMessageNum();

            if (navigator.userAgent.match(/CtripLite/i)) {
                $(".home-i-back").hide();
            }

            var ua = navigator.userAgent;
            var isAndroidLiteVersion = (ua.indexOf("Android") > 0) && (ua.indexOf("CtripLite") > 0);
            if (isAndroidLiteVersion) {
                window.Util_a && window.Util_a.showTabBar('3');
            }
        },
        loginAction: function () {
            Member.memberLogin({
                param: window.location.href
            });
        },
        loadUserInfo: function () {
            var self = this;
            indexCommon.requestBalanceInfo(function (data) {
                if (data && data.balanceInfo && data.avatarUrl) {
                    for (var i in data.balanceInfo) {
                        var figure = data.balanceInfo[i];
                        if (i === 'GroupTicketCount' && figure === 0) {
                            figure = '';    // 如果团购券无张数，则不显示
                        } else {
                            figure = (i === 'Promocode' || i === 'GroupTicketCount') ? figure + '张' : figure;
                        }
                        self.$el.find("." + i.toLowerCase()).text(figure);
                    }
                    var memberpic = self.$el.find(".member-pic").find("img")[0];
                    if (memberpic) {
                        memberpic.onerror = function () {
                            this.src = "http://pic.c-ctrip.com/h5/rwd_myctrip/portrain_unlogin.png";
                        }
                        memberpic.src = data.avatarUrl;
                    }
                }
            });
        },
        loadUnreadMessageNum: function () {
            var self = this;
            indexCommon.requestMessageInfo(function (item) {
                if (item && item.MessageList.length > 0) {
                    var store = unreadMessageNumStore.get();
                    if (!store || (store && item.MessageList.length > 0)) {
                        self.$el.find("#homeMail").append('<span class="unread2"></span>');
                    }
                }
            });
        },
        tplRender: function () {
            var tpl = this.loginboxfun(userInfo);
            this.$el.html(tpl);
        },
        returnAction: function () {
            var backurl = Lizard.P('backurl');
            if (backurl && backurl.length) {
                backurl = backurl.replace(/javascript|img/gi, "").replace(/\<|\>/g, "");
                Lizard.jump(decodeURIComponent(backurl));
            } else {
                Lizard.jump('/html5/');
            }
        },
        mailAction: function () {
            var store = unreadMessageNumStore.get(),
                count = store ? store.count : 0;
            unreadMessageNumStore.set({ count: count, hasRead: 1 });
            Lizard.jump("/webapp/message/messagecenter");
        },
        goPromocodeAction: function () {
            var host = location.host,
                url = "";
            if (host.match(/^(localhost|172\.16|127\.0)/i) || host.match(/^waptest\.ctrip|^210\.13\.100\.191|fat\d*\.qa\.nt\.ctripcorp\.com/i)) {
                url = "https://smarket.fat21.qa.nt.ctripcorp.com/webapp/promocode/#index";
            } else if (host.match(/^m\.uat\.qa\.nt\.ctripcorp\.com/i)) {
                url = "https://smarket.uat.qa.nt.ctripcorp.com/webapp/promocode/#index";
            } else {
                url = "https://smarket.ctrip.com/webapp/promocode/#index";
            }

            var userInfo = JSON.parse(localStorage.getItem('USERINFO'));
            if (userInfo && userInfo.data && userInfo.data.Auth) {
                var tokenJson = encodeURIComponent(Crypt.Base64.encode(JSON.stringify({ auth: userInfo.data.Auth })));
                window.location.href = url + "?token=" + tokenJson;
            } else {
                this.loginAction();
            }
        },
        goWalletAction: function (e) {
            var host = location.host,
                fromUrl = 'http://' + host + '/webapp/myctrip/',
                jumpUrl = '';
            if (host.match(/^m\.fat\d*\.qa\.nt\.ctripcorp\.com|^210\.13\.100\.191/i)) {
                jumpUrl = 'https://secure.fws.qa.nt.ctripcorp.com/webapp/wallet/index';
            } else if (host.match(/^m\.uat\.qa\.nt\.ctripcorp\.com/i)) {
                jumpUrl = 'https://secure.uat.qa.nt.ctripcorp.com/webapp/wallet/index';
            } else if (host.match(/^10\.8\.2\.111/i) || host.match(/^10\.8\.5\.10/i)) {
                jumpUrl = 'https://10.8.5.10/webapp/wallet/index';
            } else {
                jumpUrl = 'https://secure.ctrip.com/webapp/wallet/index';
            }
            var tokenArr = encodeURIComponent(Crypt.Base64.encode(JSON.stringify({
                from: fromUrl,
                eback: fromUrl
            })));
            jumpUrl += '?token=' + tokenArr;
            Lizard.jump(jumpUrl);
            //window.location.href = jumpUrl;
        },
        goCouponAction: function (e) {
            localStorage.setItem('MYCTRIP_GROUP_MARK', 1);   // 标记团购券点击过
            Lizard.jump("/webapp/tuan/couponlist" + "?" + this.fromPageurl);
        },
        nextAction: function (e) {
            var target = $(e.currentTarget),
                url = target.data('href');
            if (!this.isLogin && !target.hasClass("aboutctrip") && target.attr('id') !== "nouserlist") {
                this.loginAction();
            } else {
                if (url.indexOf('you/') > -1) {
                    this.jump(url);
                } else {
                    if (target.hasClass("favorite")) {
                        url += "?" + this.fromPageurl;
                    }
                    Lizard.jump(url);
                }
            }
        }
    });
    return View;
});
