define(['cUIInputClear', 'cUtilValidate', 'cLocalStorage', 'cPageView', 'cUtility', 'CommonStore', 'cMemberService', 'myctripCommon', 'MyCtripModel'],
function (InputClear, Validate, cStorage, basePageView, cUtility, CommonStore, Member, MyctripCommon, myCtripModel) {

    var loginStatus = MyctripCommon.checkLogin();
    var userStore = CommonStore.UserStore.getInstance(), userInfo = userStore.getUser();
    var GetPicValCodeModel = myCtripModel.GetPicValCodeModel.getInstance();
    var SendValCodeModel = myCtripModel.SendValidateCodeModel.getInstance();
    var CheckVerifyCodeModel = myCtripModel.CheckVerifyCodeModel.getInstance();

    var elsBox = {};

    var host = window.location.host.toLowerCase();
    if (host.indexOf('fat') >= 0 || host.indexOf('localhost') >= 0) {
        var domain = "https://accounts.fat49.qa.nt.ctripcorp.com/";
    } else if (host.indexOf('uat') >= 0) {
        var domain = "https://accounts.uat.qa.nt.ctripcorp.com/";
    } else {
        var domain = "https://accounts.ctrip.com/";
    }

    var isCounterRunning = false;
    var View = basePageView.extend({
        pageid: '212052',
        onHide: function () {
            this.hideLoading();
        },
        onCreate: function () {
            this.setTitle('免登录查询');
            this.$el.html(Lizard.T('unloginTpl'));
            elsBox = {
                elmobile: this.$el.find('#mobile'),//手机号码输入框
                picVerify: this.$el.find('#putValidateCode'),//图片验证码输入框
                msgVerify: this.$el.find('#inputVerifyCode'),//短信验证码输入框
                getValidate: this.$el.find('#getvalidate'),//获取图片验证码
                img: this.$el.find('#IValidateCode')//图片容器
            };
            var mobile = cStorage.localStorage.oldGet("Unlogin_Mobile");
            mobile ? elsBox.elmobile.val(mobile) : '';
            
            InputClear(elsBox.elmobile);
            InputClear(elsBox.picVerify);
            InputClear(elsBox.msgVerify);
        },
        onShow: function () {
            if (loginStatus != 3 && loginStatus != 0) {
                Member.memberLogin();
            } else {
                this.setHead();
                this.counter();//验证码倒计时
                this.showVerifyCode();//验证码
            }
        },
        events: {
            'click #js_return': 'backAction', //返回
            'click .jsreg': 'regAction', //去注册
            'click .js_getpass': 'getPassAction', //去找回密码
            'click #getvalidate': 'getCode', //获取短信验证码
            'click #nologinsubmit': 'notloginAction', //查询
            'click #AnotherImg': 'showVerifyCode', //换一张
            'input #putValidateCode': 'setAble',
            'input #mobile': 'setAble'
        },
        setAble: function () {
            var content = $.trim(elsBox.picVerify.val()),
                mobile = $.trim(elsBox.elmobile.val())
            thisDom = elsBox.getValidate,
            isAble = (mobile.length === 11) ? (content.length === 0) : true;
            if (!isCounterRunning) {
                isAble ? thisDom.addClass('s') : thisDom.removeClass('s');
            }
        },
        showVerifyCode: function () {//获取验证码并显示
            var self = this,
                length = elsBox.img.data("length") || '';
            var sessionid = Math.floor(Math.random() * (1000000 + 1));
            GetPicValCodeModel.setParam({
                length: length,
                sessionid: sessionid
            });
            GetPicValCodeModel.excute(function (data) {
                if (data) {
                    elsBox.img.data("captcbaid", data.captcbaid).attr("src", 'data:image/png;base64,' + data.imageStr);
                    elsBox.picVerify.val("");
                    elsBox.getValidate.addClass('s');
                }
            }, function (err) {
                self.showToast('验证码获取失败,请重新获取！');
            }, true, this, function (complete) {
                self.showToast('验证码获取失败,请重新获取！');
            });
        },
        setHead: function () {
            var self = this;
            self.headerview.set({
                title: '我的携程',
                back: true,
                view: self,
                events: {
                    returnHandler: function () {
                        this.backAction();
                    }
                }
            });
            self.headerview.show();
        },
        backAction: function () {
            var urlFrom = (Lizard.P('from') || '').toLowerCase();
            if (!urlFrom || urlFrom.length <= 0) {
                this.jump('/webapp/myctrip/index');
            } else {
                if (urlFrom.indexOf('/myctrip') > -1 || urlFrom.indexOf('orderdetail') > -1) {
                    this.jump('/webapp/myctrip/index');
                } else {
                    this.jump(urlFrom);
                }
            }
        },
        checkVal: function () {
            var self = this;
            
            var mobile = $.trim(elsBox.elmobile.val());
            var validatecode = $.trim(elsBox.picVerify.val());
            if (!mobile.length) {
                self.showToast('请输入手机号!');
                return false;
            }
            if (!Validate.isMobile(mobile)) {
                self.showToast('请输入正确的手机号码!');
                return false;
            }
            if (validatecode.length <= 0) {
                self.showToast('请输入图片验证码!');
                return false;
            } else if (validatecode.length < 6) {
                self.showToast('请输入正确的图片验证码!');
                self.showVerifyCode();
                return false;
            }
            return true;
        },
        getCode: function () {
            var self = this;
            var isdisable = elsBox.getValidate[0].className == 's_btn fr';
            if (isdisable && self.checkVal()) {
                var mobile = $.trim(elsBox.elmobile.val());
                var captcbaid = elsBox.img.data("captcbaid");
                var validatecode = $.trim(elsBox.picVerify.val());
                cStorage.localStorage.oldSet("Unlogin_Mobile", mobile);

                SendValCodeModel.setParam({
                    captchaId: captcbaid,
                    captchacode: validatecode,
                    mobile: mobile
                });
                SendValCodeModel.excute(function (data) {
                    if (data && data.ServerCode) {
                        switch (data.ServerCode) {
                            case '1':
                                self.showToast(data.Message || "短信验证码发送成功");
                                cStorage.localStorage.oldSet('VERIFYTIMEOUT', new Date().valueOf());
                                self.counter();
                                break;
                            case '8':
                                self.showToast({
                                    datamodel: {
                                        content: data.Message || "图片验证码输入错误"
                                    },
                                    hideAction: function () {
                                        self.showVerifyCode();
                                    }
                                });
                                break;
                            case '9':
                                self.showToast({
                                    datamodel: {
                                        content: data.Message || "验证码发送失败，请稍后重试"
                                    },
                                    hideAction: function () {
                                        self.showVerifyCode();
                                    }
                                });
                                break;
                            default:
                                self.showToast({
                                    datamodel: {
                                        content: data.Message || "网络不给力，请稍后重试"
                                    },
                                    hideAction: function () {
                                        self.showVerifyCode();
                                    }
                                });
                                break;
                        }
                    } else {
                        self.showToast({
                            datamodel: {
                                content: data.Message || "网络不给力，请稍后重试"
                            },
                            hideAction: function () {
                                self.showVerifyCode();
                            }
                        });
                    }
                }, function (err) {
                    self.showToast("网络不给力，请稍后重试");
                    self.showVerifyCode();
                }, true, this, function (complete) {
                    self.showToast("网络不给力，请稍后重试");
                    self.showVerifyCode();
                });
            }
        },
        counter: function () {
            var t = 60,
                timeobj = cStorage.localStorage.oldGet("VERIFYTIMEOUT"),
                thisDom = elsBox.getValidate,
                picVerify = elsBox.picVerify,
                cur = new Date();
            if (timeobj) {
                var diff = cur.valueOf() - timeobj, resource, i;
                if (diff < t * 1000) {
                    isCounterRunning = true;
                    i = t - Math.ceil(diff / 1000);
                    resource = setInterval($.proxy(function () {
                        thisDom.addClass('s');
                        thisDom.text(i + '秒后重发');
                        if (i <= 0) {
                            clearInterval(resource);
                            var content = $.trim(picVerify.val())
                            if (content.length === 0) {
                                thisDom.text('获取验证码');
                            } else {
                                thisDom.removeClass('s').text('获取验证码');
                            }
                            isCounterRunning = false;
                        }
                        i--;
                    }, this), 1000);
                    thisDom.addClass('s').val(i + '秒后重发');
                    i--;
                    return;
                }
            }
        },
        notloginAction: function () {
            var self = this,
                urlFrom = Lizard.P('from') || "/webapp/myctrip/index";
            var mobile = $.trim(elsBox.elmobile.val()),
                verifycode = $.trim(elsBox.msgVerify.val());
            if (this.checkVal()) {
                if (verifycode.length === 0) {
                    self.showToast('请输入短信验证码!');
                    return;
                }
                CheckVerifyCodeModel.param = {
                    Mobile: mobile,
                    VerifyCode: verifycode
                };
                CheckVerifyCodeModel.excute(function (data) {
                    self.hideLoading();
                    if (data.ServerCode == 1) {
                        if (data.User) {
                            data.User.VerifyCode = verifycode;
                            var userinfo = { data: data.User, timeout: new Date() };
                            cStorage.localStorage.oldSet('USERINFO', JSON.stringify(userinfo));
                        }
                        self.jump(urlFrom, true);
                    } else {
                        self.showToast(data.Message || '抱歉，服务未响应');
                    }
                }, function (err) {
                    self.showToast(data.Message || '抱歉，服务未响应');
                    self.hideLoading();
                }, true, this, function (complete) {
                    self.showToast(data.Message || '抱歉，服务未响应');
                    self.hideLoading();
                });
            }
        },
        regAction: function (e) {//去注册
            var regUrl = domain + 'H5Register/index.html';
            urlFrom = Lizard.P('from');
            if (urlFrom && urlFrom.length > 0) {
                regUrl += '?from=' + encodeURIComponent(urlFrom);
            } else {
                regUrl += '?from=' + encodeURIComponent(this.getRoot());
            }
            this.jump(regUrl);
        },
        getPassAction: function () {
            this.jump('https://accounts.ctrip.com/H5Login/ResetPassword');
        }
    });
    return View;
});
