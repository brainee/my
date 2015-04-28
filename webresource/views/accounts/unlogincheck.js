define(['cUtilValidate', 'cLocalStorage', 'MyCtripModel', 'cPageView', 'cGuiderService', 'cUIInputClear', 'myctripCommon'],
function (Validate, cStorage, myCtripModel, basePageView, Guider, InputClear, MyctripCommon) {

    var unLoginCheckModel = myCtripModel.UnLoginCheckModel.getInstance();
    var SendValCodeModel = myCtripModel.SendValidateCodeModel.getInstance();
    var GetPicValCodeModel = myCtripModel.GetPicValCodeModel.getInstance();

    var elsBox = {};

    var isCounterRunning = false;//倒计时
    var View = basePageView.extend({
        onCreate: function () {
            this.$el.html(Lizard.T('newunlogin'));
            elsBox = {
                btnSendCode: this.$el.find('#sendValCode'),//发送验证码
                phoneBox: this.$el.find('#regphone'),//手机号输入框
                valCode: this.$el.find('#valCode'),//短信验证码输入框
                picValInput: this.$el.find('#picValidateCode'),//图片验证码输入框
                ValidateCodePic: this.$el.find('#ValidateCode')//图片验证码(图片)
            };
            //清空输入框
            InputClear(elsBox.phoneBox);
            InputClear(elsBox.picValInput, '');
            InputClear(elsBox.valCode, '');

            var mobile = cStorage.localStorage.oldGet("Unlogin_Mobile");
            mobile && elsBox.phoneBox.val(mobile);

        },
        events: {
            'click #sendValCode': 'sendValCode',
            'click #search': 'search',
            'input #picValidateCode': 'setable',
            'input #regphone': 'setable',
            'click #AnotherImg': 'showCode'//刷新验证码
        },
        setable: function () {
            var self = this,
                thisDom = elsBox.btnSendCode;
            var content = $.trim(elsBox.picValInput.val()),
                mobile = $.trim(elsBox.phoneBox.val());
            var isAble = (mobile.length > 0) ? (content.length === 6) : false;
            if (!isCounterRunning) {
                isAble ? thisDom.attr('class', 'btn02').data('disabled', 1) : thisDom.attr('class', 'btn02_disabled').data('disabled', 0);
            }
        },
        onShow: function () {
            var self = this;
            if (!MyctripCommon.isTieYou()) {
                var self = this;
                this.headerview.set({
                    title: '订单查询',
                    back: true,
                    view: self,
                    events: {
                        returnHandler: function () {
                            Guider.apply({
                                callback: function () {
                                    Lizard.goTo("/webapp/myctrip/orders/ordertypelist");
                                }, hybridCallback: function () {
                                    Guider.backToLastPage();
                                }
                            });
                        },
                        homeHandler: function () {
                            self.jump('/html5/');
                        }
                    }
                });
                this.headerview.show();
            }
            this.showCode();
            this.counter();
        },
        showCode: function () {
            var self = this;
            var length = 6;
            var sessionid = Math.floor(Math.random() * (1000000 + 1));
            GetPicValCodeModel.setParam({
                length: length,
                sessionid: sessionid
            });
            GetPicValCodeModel.excute(function (data) {
                if (typeof data === "object") {
                    elsBox.ValidateCodePic.data("captcbaid", data.captcbaid || "").attr("src", 'data:image/png;base64,' + data.imageStr || "");
                    elsBox.picValInput.val("");
                    elsBox.btnSendCode.data('disabled', 0);
                }
            }, function () {
                self.showToast('验证码获取失败,请重新获取！');
            }, true, this, function () {
                self.showToast('验证码获取失败,请重新获取！');
            });
        },
        valite: function () {
            var phoneText = elsBox.phoneBox.val();
            var picCode = $.trim(elsBox.picValInput.val());
            if ($.trim(phoneText).length <= 0) {
                this.showToast("请输入手机号码");
                return false;
            } else if (!Validate.isMobile(phoneText)) {
                this.showToast("手机号码不正确");
                return false;
            } else if (picCode.length <= 0) {
                this.showToast("请输入图片验证码");
                return false;
            } else if (picCode.length > 0 && picCode.length < 6) {
                this.showToast("请输入正确的图片验证码");
                return false;
            }
            return true;
        },
        search: function () {
            var self = this;
            if (self.valite()) {
                var msgCode = $.trim($('#valCode').val());
                if (msgCode.length <= 0) {
                    return this.showToast("请输入6位短信验证码");
                }
                var phone = elsBox.phoneBox.val();
                unLoginCheckModel.setParam({
                    "MobilePhoneNumber": phone,
                    "VerifyCode": elsBox.valCode.val()
                });
                unLoginCheckModel.excute(function (item) {
                    if (item.ReturnCode != 0) {
                        self.showToast(item.Message);
                    } else {
                        cStorage.localStorage.oldSet("unlogininfo", JSON.stringify({
                            token: item.Token,
                            phone: phone
                        }));
                        var busUrl = Lizard.P('from');
                        Lizard.jump(busUrl, { targetModel: 4 });
                    }
                }, function (error) {
                    self.showToast("网络不给力，请稍后重试");
                }, this, function (complete) {
                    self.showToast("网络不给力，请稍后重试");
                });
            }
        },
        sendValCode: function () {
            var self = this,
                ValidateCodePic = elsBox.ValidateCodePic,
                picValInput = elsBox.picValInput,
                isAvailable = elsBox.btnSendCode.data("disabled");
            if (!!isAvailable && self.valite()) {
                var captcbaid = ValidateCodePic.data("captcbaid"),
                    validatecode = picValInput.val(),
                    phone = elsBox.phoneBox.val();
                cStorage.localStorage.oldSet("Unlogin_Mobile", phone);

                SendValCodeModel.setParam({
                    captchaId: captcbaid,
                    captchacode: validatecode,
                    mobile: phone
                });
                SendValCodeModel.excute(function (data) {
                    if (data && data.ServerCode && data.ServerCode == '1') {
                        self.showToast(data.Message || "发送验证码成功");
                        cStorage.localStorage.oldSet('VERIFYTIMEOUT', new Date().valueOf());
                        self.counter();
                    } else {
                        self.showToast({
                            datamodel: {
                                content: data.Message || "网络不给力，请稍后重试"
                            },
                            hideAction: function () {
                                self.showCode();
                            }
                        });
                    }
                }, function (err) {
                    self.showToast("网络不给力，请稍后重试");
                    self.showCode();
                }, true, this, function (complete) {
                    self.showToast("网络不给力，请稍后重试");
                    self.showCode();
                });
            }
        },
        counter: function () {
            var self = this,
                threshold = 60,//倒计时一分钟
                timeobj = cStorage.localStorage.oldGet('VERIFYTIMEOUT') || new Date().valueOf(),
                sendBtn = elsBox.btnSendCode;
            sendBtn.attr('class', 'btn02_disabled').data('disabled', 0);
            if (cStorage.localStorage.oldGet("VERIFYTIMEOUT")) {
                var diff = new Date().valueOf() - timeobj;
                if (diff < threshold * 1000) {
                    isCounterRunning = true;
                    var i = threshold - Math.ceil(diff / 1000);
                    resource = setInterval(function () {
                        sendBtn.text(i + '秒后重发');
                        if (i <= 0) {
                            clearInterval(resource);
                            sendBtn.text('发送验证码')
                            isCounterRunning = false;
                            self.setable();
                        }
                        i--;
                    }, 1000);
                }
            }
        }
    });
    return View;
});