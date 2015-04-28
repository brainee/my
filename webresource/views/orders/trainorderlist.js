define(['commonlist', 'cHybridFacade', 'cUtilCommon', 'cHybridShell', 'myctripCommon'], function (CommonListFactory, Facade, cUtilCommon, cHybridShell, MyctripCommon) {
    return CommonListFactory.getInstance({
        pageid: '231055',
        hpageid: '231055',
        bizType: 'Train',
        viewType: 'trainorderlist',
        title: '火车票订单',
        onShow: function (self) {
            Facade.register({
                tagname: Facade.METHOD_WEB_VEW_DID_APPEAR, callback: function (json) {
                    json = typeof json == "string" && json ? JSON.parse(json) : json;
                    if (json && json.callbackString) {
                        json = json.callbackString;
                        json = typeof json == "string" && json ? JSON.parse(json) : json;
                        if (json && json.from == 'train' && json.refresh == '1' && json.to == 'myctrip') {
                            self.onShow();
                        }
                    }
                }
            });
        },
        onBeforeRequest: function (self) {
            //国内、国际火车票合并在一个订单列表里了,非会员不支持查询国际火车票，则默认为[train]
            if (MyctripCommon.checkLogin() === 1) {
                self.listModel.setParam('BizTypes', 'Train,TrainInternational');
            }
        },
        showView: function (self) {
            self._showGuideBar();
        },
        _showGuideBar: function () { //火车票12306订单引导栏只在app中展示(非会员不展示)，并且跳转至native
            if (cUtilCommon.isInApp) {
                var content = '12306订单',
                    barHtml = $('<div class="order-link">' + content + '</div>');
                this.$el.find('.order-link').remove();
                this.$el.find('.order-wrap').prepend(barHtml);
                $(document).on('click', '.order-link', function () {
                    cHybridShell.Fn('open_url').run('ctrip://wireless/train_12306orderlist', 1);
                });
            }
        }
    });
});
