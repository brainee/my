/**
* 关于携程旅行
* creator:caofu
* createtime:2013-11-08
*/
define(['cPageView', 'CommonStore', 'MyCtripModel', 'myctripCommon', 'cUtilCommon', 'cHybridShell', 'cGuiderService', 'cMemberService'], function (cPageView, commonStore, MyCtripModel, MyctripCommon, cUtilCommon, cHybridShell, Guider, Member) {
    var View = cPageView.extend({
        pageid: '231072',//h5
        hpageid: '410026',//hybrid
        events: {
            'click div[data-href]': 'menuAction',
            'click li[data-href]': 'menuAction',
            'click p[data-href]': 'menuAction'
        },
        onCreate: function () {
            Lizard.isHybrid && this.checkTheUpdate();
        },
        onShow: function () {
            var self = this;
            cPublic.ctripMenu({ show: true, buName: 'about' });

            this.setTitle('关于携程旅行');
            this.headerview.set({
                title: '关于携程旅行',
                back: true,
                view: self,
                events: {
                    returnHandler: function () {
                        Guider.apply({
                            hybridCallback: function () {
                                Guider.backToLastPage();
                            },
                            callback: function () {
                                Lizard.jump(Lizard.appBaseUrl);
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
        checkTheUpdate: function () {
            var AppUpdateServiceModel = MyCtripModel.AppUpdateServiceModel.getInstance(),// 检查更新服务
                BasicConfInfoModel = MyCtripModel.BasicConfInfoModel.getInstance(),// 检查需要显示的栏目
                appinfos = null, // 存储 init_member_H5_info
                self = this;

            // 框架在webview_did_finish的时候已将init_member_H5_info写入localstorage
            if (window.localStorage) {
                appinfos = window.localStorage.getItem('CINFO');
                appinfos = appinfos ? JSON.parse(appinfos) : null;
            }

            if (appinfos) {
                //检查是否安装了微信
                self.checkHasWechat(self);

                // ios显示去app store评分入口
                if (appinfos.platform === 1) {
                    self.$el.find('.grade').show();
                }

                if (appinfos.version && appinfos.version.length > 0) {
                    self.$el.find('.myctrip-v').html('v' + appinfos.version);
                    self.$el.find('.myctrip-v').show();
                }

                AppUpdateServiceModel.param = {
                    'AppUpdateHeader': {
                        'SystemCode': appinfos.systemCode,// 客户端标识
                        'ClientVersion': appinfos.internalVersion, // App版本号,客户端版本号，例（600.000）
                        'SourceID': appinfos.sourceId, // 渠道号
                        'ClientId': appinfos.clientID, //客户端唯一标识
                        'VesionCode': appinfos.versionCode // Android更新的VersionCode
                    },
                    'NeedIntegratedPKG': false,
                    'RequestFrom': 'About'
                };

                BasicConfInfoModel.param = {
                    'Platform': platform, // 应用平台 1: Iphone 2:Ipad 3: Android
                    'ClientVersion': appinfos.internalVersion, // App版本号,客户端版本号，例（600.000）
                    'VersionCode': appinfos.versionCode, // APP 版本code
                    'SourceID': '5555' + appinfos.sourceId // 渠道号
                };

                AppUpdateServiceModel.execute(function (data) {
                    self.hideLoading();
                    if (data && data.ResultMessage !== undefined && data.ResultMessage === 'Success') {
                        // 如果不需要更新就 return
                        if (!data.AppUpdateInfo.NeedUpdate) return;
                        var displayVersion = data.AppUpdateInfo.DisplayVersion;
                        self.$el.find('.tag-new').show();
                        self.$el.find('.current-v').html('最新' + displayVersion);
                    }
                }, function (err) {
                    self.hideLoading();
                    self.onError(err, false);
                }, false, self, function (err) {
                    self.hideLoading();
                    self.onError(err, false);
                });

                /* ModelName: BasicConfInfoModel
                 * Info:根据这个服务来决定显示哪些栏目
                 * Result                  Int4        Y   0：Success，                       1.0     操作结果
                 *                                         1：ClientVersion不准确，
                 *                                         2：Platform不准确，
                 *                                         3：SourceId不准确，
                 *                                         4：程序内部出错
                 * ResultMessage           Dynamic     Y                                     1.0     结果消息
                 * ShowMyAdvertise         Boolean     Y   默认为True                         1.0     显示我携广告
                 * ShowAppRecom            Boolean     Y   默认为True                         1.0     展示应用推荐
                 * ShowUpdateBar           Boolean     Y   默认为True                         1.0     显示升级条框
                 * UpdateAppLocation       Boolean     Y   默认为True                         1.0     上传APP的经纬度
                 */
                BasicConfInfoModel.execute(function (data) {
                    self.hideLoading();
                    if (data && data.Result !== undefined && data.Result === 0) {
                        //调服务成功后，将信息写入localstorage
                        if (window.localStorage) {
                            var basicinfos = {};
                            basicinfos.ShowUpdateBar = data.ShowUpdateBar !== undefined ? data.ShowUpdateBar : false;
                            basicinfos.ShowAppRecom = data.ShowAppRecom !== undefined ? data.ShowAppRecom : false;

                            window.localStorage.removeItem('MYCTRIP_BASICINFOS');
                            window.localStorage.setItem('MYCTRIP_BASICINFOS', JSON.stringify(basicinfos));
                        }
                        //升级新版本
                        if (data.ShowUpdateBar) {
                            self.$el.find(".upgrade").show();
                        }
                        //应用推荐
                        if (data.ShowAppRecom) {
                            if (self.$el.find('.apply').length) {
                                return;
                            }
                            self.$el.find(".about-list li").append('<div data-href="market" class="about-item ico-apply apply">应用推荐<i class="arrow-r"></i></div>');
                        }
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
            }
        },
        // 检查是否安装了微信
        checkHasWechat: function (self) {
            Guider.checkAppInstall({
                url: "weixin://home",
                package: "com.tencent.mm",
                callback: function (data) {
                    if (data && !data.isInstalledApp) {
                        self.$el.find('.ico-wechat').remove();
                        self.$el.find('.ico-sina').css({ 'left': '50%', 'marginLeft': '-80px' });
                    }
                }
            });
        },
        onError: function (err, bServerError) {
            var self = this;
            var basicinfos = {};

            //ubt
            MyctripCommon.sendUbtTrace({
                traceName: 'myctrip_about',
                pageId: self.hpageid,
                pageName: 'about',
                bServerError: bServerError,
                err: err
            });

            //从localstorage取出basicinfos里面的信息，并执行
            if (window.localStorage) {
                basicinfos = window.localStorage.getItem('MYCTRIP_BASICINFOS');
                basicinfos = basicinfos ? JSON.parse(basicinfos) : null;

                //升级新版本
                if (basicinfos && basicinfos.ShowUpdateBar) {
                    self.$el.find(".upgrade").show();
                }

                //应用推荐
                if (basicinfos && basicinfos.ShowAppRecom) {
                    if (self.$el.find('.apply').length) {
                        return;
                    }
                    self.$el.find(".about-list li").append('<div data-href="market" class="about-item ico-apply apply">应用推荐<i class="arrow-r"></i></div>');
                }
            }
        },
        menuAction: function (e) {
            var self = this,
                href = $(e.currentTarget).attr('data-href');

            var links = {
                //携程公告，H5
                'noticelist': function () {
                    Lizard.goTo(Lizard.appBaseUrl + 'common/noticelist');
                },
                //新功能介绍，Hybrid
                'new': function () {
                    Guider.showNewestIntroduction();
                },
                //升级新版本，Hybrid
                'upgrade': function () {
                    Guider.checkUpdate();
                },
                //意见反馈，H5 Hybrid
                'feedback': function () {
                    //H5不埋点
                    if (cUtilCommon.isInApp) {
                        cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_feedback' }, null);
                    }
                    Lizard.goTo(Lizard.appBaseUrl + 'common/feedback');
                },
                //软件许可及服务协议，Hybrid
                'agreement': function () {
                    Lizard.goTo(Lizard.appBaseUrl + 'common/agreement');
                },
                //微信关注，Hybrid
                'weixin': function () {
                    cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_weixin' }, null);
                    cHybridShell.Fn('copy_string_to_clipboard').run('ictrip');
                    self.showConfirm({
                        datamodel: {
                            content: '公共号“ictrip”已复制。您可以在微信中直接粘贴搜索。',
                            btns: [{
                                name: '取消', className: 'cui-btns-cancel'
                            }, {
                                name: '<strong>去微信</strong>', className: 'cui-btns-ok'
                            }]
                        },
                        okAction: function () {
                            cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_weixin_open' }, null);
                            cHybridShell.Fn('open_url').run('weixin://home', 10);//暂时使用10,之后会对1做修改
                            this.hide();
                        },
                        cancelAction: function () {
                            cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_weixin_cancel' }, null);
                            this.hide();
                        }
                    });
                },
                //微博关注，Hybrid
                'weibo': function () {
                    cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_weibo' }, null);
                    cHybridShell.Fn('open_url').run("http://m.weibo.cn/u/2292409817?jumpfrom=wapv4&tip=1", 2, "新浪微博");
                },
                //应用推荐，Hybrid
                'market': function () {
                    cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_recommend' }, null);

                    //support iOS & Android
                    var url = 'http://app.ctrip.com/market/app.html';

                    Guider.jump({ targetModel: 'h5', url: url, title: '精彩应用' });
                },
                //推荐好友，Hybrid
                'recommend': function () {
                    Guider.recommend();
                },
                //参与用户体验改善计划，Hybrid
                'survey': function () {
                    cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_survey' }, null);

                    var userStore = commonStore.UserStore.getInstance(),
                        link = 'http://m.ctrip.com/html5/market/survey.html';

                    if (userStore.getUser()) {
                        link = link + '?UID=' + userStore.getUser().UserID;
                        return Guider.jump({ targetModel: 'h5', url: link, title: '参与用户体验改善计划' });
                    } else {
                        self.showLoading();
                        Member.nonMemberLogin({
                            callback: function () {
                                self.hideLoading();
                                var userInfo = userStore.getUser(); // nonMemberLogin
                                if (userInfo && userInfo.UserID && userInfo.UserID != '') {
                                    link = link + '?UID=' + userInfo.UserID;
                                    return Guider.jump({ targetModel: 'h5', url: link, title: '参与用户体验改善计划' });
                                }
                            }
                        });
                    }
                },
                //常见问题，H5 Hybrid
                'question': function () {
                    //H5不埋点
                    if (cUtilCommon.isInApp) {
                        cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_question' }, null);
                    }
                    Guider.jump({ targetModel: 'h5', url: 'http://m.ctrip.com/webapp/wechat/#help', title: '常见问题' });
                },
                //为携程旅行评分，Hybrid(ios)
                'grade': function () {
                    cHybridShell.Fn('do_business_job').run(1, "HYBRID_UBT", { actionname: 'c_comment' }, null);
                    cHybridShell.Fn('do_business_job').run(1, "common/openAppComment", null, null);
                }
            };

            if (typeof links[href] === 'function') {
                typeof links[href]();
            }

            return;
        }
    });
    return View;
});