define(['cPageView', 'cGuiderService', 'cUtilCommon'], function (BasePageView, Guider, cUtilCommon) {

    var View = BasePageView.extend({
        pageid: '200000',
        hpageid: '210000',
        events: {
            'click [data-href]': 'linkTo'
        },
        linkTo: function (e) {
            var that = this,
                $target = $(e.currentTarget),
                href = $target.attr('data-href'),
                hybridUrl = $target.attr('data-hybrid'),
                title = $target.find('h2').html();

            Guider.apply({
                hybridCallback: function () {
                    if (hybridUrl.indexOf('http://m.ctrip.com') == 0 || hybridUrl.indexOf('http://pages.ctrip.com/') == 0 || hybridUrl.indexOf('http://contents.ctrip.com/') == 0) {
                        Lizard.jump(hybridUrl, {
                            targetModel: 2,
                            meta: {
                                isHideLoadingViewForOnlinePage: true
                            }
                        });

                    } else if (hybridUrl.indexOf('http') == 0) {
                        Guider.jump({ targetModel: 'browser', url: hybridUrl, title: title });
                    } else {
                        var parts = hybridUrl.replace(/^\/webapp\//i, '').split('/');
                        var url;

                        if (parts[1].indexOf('index.html') == -1) {
                            url = parts[0] + "/index.html#" + hybridUrl;
                        } else
                            url = parts.join("/");

                        Guider.jump({ targetModel: 'open', title: title, url: url });
                    }
                },
                callback: function () {
                    if (href.indexOf('http') == 0)
                        Guider.jump({ targetModel: 'browser', url: href });
                    else
                        that.jump(href);
                }
            });
        },
        onCreate: function () {
            var that = this;
        },
        onShow: function () {
            var that = this;

            this.header.set({
                title: '更多服务',
                back: {
                    tagname: 'back',
                    callback: function () {
                        Guider.apply({
                            callback: function () { that.jump('/html5/') },
                            hybridCallback: function () { Guider.home(); }
                        });
                    }
                },
                view: this
            });
            this.header.show();

            //this.turning();

            var headerInfo = localStorage.getItem('HEADERSTORE');
            var SOURCEID = localStorage.getItem('SOURCEID');

            if (SOURCEID == 9156 || (headerInfo && (headerInfo = JSON.parse(headerInfo)) && headerInfo.value && headerInfo.value.sid == 9156)) {
                $('.js_more_wifi').html('海外通讯').closest('div').attr({ title: '海外通讯' });
            }

            cUtilCommon.isInApp ? this.$(".js_hybrid").css("display", "block") : this.$(".js_hybrid").css("display", "none");
        },
        onHide: function () {
            // this.hideWarning404();
        }
    });
    return View;
});
