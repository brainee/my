define(['UIRadioList', 'cPageView', 'myctripCommon', 'cGuiderService', 'cMemberService'], function (UIRadioList, cPageView, MyctripCommon, Guider, Member) {
    var View = cPageView.extend({
        pageid: '231081',//h5
        hpageid: '410031',//hybrid
        events: {
            'click #commonInfo': 'changeCommonList',//常用信息蒙层
            'click #subscibe': 'gotoSubscibe'//订阅蒙层
        },
        onCreate: function () { },
        onShow: function () {
            var self = this;
            cPublic.ctripMenu({ show: true, buName: 'setting' });

            this.setTitle('设置');
            this.headerview.set({
                title: '设置',
                back: true,
                view: self,
                events: {
                    returnHandler: function () {
                        Guider.apply({
                            hybridCallback: function () {
                                Lizard.jump(Lizard.appBaseUrl + 'index');
                            },
                            callback: function () {
                                Lizard.jump(Lizard.appBaseUrl + 'index');
                            }
                        });
                    }
                }
            });
            this.headerview.show();
        },
        onHide: function () {
            this.hideLoading();
        },
        //常用信息
        changeCommonList: function (e) {
            if (MyctripCommon.checkLogin() !== 1) {
                Member.memberLogin({ param: "from=" + encodeURIComponent(Lizard.appBaseUrl+'common/setting') });
                return;
            }

            var self = this;
            var data = [{
                id: '常用旅客',
                key: '/webapp/cpage/passengerlist'
            }, {
                id: '常用地址',
                key: '/webapp/cpage/addresslist?type=show'
            }, {
                id: '常用发票管理',
                key: '/webapp/invoicemgr/index'
            }];
            this.CommonList = new UIRadioList({
                datamodel: {
                    title: '常用信息',
                    data: data,
                    index: -1
                },
                displayNum: 3,
                onClick: function (data, index) {
                    Lizard.jump(data.key);
                    this.hide();
                }
            });
            this.CommonList.show();
        },
        //订阅
        gotoSubscibe: function () {
            var self = this;
            var data = [{
                id: '邮件订阅',
                key: '/webapp/EDMMailsubscribe'
            }, {
                id: '跟团游订阅',
                key: '/webapp/tour/subscription'
            }];
            this.OrderList = new UIRadioList({
                datamodel: {
                    title: '订阅',
                    data: data,
                    index: -1
                },
                displayNum: 2,
                onClick: function (data, index) {
                    Lizard.jump(data.key);
                    this.hide();
                }
            });
            this.OrderList.show();
        }
    })
    return View;
});
