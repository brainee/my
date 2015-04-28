// 非会员有用到这个页面
define(['cPageView', 'cGuiderService', 'cMemberService', 'myctripCommon', 'cUtilCommon'], function (cPageView, Guider, Member, MyctripCommon, cUtilCommon) {
    var View = cPageView.extend({
        pageid: '231033',
        hpageid: '231033',
        loginStatus: 0,//判断当前登录状态0：未登录 1：会员登录 2：老的非会员 3：新的非会员
        onCreate: function () {
            var html = '',
                additional = '',
                order = null,
                orderTypeList = MyctripCommon.getOrderTypeList();

            html = '<ul class="cui-select-view ordercenter-list" id="orderList">';
            for (var i = 0, len = orderTypeList.length; i < len; i++) {
                order = orderTypeList[i];
                if (cUtilCommon.isInApp && order.name === '火车票订单') {
                    additional = '<span class="placeholder">支持12306订单</span>';
                } else {
                    additional = '';
                }
                html += '<li class="' + order.classname + '" data-href="' + order.url + '" data-biztype="' + order.biztype + '">' + additional + order.name + '</li>';
            }
            html += '</ul>';

            this.$el.html(html);
        },
        events: {
            "click li": "jumplist"
        },
        onShow: function () {
            var self = this;
            self.loginStatus = MyctripCommon.checkLogin();

            this.headerview.set({
                title: '选择订单类型',
                back: true,
                view: self,
                events: {
                    returnHandler: function () {
                        Guider.apply({
                            callback: function () {
                                Lizard.goTo("/webapp/myctrip/index");
                            }, hybridCallback: function () {
                                if (isShowSlideMenu) {
                                    Lizard.goTo("/webapp/myctrip/index");
                                } else {
                                    Guider.jump({
                                        targetModel: 'app',
                                        module: 'myctrip'
                                    });
                                }
                            }
                        })
                    }
                }
            });
            self.headerview.show();

            if (self.loginStatus != 1) {
                self.$el.find(".o-all").hide();
            }
        },
        jumplist: function (e) {
            var self = this,
                url = $(e.currentTarget).data("href") || "",
                biztype = $(e.currentTarget).data("biztype") || "";
            biztype = typeof biztype === 'string' ? biztype.toLowerCase() : '';
            //更新登陆态
            self.loginStatus = MyctripCommon.checkLogin();

            Guider.apply({
                callback: function () {
                    if (self.loginStatus === 0) {
                        if (MyctripCommon.isJoinMobileSearch(biztype)) {
                            //跳转手机号码查询页
                            console.log('接入非会员');
                        } else {
                            //老的非会员订单查询页
                            Lizard.goTo(Lizard.appBaseUrl + "accounts/login?from=" + encodeURIComponent(Lizard.appBaseUrl + url));
                        }
                    } else {
                        Lizard.goTo(Lizard.appBaseUrl + url);
                    }
                }, hybridCallback: function () {
                    if (self.loginStatus === 0) {
                        var hasNoUserList = !(biztype == "lipin" || biztype == "topshop" || biztype == "airportbus");
                        Member.memberLogin({
                            isShowNonMemberLogin: hasNoUserList,
                            callback: function (data) {
                                if (data) {
                                    Lizard.goTo(Lizard.appBaseUrl + url);
                                }
                            }
                        });
                    } else {
                        Lizard.goTo(Lizard.appBaseUrl + url);
                    }
                }
            });
        }
    });
    return View;
});