define(['cPageView', 'CommonStore', 'MyCtripModel', 'myctripCommon', 'cUtilHybrid', 'cUtilValidate', 'cGuiderService', 'cMemberService'], function (cPageView, CommonStore, MyCtripModel, MyctripCommon, cUtilHybrid, cUtilValidate, Guider, Member) {
    var userStore = CommonStore.UserStore.getInstance(),
        feedbackModel = MyCtripModel.CustomeFeedbackModel.getInstance();

    var View = cPageView.extend({
        pageid: '231074',//h5
        hpageid: '410028',//hybrid
        clickNum: 0,//点击次数
        events: {
            'click #js_debug': 'checkDebug'
        },
        onCreate: function () { },
        onShow: function () {
            //H5意见反馈必须在登录状态下才能提交, app允许未登录提交意见反馈
            if (!cUtilHybrid.isInApp) {
                if (MyctripCommon.checkLogin() !== 1) {
                    Member.memberLogin({ param: "from=" + encodeURIComponent(Lizard.appBaseUrl + "common/about") });
                    return;
                }
            }

            var self = this;
            cPublic.ctripMenu({ show: true, buName: 'about' });

            this.clickNum = 0;
            this.setTitle('意见反馈');
            this.headerview.set({
                title: '意见反馈',
                back: true,
                view: self,
                btn: { title: "提交", id: 'confirmBtn', classname: 'header_r' },
                events: {
                    returnHandler: function () {
                        Lizard.goTo(Lizard.appBaseUrl + 'common/about');
                    },
                    commitHandler: function () {
                        self.submit();
                    }
                },
            });
            // 将HeaderView显示出来
            this.headerview.show();
            setTimeout(this.setDate, 300);
        },
        onHide: function () {
            this.hideLoading();
        },
        setDate: function () {
            var userInfo = userStore ? userStore.getUser() : null;
            if (userInfo) {
                $("#js_mobi").val(userInfo.Mobile || '');
                $("#js_mail").val(userInfo.Email || '');
            }
        },
        submit: function () {
            var self = this;
            var appinfos = null;
            var tel = $("#js_mobi").val().trim(),
                email = $("#js_mail").val().trim(),
                msg = $("#js_content").val().trim();

            if (msg == "") {
                this.showToast('请输入反馈意见');
                return false;
            }
            if ((email != "") && (!cUtilValidate.isEmail(email))) {
                this.showToast('请填写正确的邮箱地址 ');
                return false;
            }

            //app里设置平台号，以区别来源
            if (cUtilHybrid.isInApp) {
                if (window.localStorage) {
                    appinfos = window.localStorage.getItem('CINFO');
                    appinfos = appinfos ? JSON.parse(appinfos) : null;
                }

                msg += appinfos.device ? (' ' + appinfos.device) : '';
            }

            feedbackModel.setParam({
                "Mobilephone": tel,
                "SendEMailAddress": email,
                "Feedback": msg
            });

            this.showLoading();

            //app里面需要设置设备号，版本号
            if (cUtilHybrid.isInApp && appinfos) {
                var headStore = CommonStore.HeadStore.getInstance();
                var headInfo = headStore.get();
                headInfo.syscode = appinfos.systemCode;
                headInfo.cver = appinfos.version;

                feedbackModel.usehead = false;
                feedbackModel.headinfo = headInfo;
            }
            //alert(JSON.stringify(feedbackModel.head.get()));
            feedbackModel.execute(function (data) {
                self.hideLoading();
                if (data && data.Result && data.Result.ResultCode === 0) {
                    self.showToast('提交成功');
                    $("#js_mobi").val("");
                    $("#js_mail").val("");
                    $("#js_content").val("");
                } else {
                    self.onError(data, true);
                }
            }, function (err) {
                self.hideLoading();
                self.onError(err, false);
            }, false, self, function (err) {
                self.hideLoading();
                self.onError(err, false);
            });
        },
        onError: function (err, bServerError) {
            var self = this;
            this.showToast('抱歉，您的反馈建议未能提交，请拨打客服热线4000086666');
            //UBT
            MyctripCommon.sendUbtTrace({
                traceName: 'myctrip_feedback',
                pageId: self.hpageid,
                pageName: 'feedback',
                bServerError: bServerError,
                err: err
            });
        },

        /**
        * 检查Debug状态
        */
        checkDebug: function () {
            //点击5次时弹出
            if (this.clickNum == 4) {
                if (cUtilHybrid.isPreProduction() == '0') {
                    alert("");
                }
                this.clickNum = 0;
                var email = $("#js_mail").val().trim();
                var isPrd = false;

                if (cUtilHybrid.isInApp) {
                    if (cUtilHybrid.isPreProduction() != '1' && cUtilHybrid.isPreProduction() != '0') {
                        isPrd = true;
                    }
                } else if (location.host.match(/^m\.ctrip\.com/i)) {
                    isPrd = true;
                };


                //如果是生产环境,则email必须为hhhhh shbhzhang 2014/1/7
                //        if((isPrd && email == 'hhhhh') || !isPrd){
                //          var self = this;
                //          Guider.apply({
                //            hybridCallback: function () {
                //              v
                //            },
                //            callback:       function () {
                //              self.jump('/webapp/monitor/index.html#index');
                //            }
                //          })
                //        }
            } else {
                this.clickNum++;
            }
        }

    })
    return View;
});
