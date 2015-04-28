define(['commonlist', 'cUtilCommon', 'cGuiderService', 'myctripCommon', 'CommonStore'], function (CommonListFactory, cUtility, cGuiderService, MyctripCommon, CommonStore) {
    return CommonListFactory.getInstance({
        pageid: '231032',
        hpageid: '231032',
        viewType: 'allorders',
        unionType: 'All',
        title: '全部订单',
        bOffline: false, //标识当前是否是离线状态
        bLogin: false, //当前是否登录
        bNoNeedCheckLogin: false, //是否需要检查登录
        Guider: cGuiderService,
        onShow: function (self) {
            //判断是否登录
            self.bLogin = MyctripCommon.checkLogin() === 1;

            //标识是否是离线状态（离线状态下，Native我携首页跳转全部订单时会传递from=offline参数）
            self.bOffline = Lizard.P('from') === 'offline' ? true : false;

            //无网络且没有登录的时候不需要做登录判断（在commonlist.js里面默认会做登录判断，做此设置后可跳过判断）
            self.bNoNeedCheckLogin = self.bOffline && !self.bLogin;

            //未登录并且有网络状态
            self.nologinAndOnline = false;

            //在app中，才有离线订单
            //检测网络状况
            if (cUtility.isInApp) {
                self.Guider.app_check_network_status({
                    callback: function (data) {
                        if (data && data.hasNetwork) {//有网络
                            if (self.bLogin) {
                                self.bOffline = false;
                            } else {
                                self.nologinAndOnline = true;
                                self._checkLogin();
                            }
                        } else {//无网络
                            self.bOffline = true;
                        }
                    }
                });
            }
        },
        showView: function (self) {
            if (cUtility.isInApp) {
                //首次进入时显示12306订单提示，以后再进入不需要显示
                var tipsShowed = localStorage.getItem('TRAIN_TIP_SHOWED') == 1;
                if (!tipsShowed) {
                    var left = 0,
                        top = isShowSlideMenu ? 50 : 8;
                    trainTips = $('<div class="order-tips">火车票订单列表中可以查询12306订单啦</div>');
                    self.$el.prepend(trainTips);
                    if (isShowSlideMenu) {
                        left = '15px';
                    } else {
                        trainTips.css('left', '0');
                        left = (document.body.clientWidth - trainTips.width()) / 2;
                    }
                    trainTips.css({ left: left, top: top });
                    setTimeout(function () {
                        trainTips.remove();
                    }, 2000);
                    localStorage.setItem('TRAIN_TIP_SHOWED', 1);
                }
            }
        },
        onTopPulling: function() {
            //未登录状态下，离线订单不能下拉加载
            if (!this.bLogin) {
                return;
            }

            //下拉刷新时，去除顶部离线订单的提示
            this.$el.find('.top-tips').remove();
            this.$el.find('.order-wrap').css('margin-top', 0);
        },
        onAfterRequest: function (self, data, bFirst) {
            if (data && data.Result && data.Result.ResultCode == 0) {
                //在App中每次成功加载第一页数据后写入本地缓存
                if (cUtility.isInApp && bFirst) {
                    self.writeOfflineData(self, data);
                }

                //Pad下当显示离线订单后，再下拉刷新加载出订单时，要把订单tab显示出来
                if (isShowSlideMenu) {
                    self._showPadHead();
                    self.$el.find('.order-header').parent().show();
                }
            }
        },
        onAfterRender: function (self) {
            //若当前显示的是离线订单，则返回true，使不执行后续逻辑，即没有订单时不提示“没有更多订单了”
            if (self.bOffline) {
                return true;
            }
        },
        onError: function (self, err) {
            if (self.nologinAndOnline) {
                return true;
            }

            //在App中请求出错，则加载离线数据
            if (cUtility.isInApp) {
                self.offlineOperate(self);
                return true;
            }
        },
        offlineOperate: function (self) {
            //头部显示当前正在访问离线订单的提示
            if (self.bLogin) {
                self.tipContent = '网络不给力，当前订单状态及价格可能不是最新。若需查询最新订单数据，请检查网络后重试。';
            } else {
                self.tipContent = '网络不给力，当前订单状态及价格可能不是最新。若需查询最新订单数据，或非会员订单，请检查网络后重试。';

                //未登录状态下查看离线订单时，头部变为“离线订单”
                self.headerview.set({
                    title: '离线订单',
                    back: true,
                    view: self,
                    events: {
                        returnHandler: function () {
                            self.Guider.apply({
                                callback: function () {
                                    self.jump('/webapp/myctrip/');
                                },
                                hybridCallback: function () {
                                    self.Guider.jump({ targetModel: 'app', module: 'myctrip' });
                                }
                            });
                        }
                    }
                });
                self.headerview.show();
            }

            //Pad下显示离线订单时，不显示订单tab
            if (isShowSlideMenu) {
                self.$el.find('.order-header').parent().hide();
            }

            //离线订单只显示一页，末尾不会有“没有更多订单了”的提示
            self.bNoMore = true;
            //读取离线数据
            self.readOfflineData(self);

            self.bTopPulling = false;
            self.endPull();
        },
        writeOfflineData: function (self, data) {
            var sFileName = 'myctrip_offlineorder.txt';
            var options = {
                fileName: sFileName,
                relativeFilePath: null,
                text: JSON.stringify(data),
                isAppend: false,
                callback: function (data) { }
            };
            self.Guider.file.writeTextToFile(options);
        },
        readOfflineData: function (self) {
            var sFileName = 'myctrip_offlineorder.txt';
            var options = {
                fileName: sFileName,
                relativeFilePath: null,
                callback: function (data) {
                    if (data && data.text) {
                        data = JSON.parse(data.text);
                        if (self.filterOfflineData(self, data)) {
                            self.totalPage = 1;
                            self.elsBox.lstbox.html('');
                            self.renderList(data, true);
                            return;
                        }
                    }
                    self.totalPage = 0;
                    self.elsBox.lstbox.html('<div class="cui-load-error">您没有离线订单</div>');
                }
            };
            self.Guider.file.readTextFromFile(options);
        },
        filterOfflineData: function (self, data) {
            var entities = null;
            if (data && data.Result && data.Result.ResultCode == 0) {
                entities = data.OrderEnities;
                if (entities && entities.length) {
                    //非登录状态下离线订单只用于显示，不需要显示按钮操作，也不能跳转详情页
                    if (!self.bLogin) {
                        for (var i = 0, len = entities.length; i < len; i++) {
                            if (entities[i].OrderActions) {
                                entities[i].OrderActions = [];
                                entities[i].isOfflineOrder = true;
                            }
                        }
                    }
                    return true; //数据格式正确
                }
            }
            return false; //数据格式不正确
        }
    });
});
