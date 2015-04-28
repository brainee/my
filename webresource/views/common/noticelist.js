define(['cPageList', 'MyCtripStore', 'MyCtripModel', 'cUtilDate', 'cGuiderService'], function (cPageList, MyCtripStore, MyCtripModel, cUtilDate, Guider) {
    var customerNoticesListModel = MyCtripModel.CustomerNoticesListModel.getInstance(),
        customerNoticesListStore = MyCtripStore.CustomerNoticesListStore.getInstance(),
        customerNoticesDateStore = MyCtripStore.CustomerNoticesDateStore.getInstance();

    var View = cPageList.extend({
        pageid: '231073',//h5
        hpageid: '',//hybrid
        dataList: [],
        events: {
            'click .myc_nlist li': 'showNoticeDeatil' //公告详情
        },
        onCreate: function () { },
        onShow: function () {
            var self = this;
            cPublic.ctripMenu({ show: true, buName: 'about' });
            
            this.setTitle('携程公告');
            this.render();
            this.headerview.set({
                title: "携程公告",
                back: true,
                view: self,
                events: {
                    returnHandler: function () {
                        Lizard.goTo(Lizard.appBaseUrl + 'common/about');
                    }
                }
            });
            this.headerview.show();

            customerNoticesDateStore.setAttr('isread', 1);
            this.getNotices();
        },
        render: function () {
            this.$el.html(Lizard.T('noticelist'));
            this.elsBox = {
                lsttpl: this.$el.find("#lsttpl"), // 列表模板
                lstbox: this.$el.find('#lstbox'), // 列表容器
            };
            this.elsBox.lstbox.empty(); //清空
            this.lstboxfun = _.template(this.elsBox.lsttpl.html());
        },
        onHide: function () {
            customerNoticesListModel.abort();
            customerNoticesDateStore.setAttr('isread', 1);
            this.hideLoading();
            this.hideBottomLoading();
            this.hideWarning404();
        },
        showNoticeDeatil: function (e) {
            var oid = $(e.currentTarget).attr('id');
            var data = this.dataList[oid];
            if (data) {
                var customerNoticesDetailStore = MyCtripStore.CustomerNoticesDetailStore.getInstance();
                //var startDate = cUtilDate.parse(data.StartDate).format('Y-m-d H:i');

                customerNoticesDetailStore.setAttr("StartDate", data.StartDate);
                customerNoticesDetailStore.setAttr("NoticeBody", data.NoticeBody);
                customerNoticesDetailStore.setAttr("NoticeTitle", data.NoticeTitle);
                Lizard.goTo(Lizard.appBaseUrl + 'common/noticedetail');
            }
        },
        renderList: function (data) {
            var self = this,
                listString = '';

            if (data && data.Notices && $.isArray(data.Notices) && data.Notices.length > 0) {
                var dayNow = cUtilDate.getServerDate();
                for (var i = 0, len = data.Notices.length; i < len; i++) {
                    var notice = data.Notices[i],
                        startDate = notice.StartDate;
                    notice.StartDate = startDate ? cUtilDate.format(self.dateParse(startDate), 'Y-m-d H:i') : '';
                    notice.i = i;

                    if (dayNow < self.dateParse(notice.EndDate)) {
                        listString += self.lstboxfun(notice);
                    }
                }
                this.elsBox.lstbox.append(listString);
            }
        },
        getNotices: function () {
            var self = this;
            var dateObj = customerNoticesDateStore.get();
            var publishDate = "1970/1/1 1:01:01";

            this.showLoading();
            //每次发服务前读取本地store里面最后发布时间（调服务成功后写入），并作为参数。若第一次或者localstorage被清除后使用默认的起始时间"1970/1/1 1:01:01"
            if (dateObj && dateObj.PublishDate && dateObj.PublishDate !== "null") {
                //如果时间与当前时间不符，则删除本地存储 TODO
                //publishDate = (new cBase.Date(cUtility.dateParse(dateObj.PublishDate))).addDay(-30).format('Y/m/d H:i:s'); //为什么要-30天 TODO
                publishDate = cUtilDate.format(self.dateParse(dateObj.PublishDate), 'Y/m/d H:i:s');
            }
            customerNoticesListModel.setParam("PublishDate", publishDate);
            customerNoticesListModel.excute(function (data) {
                this.hideLoading();
                if (data && data.Result && data.Result.ResultCode === 0) {
                    if (data.Notices && data.Notices.length > 0) {
                        this.renderList(data);
                        this.dataList = data.Notices;
                    } else {
                        this.elsBox.lstbox.html('<div class="cui-load-error"><div class="cui-i cui-wifi cui-exclam"></div>暂无公告</div>');
                    }
                    customerNoticesDateStore.setAttr('PublishDate', data.LatestPublishDate);
                } else {
                    customerNoticesListStore.remove();
                    this.showWarning404(function () {
                        self.hideWarning404();
                        self.onShow();
                    });
                }
            }, function (err) {
                self.hideLoading();
                self.showWarning404(function () {
                    self.hideWarning404();
                    self.onShow();
                });
            }, true, this, function (err) {
                self.hideLoading();
                self.showWarning404(function () {
                    self.hideWarning404();
                    self.onShow();
                });
            });
        },
        dateParse: function (str) { //时间戳处理
            return eval('new ' + str.replace('/', '', 'g').replace('/', '', 'g'));
        },
        onBottomPull: function () { //无onBottomPull会引起Lizard.seed.js报错,这是什么情况
            return;
        }
    });
    return View;
})