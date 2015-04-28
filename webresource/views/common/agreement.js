define(['cPageView', 'cGuiderService'], function (cPageView, Guider) {
    var View = cPageView.extend({
        pageid: '',//h5
        hpageid: '410027',//hybrid
        onCreate: function () { },
        onShow: function () {
            var self = this;
            cPublic.ctripMenu({show:true, buName:'about'});
            
            this.setTitle('软件许可及服务协议');
            this.headerview.set({
                title: '软件许可及服务协议',
                back: true,
                view: self,
                events: {
                    returnHandler: function () {
                        Lizard.goTo(Lizard.appBaseUrl + 'common/about');
                    }
                }
            });
            this.headerview.show();
        },
        onHide: function () {
            this.hideLoading();
        }
    })
    return View;
});
