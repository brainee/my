define(['cPageView', 'MyCtripStore', 'cGuiderService'], function (cPageView, MyCtripStore, Guider) {
    var customerNoticesDetailStore = MyCtripStore.CustomerNoticesDetailStore.getInstance();

    var View = cPageView.extend({
        pageid: '231075',//h5
        hpageid: '',//hybrid
        onShow: function () {
            var self = this;
            cPublic.ctripMenu({ show: true, buName: 'about' });

            this.setTitle('携程公告');
            this.render();
            this.headerview.set({
                title: "携程公告",
                back: true,
                view: this,
                events: {
                    returnHandler: function () {
                        Lizard.goTo(Lizard.appBaseUrl + 'common/noticelist');
                    }
                }
            });
            this.headerview.show();

            this.showNotice();
        },
        onHide: function () {
            this.hideLoading();
        },
        render: function () {
            this.$el.find("#cbox").remove();
            this.$el.html(Lizard.T('noticedetail'));
            this.elsBox = {
                lsttpl: this.$el.find("#listtpl_notice"), // 列表模板
                lstbox: this.$el.find('.myc_ndetail')// 列表容器
            };
            this.lstboxfun = _.template(this.elsBox.lsttpl.html());
        },
        showNotice: function () {
            var noticeObj = customerNoticesDetailStore.get();
            if (noticeObj !== null) {
                this.renderData(noticeObj);
            } else {
                Lizard.goTo(Lizard.appBaseUrl + 'common/noticelist');
            }
        },
        renderData: function (data) {
            var item = this.lstboxfun(data);
            this.elsBox.lstbox.html(item);
        }
    });
    return View;
});