define(['CommonStore', 'cPageList', 'MyCtripModel', 'MyCtripStore', 'cUtilCommon', 'cHybridShell', 'cGuiderService', 'cLocalStorage', 'cardloader', 'myctripCommon', 'cMemberService', 'UIBubbleLayer', loadModule('orderTypes'), loadModule('pagination', 'online')], function (CommonStore, cPageList, MyCtripModel, MyCtripStore, cUtilCommon, cHybridShell, Guider, cStorage, Card, MyctripCommon, Member, UIBubbleLayer, OrderTypes) {
    var OrderSearchModel = MyCtripModel.OrdersSearchModel.getInstance();
    var OrderNumbersModel = MyCtripModel.OrderNumbersModel.getInstance();

    var CommonListFactory = {
        /**
         ***params参数包括如下属性***
         **params里面可以包含除下面默认属性外的其他附加属性，但附加属性只会在onCreate里面被赋初值，若要每次进入页面都要设置附加属性的初始值，请提供onLoad方法并在其中手动初始化**
         *  pageid               可选，pageid,H5
         *  hpageid              可选, hpageid,Hybrid
         *  bizType              可选，bizType
         *  viewType             必须，viewType
         *  listModel            必须，列表model
         *  title                必须，页面title
         *  from                 可选，回退地址，若不传则默认使用"from="+encodeURIComponent("/webapp/myctrip/index.html#orders/"+this.viewType)
         *  entityName           可选，列表返回数据中列表字段属性名，默认OrderEnities
         *  bCustomizeHead       可选，是否自定义Head
         *  bNoNeedCheckLogin    可选，是否不需要检查登录态
         *  emptyText            可选，没有订单时显示的文本
         *  onCreate             可选，框架onCreate处理事件，若返回true则会取代原有的onCreate方法
         *  onShow               可选，框架onShow处理事件，若返回true则会取代原有的onShow方法
         *  showView             可选，框架showView处理事件，若返回true则会取代原有的showView方法
         *  onHide               可选，框架onHide处理事件，若返回true则会取代原有的onHide方法
         *  onBottomPull         可选，框架onBottomPull处理事件，若返回true则会取代原有的onBottomPull方法
         *  onBack               可选，自定义onBack处理事件，点头部后退按钮时会调用此方法。若返回true则会取代原有的onHide方法
         *  onBeforeRequest      可选，自定义onBeforeRequest处理事件，请求发送前会调用此方法
         *  onAfterRequest       可选，自定义onAfterRequest处理事件，请求发送后会调用此方法
         *  onAfterRender        可选，自定义onAfterRender处理事件，页面渲染完成后会调用此方法
         *  onChangeTab          可选，自定义onChangeTab处理事件，当切换tab时会调用此方法
         *  onError              可选，自定义onError处理事件，当请求数据出错时会调用此方法
         *  init                 可选，若提供此方法，可在View定义前就被调用，提供初始化操作
         */
        getInstance: function (params) {
            if (!params || 'undefined' === params.viewType || 'undefined' === params.title) {
                var NECESSARY_PARAMS = ['viewType', 'title'],
                    missedParams = [];
                NECESSARY_PARAMS.forEach(function (param) {
                    if (!params.hasOwnProperty(param)) {
                        missedParams.push(param);
                    }
                });
                console.error('Missing parameter(s): ' + missedParams.join(', '));
            }
            if (params.init && typeof params.init === 'function') {
                params.init();
            }
            if (!params.entityName) {
                params.entityName = 'OrderEnities';
            }
            if (!params.from) {
                params.from = 'from=' + encodeURIComponent('/webapp/myctrip/orders/' + params.viewType);
            }
            //var FIXED_PARAMS = ['pageid', 'bizType', 'viewType', 'listModel', 'from', 'title', 'entityName', 'onCreate', 'onShow', 'showView', 'onBeforeRequest', 'onAfterRequest', 'onHide', 'onBottomPull'];
            var FIXED_PARAMS = ['onCreate', 'onShow', 'showView', 'onHide', 'onBottomPull'];
            var userStore = CommonStore.UserStore.getInstance(),
                backStore = MyCtripStore.OrderlistBackStore.getInstance(),
                CommonListPageView = cPageList;

            var View = CommonListPageView.extend({
                pageid: params.pageid,
                hpageid: params.hpageid,
                bizType: params.bizType || false,
                viewType: params.viewType,
                listModel: params.listModel || OrderSearchModel,
                unionType: params.unionType || false,
                pageNum: 1, //当前页数
                isOnline: MyctripCommon.isOnline, //是否是online环境
                pageSize: MyctripCommon.isOnline ? 10 : 25, //每页订单数目。手机端显示25条，online版显示10条
                totalPage: undefined, //总页数
                bNoMore: false, //是否当前已处于最后一页
                bLoading: false, //是否现在正在加载
                bTopPulling: false, //标识当前是否正在下拉刷新
                loginStatus: MyctripCommon.checkLogin(),
                frompageurl: params.from, //当前页地址，用于跳转到子页面后返回到当前页
                onCreate: function () {
                    //新的非会员逻辑
                    if (this.loginStatus === 2 && MyctripCommon.isJoinMobileSearch(this.bizType)) {
                        this._newUnlogin();
                    }

                    //将当前订单列表页定义的属性添加到当前页面
                    for (var param in params) {
                        if (params.hasOwnProperty(param)) {
                            if ($.inArray(param, FIXED_PARAMS) === -1) {
                                this[param] = params[param];
                            }
                        }
                    }

                    //如果当前订单列表页有定义onCreate方法，则调用（若有返回值true，则跳过下面的代码）
                    if (params.onCreate && typeof params.onCreate == 'function') {
                        if (params.onCreate(this)) {
                            return;
                        }
                    }
                },
                onShow: function () {
                    //设置当前view对象的值
                    Card.setView(this, this.isOnline);

                    //显示左侧栏菜单
                    if (isShowSlideMenu) {
                        //非登录时不显示左侧栏菜单
                        if (this.loginStatus === 1) {
                            //初始化Pad中的左侧菜单。在手机中不显示左侧菜单，Pad中显示
                            cPublic.ctripMenu({
                                show: true,
                                buName: 'order'
                            });

                            //初始化Pad方法
                            Card.initForPad();
                        }
                    }

                    //没有自定义头部的话就使用通用的头部，否则在订单列表页自定义头部
                    if (!this.isOnline && !this.bCustomizeHead) {
                        this.showHead();
                    }

                    //跳转到下一个页面时传递的from参数，用于后退返回
                    this.frompageurl = 'from=' + encodeURIComponent('/webapp/myctrip/orders/' + this.viewType);

                    //是否是聚合页，还是各BU各自的订单列表页
                    if (this.viewType == 'allorders' || this.viewType == 'unpaidorderlist' || this.viewType == 'unuseorderlist' || this.viewType == 'uncommentorderlist' || this.viewType == 'searchresult') {
                        this.isAggregated = true;
                    } else {
                        this.isAggregated = false;
                    }

                    //若订单列表页提供了onShow方法，则调用
                    if (params.onShow && typeof params.onShow == 'function') {
                        if (params.onShow(this)) {
                            return;
                        }
                    }

                    //进入当前页面时如果有传from参数，则先保存在localStorage中，用于跳转到其它页面再返回到当前页面时，再从当前页面返回，回到from页面
                    var from = Lizard.P('from');
                    if (from && from !== 'offline') {
                        var backObj = backStore.get();
                        if (!backObj) {
                            backObj = {};
                        }
                        backObj[this.viewType] = from;
                        backStore.set(backObj);
                    }

                    this.showView();
                },
                showView: function () {
                    //初始化页面参数
                    this.pageNum = 1;
                    this.bNoMore = false;
                    this.bLoadedOrdersCount = false;

                    var containerClass = 'order-bg ',
                        sectionClass = '';
                    if (this.isOnline) {
                        containerClass += 'other_wrap';
                    } else {
                        containerClass += 'sub-viewport';
                        sectionClass = 'order-wrap';
                    }

                    this.$el.addClass(containerClass).html('<section class="' + sectionClass + '"><ul id="' + this.viewType + '" class="order-list" style="min-height:380px"></ul></section>'); //创建viewBox
                    this.elsBox = {
                        lstbox: this.$el.find('#' + this.viewType) // 列表容器
                    };

                    //初始化操作，把HTML插入到页面中
                    OrderTypes.append(this, MyctripCommon.getOrderTypeList(this.isOnline));

                    this._showPadHead();

                    //判断是否登录，未登录则跳转到登录页
                    if (this.bNoNeedCheckLogin || this._checkLogin()) {
                        if (params.showView && typeof params.showView == 'function') {
                            if (params.showView(this)) {
                                return;
                            }
                        }
                        this.listModel.setParam({
                            PageSize: this.pageSize,
                            BizTypes: this.bizType || '',
                            OrderStatusClassify: this.unionType || 'All',
                            Channel: this.isOnline ? 'Online' : (Lizard.isHybrid ? 'Hybrid' : 'H5')
                        });

                        //Pad/online版下，点击某个BU订单下的待支付、待点评、未出行订单列表时，需要设置BizTypes参数，以过滤此BU下的这类订单
                        if (isShowSlideMenu && ['unpaidorderlist', 'unuseorderlist', 'uncommentorderlist'].indexOf(this.viewType) > -1 && Lizard.P('viewtype') && Lizard.P('biztype')) {
                            this.listModel.setParam('BizTypes', Lizard.P('biztype'));
                        }

                        this.loadData();
                    }
                },
                loadData: function () {
                    var self = this,
                        bFirst = this.pageNum === 1 ? true : false;

                    this.bLoadDataError = false;

                    //请求发送前的回调函数
                    if (params.onBeforeRequest && typeof params.onBeforeRequest == 'function') {
                        if (params.onBeforeRequest(this, bFirst)) {
                            return;
                        }
                    }

                    if (this.bTopPulling) {
                        this.showTopLoading();
                    } else {
                        if (this.isOnline) {
                            this._showLoading();
                        } else {
                            if (bFirst) {
                                this._showLoading();
                            } else {
                                this.showBottomLoading();
                            }
                        }
                    }

                    // 标识当前是否在加载
                    this.bLoading = true;
                    this.listModel.setParam("PageIndex", this.pageNum);
                    //聚合页分页时需要BookingDateTime参数，但请求第一页数据时不需要BookingDateTime参数
                    if (bFirst) {
                        delete this.listModel.param.BookingDateTime;
                    }
                    this.listModel.excute(function (data) {
                        //数据成功返回后的回调函数
                        if (params.onAfterRequest && typeof params.onAfterRequest == 'function') {
                            if (params.onAfterRequest(self, data, bFirst)) {
                                return;
                            }
                        }
                        if (data && data.Result && data.Result.ResultCode == 0) {
                            if (typeof data.TotalCount == 'undefined') { //酒店非会员查询总数字段是totalcount
                                data.TotalCount = data.totalcount;
                            }
                            if (bFirst) {
                                self.totalPage = Math.ceil(data.TotalCount / self.pageSize);

                                //更新header上的订单数目
                                self._setTitleNumber(data.TotalCount);

                                //如果是下拉刷新，需要清空当前内容
                                if (this.bTopPulling) {
                                    this.elsBox.lstbox.html('');
                                }
                            }
                            self.renderList(data, bFirst);
                            self.pageNum++;

                            //聚合页分页时需要设置BookingDateTime参数
                            if (self.isAggregated) {
                                var orderEnities = data[self.entityName];
                                if (orderEnities && orderEnities.length > 0) {
                                    var lastEntity = orderEnities[orderEnities.length - 1];
                                    if (lastEntity && lastEntity.BookingDate) {
                                        self.listModel.setParam('BookingDateTime', lastEntity.BookingDate);
                                    }
                                }
                            }

                            self._complete();
                        } else {
                            self._error(data, true, bFirst);
                        }
                    }, function (data) {
                        self._error(data, false, bFirst);
                    }, true, self, function (data) {
                        self._error(data, false, bFirst);
                    });
                },
                renderList: function (data, bFirst) {
                    var self = this;
                    var listString = '',
                        items = data[this.entityName],
                        itemString = '';
                    if (bFirst && this.totalPage <= 0) {
                        this.$el.removeClass('order-bg');
                        if (this.viewType === 'searchresult') {
                            this.elsBox.lstbox.append('<div class="search-noresult"><i class="i-search-noresult"></i><p>没有找到符合条件的结果，<br />请修改条件重新查询。</p></div>');
                        } else {
                            var emptyText = '';
                            if (this.emptyText) {
                                emptyText = this.emptyText;
                            } else {
                                emptyText = '暂时没有相关订单';
                            }
                            this.elsBox.lstbox.html('<div class="noorder"><p><i class="i-noorder"></i></p><p>' + emptyText + '</p></div>');
                        }
                        this.bNoMore = true;
                    } else {
                        //渲染卡片html，追加到页面后面
                        if (items && $.isArray(items) && items.length > 0) {
                            for (var i = 0, len = items.length; i < len; i++) {
                                itemString = Card.render(items[i]);
                                if (typeof itemString !== 'undefined') {
                                    listString += itemString;
                                }
                            }
                        }

                        if (this.isOnline) {
                            this.elsBox.lstbox.html(listString);
                        } else {
                            this.elsBox.lstbox.append(listString);
                        }

                        //若有渲染后的事件onAfterRender，则调用
                        if (params.onAfterRender && typeof params.onAfterRender === 'function') { //页面渲染完成后的回调
                            if (params.onAfterRender(self)) {
                                return;
                            }
                        }

                        //若现在已是最后一页，则提示没有更多订单了
                        if (this.pageNum >= this.totalPage) {
                            this.elsBox.lstbox.append($("<p class='nomore'>没有更多订单了</p>"));
                            this.bNoMore = true;
                        }
                        if (bFirst) {
                            window.scrollTo(0, 1);
                            window.scrollTo(0, 0); //Chrome浏览器会记住上一次滚动的位置，若上一次向下滚动加载了下一页的数据，此时刷新页面，虽滚动条出现在顶部，但轻微滚动就会跳到底部并触发下一页的请求，且有时会滚动滚动条无效，必须拖动一下滚动条后才能滚动。在第一次加载时清除上次的位置，使滚动条初始滚动到顶部（直接使用window.scrollTo(0, 0)可解决部分问题，但仍有一定概率会出现上述问题。试验后发现调用两次后可完全解决）
                        }

                        if (this.isOnline && bFirst) {
                            this.$el.find('.paging_box').remove();
                            this.$el.children('section').append($('<div class="paging_box"><div class="paging"></div></div>'));
                            $('.paging_box').pagination(data.TotalCount, {
                                callback: function (page) {
                                    self.pageNum = page + 1;// 当前页数
                                    // 先清空，再加载数据
                                    self.elsBox.lstbox.empty();
                                    self.loadData();
                                },
                                prev_text: "&nbsp;",
                                next_text: "下一页 ",
                                items_per_page: 10, //每页的数据个数
                                num_display_entries: 5, //连续分页主体部分分页条目数
                                current_page: 0, //当前页码
                                num_edge_entries: 1, //两侧首尾分页条目数
                                view: self
                            });
                        }
                    }
                },
                _error: function (data, bServerError, bFirst) {
                    var self = this;
                    this.bLoadDataError = true;

                    this._complete();

                    //UBT
                    MyctripCommon.sendUbtTrace({
                        traceName: 'myctrip_order',
                        pageId: self.hpageid,
                        pageName: self.viewType,
                        bServerError: bServerError,
                        err: data
                    });

                    if (params.onError && typeof params.onError === 'function') {
                        if (params.onError(this, data, bServerError, bFirst)) {
                            return;
                        }
                    }

                    if (this.pageNum === 1) {
                        self.bNoMore = true;
                        var Network = new cPublic.network({ parent: '#' + this.viewType });
                        Network.loadFailed(function (close) {
                            close();
                            self.showView();
                        });
                    } else {
                        var Prompt = new cPublic.prompt({
                            message: {
                                title: '',
                                content: '加载失败，请稍后再试'
                            },
                            autoHide: true,
                            timeout: 1000
                        });
                        Prompt.prompt();
                    }
                },
                _complete: function () {
                    this.bLoading = false;
                    this._hideLoading();
                    this.hideBottomLoading();

                    if (this.bTopPulling) {
                        this.bTopPulling = false;
                        this.hideRefreshLoading();
                    }
                },
                _newUnlogin: function () {
                    //非会员手机号码查询model
                    params.listModel = MyCtripModel.UnLoginGetOrderModel.getInstance();
                    params.entityName = 'OrderEnities';
                    params.onBack = function () {
                        Lizard.goTo('/webapp/myctrip/orders/ordertypelist');
                        return true;
                    }
                },
                _showLoading: function () {
                    var cPub = new cPublic.network({ parent: '#' + this.viewType, position: 'relative' });
                    this.closeloading = cPub.loading(function (close) {
                        return close;
                    });
                    this.$el.find('.cp-h5-main').css('height', $('#main').height() - (cUtilCommon.isInApp ? 21 : 65));
                },
                _hideLoading: function () {
                    if (typeof (this.closeloading) == 'function') {
                        this.closeloading();
                    }
                },
                onHide: function () {
                    if (params.onHide && typeof params.onHide == 'function') {
                        if (params.onHide(this)) {
                            return;
                        }
                    }
                    this.listModel.setParam({
                        BookingDateTime: '',
                        PageSize: 1,
                        BizTypes: '',
                        OrderStatusClassify: ''

                    });
                    this.removeScrollListener();
                    this.hideBottomLoading();
                    this.hideWarning404();

                    //App中使用新开webview的方式打开页面，跳走时不应该中断当前页的请求
                    if (!cUtilCommon.isInApp) {
                        this.listModel.abort();
                    }

                    //隐藏订单选择弹层
                    OrderTypes.hide(this);

                    this.bTopPulling = false;
                },
                // 下拉刷新
                onTopPull: function () {
                    //下拉时，onTopPull会被触发多次，用此判断来避免下拉事件被处理多次
                    if (this.bTopPulling) {
                        return;
                    }

                    //触发下拉后会加载第一页的数据，此时需要先初始化一些变量
                    this.pageNum = 1;
                    this.bNoMore = false;
                    this.bTopPulling = true;

                    if (params.onTopPulling && typeof params.onTopPulling == 'function') {
                        if (params.onTopPulling(this)) {
                            return;
                        }
                    }

                    this.loadData();
                },
                // 下拉分页
                onBottomPull: function () {
                    if (this.isOnline) {
                        return;
                    }

                    if (this.bNoMore || this.bLoading) {
                        //修复滚动到最后后不会再出发onTopPull问题
                        this.endPull();
                        return;
                    }

                    if (!this._checkLogin()) {
                        return;
                    }

                    if (params.onBottomPull && typeof params.onBottomPull == 'function') {
                        if (params.onBottomPull(this)) {
                            return;
                        }
                    }
                    this.loadData();
                },
                showHead: function () {
                    var self = this;
                    var headData = {
                        back: true,
                        view: self,
                        events: {
                            returnHandler: function () {
                                var from = Lizard.P('from');
                                var backObj = backStore.get();
                                if (backObj && backObj[self.viewType]) {
                                    if (!from) {
                                        from = backObj[self.viewType];
                                    }
                                    delete backObj[self.viewType];
                                    backStore.set(backObj);
                                }
                                if (from) {
                                    from = from.replace(/javascript|img/gi, "").replace(/\<|\>/g, "");
                                    from = decodeURIComponent(from);
                                    //离线订单进来from参值为offline，不能按此from后退
                                    if (from.toLowerCase() === 'offline') {
                                        from = '';
                                    }
                                }

                                //若某订单列表的后退逻辑较特殊，可以在其view里提供onBack方法，则后退时会调用此方法。若onBack返回true则只会使用view内部的onBack方法，跳过下面的后退跳转逻辑。
                                if (self.onBack && typeof self.onBack == 'function') {
                                    if (self.onBack(self, from)) {
                                        return;
                                    }
                                }
                                Guider.apply({
                                    hybridCallback: function () {
                                        if (from) {
                                            Lizard.jump(from);
                                        } else {
                                            var fromNative = Lizard.P('from_native_page');
                                            if (fromNative === '1' && self.viewType !== 'insureorderlist') {//保险订单跳H5直连页面，返回时会被框架自动加上from_native_page=1的参数（应该是框架bug，此处暂时特殊处理）
                                                Guider.backToLastPage();
                                            } else {
                                                if (isShowSlideMenu) {
                                                    Lizard.jump('/webapp/myctrip/index');
                                                } else {
                                                    Guider.jump({
                                                        targetModel: 'app',
                                                        module: 'myctrip'
                                                    });
                                                }
                                            }
                                        }
                                    },
                                    callback: function () {
                                        Lizard.jump(from ? from : Lizard.appBaseUrl);
                                    }
                                });
                            },
                            citybtnHandler: function (e) {
                                //未登录时跳转至订单列表选择页面
                                if (this.loginStatus != 1) {
                                    Lizard.goTo('/webapp/myctrip/orders/ordertypelist');
                                } else {
                                    //显示订单选择弹层
                                    OrderTypes.show(self, e, OrderNumbersModel);
                                }
                            }
                        }
                    };

                    //有左侧菜单栏时，框架头部不需要有下列操作，下拉操作在下面
                    if (isShowSlideMenu) {
                        headData['title'] = this.title;
                    } else {
                        headData['citybtn'] = this.title;
                    }

                    //在全部订单、酒店订单、机票订单以及搜索结果页需要显示“查找”按钮。不出现左侧菜单时显示，出现时在别处显示
                    if (!isShowSlideMenu) {
                        var userInfo = userStore ? userStore.getUser() : null;
                        if ((userInfo && !userInfo.IsNonUser) && (self.viewType == 'allorders' || self.viewType == 'hotelorderlist' || self.viewType == 'flightorderlist')) {
                            var query = location.href.indexOf('?') > -1 ? location.href.slice(location.href.indexOf('?')) : '';
                            if (!query || query.indexOf('searchfrom') < 0) {
                                query = '?searchfrom=' + self.viewType;
                            }
                            headData['right'] = [
                                {
                                    tagname: 'custom',
                                    value: '查找',
                                    callback: function () {
                                        if (self.totalPage === undefined || self.totalPage > 0) {
                                            Lizard.jump(Lizard.appBaseUrl + 'orders/search' + query);
                                        }
                                    }
                                }
                            ];
                        }
                    }

                    self.header.set(headData);
                },
                _showPadHead: function () {
                    //显示左侧菜单栏，且不是搜索结果页，也不是非会员查询时才显示
                    if (!isShowSlideMenu || this.viewType === 'searchresult' || this.loginStatus !== 1) {
                        return;
                    }

                    //如果Tab已存在，直接返回
                    if (this.$el.find('.order-header').length) {
                        return;
                    }

                    var viewType = isShowSlideMenu ? (Lizard.P('viewtype') || this.viewType) : this.viewType;
                    var filtered = this._getOrderNumberRequestParam(viewType);

                    var self = this,
                        className = '',
                        title = '',
                        url = '',
                        dropdown = '',
                        search = '',
                        orderTypes = MyctripCommon.getOrderTypeList(this.isOnline),
                        other = '',
                        pages = {
                            'allorders': {
                                name: '全部订单',
                                url: 'orders/allorders'
                            }
                        },
                        orderTabHtml = '<div class="order-header"><ul class="orders-status-filter">';

                    if (filtered['AwaitPay']) {
                        pages['unpaidorderlist'] = { name: '待付款', url: 'orders/unpaidorderlist', group: 'AwaitPay' };
                    }
                    if (filtered['NotTravel']) {
                        pages['unuseorderlist'] = { name: '未出行', url: 'orders/unuseorderlist', group: 'NotTravel' };
                    }
                    if (filtered['AwaitReview']) {
                        pages['uncommentorderlist'] = { name: '待评价', url: 'orders/uncommentorderlist', group: 'AwaitReview' };
                    }

                    for (var i in pages) {
                        if (pages.hasOwnProperty(i)) {
                            if (i === 'allorders') {
                                var item = null,
                                    biztype = self.bizType;
                                biztype = Lizard.P('biztype') || biztype;
                                for (var j = 0, len = orderTypes.length; j < len; j++) {
                                    item = orderTypes[j];

                                    //聚合页
                                    if (item.biztype instanceof Array) {

                                        if (item.biztype.length === biztype.length) {
                                            item.biztype.sort();
                                            biztype.sort();
                                            //相同数组内容
                                            if (item.biztype.toString() == biztype.toString()) {
                                                title = item.name;
                                                url = item.url;
                                                break;
                                            }
                                        }
                                    }
                                    //非聚合页
                                    else {
                                        if (item.biztype === biztype) {
                                            title = item.name;
                                            url = item.url;
                                            break;
                                        }
                                    }
                                }
                                if (j === len) {
                                    title = '全部订单';
                                    url = 'orders/allorders';
                                }
                                if (['unpaidorderlist', 'unuseorderlist', 'uncommentorderlist'].indexOf(self.viewType) === -1) {
                                    className = ' class="filter-all current"';
                                } else {
                                    className = ' class="filter-all"';
                                }
                                dropdown = '<span class="ico-drop"></span>';
                            } else {
                                className = self.viewType === i ? ' class="current"' : '';
                                dropdown = '';
                                title = pages[i].name;
                                url = pages[i].url;
                                other = ' data-group=' + pages[i].group;
                            }
                            orderTabHtml += '<li' + className + other + ' data-url="' + url + '"><span class="title">' + title + '</span>&nbsp;<i></i>' + dropdown + '</li>';
                        }
                    }
                    search = (!this.isOnline && ['allorders', 'hotelorderlist', 'flightorderlist'].indexOf(self.viewType) > -1) ? '<span class="find">查找</span>' : '';
                    orderTabHtml += '</ul>' + search + '</div>';
                    //非online版采用fixed布局，需在外层加一个div，以使其占据空间
                    if (!this.isOnline) {
                        orderTabHtml = '<div style="height:44px">' + orderTabHtml + '</div>';
                    }
                    this.$el.find('.tab-model').remove();
                    this.$el.prepend(orderTabHtml);
                    this.$el.find('.orders-status-filter li').on('click', function (e) {
                        if (!$(this).hasClass('current')) {
                            var param = '',
                                biztype = self.bizType || Lizard.P('biztype'),
                                viewtype = Lizard.P('viewtype') || self.viewType;
                            if (!$(e.currentTarget).hasClass('filter-all')) {
                                param = '?viewtype=' + viewtype + (biztype ? '&biztype=' + biztype : '');
                            }
                            Lizard.jump(Lizard.appBaseUrl + $(e.currentTarget).data('url') + param);
                        }
                    });
                    this.$el.find('.orders-status-filter .ico-drop').on('click', function (e) {
                        //显示订单选择弹层
                        OrderTypes.show(self, e, OrderNumbersModel);
                        e.stopPropagation();
                    });
                    this.$el.find('.order-header .find').on('click', function (e) {
                        if (self.totalPage === undefined || self.totalPage > 0) {
                            var query = location.href.indexOf('?') > -1 ? location.href.slice(location.href.indexOf('?')) : '';
                            if (!query || query.indexOf('searchfrom') < 0) {
                                query = '?searchfrom=' + self.viewType;
                            }
                            Lizard.jump(Lizard.appBaseUrl + 'orders/search' + query);
                        }
                    });

                    //屏幕太窄时显示不下，故不再显示订单数目
                    if ($(window).width() >= 768) {
                        //加载订单数
                        var orderStatusModel = MyCtripModel.OrderStatusModel.getInstance();
                        var params = [];
                        for (var i in filtered) {
                            params.push({ GroupName: i });
                        }
                        if (params.length === -1) {
                            return;
                        }
                        orderStatusModel.setParam('OrderStatisticsGroups', params);
                        var biztype = this.bizType || Lizard.P('biztype') || '';
                        orderStatusModel.setParam('BizTypes', biztype);
                        orderStatusModel.excute(function (data) {
                            if (data && data.Result && data.Result.ResultCode == 0 && data.OrderStatisticsGroupList) {
                                var list = data.OrderStatisticsGroupList,
                                    item = null,
                                    statuses = {},
                                    statusTabs = self.$el.find('.orders-status-filter > li');
                                if (list && list.length) {
                                    for (var i = 0; i < list.length; i++) {
                                        item = list[i];
                                        if (item && item['GroupName'] && typeof item['Count'] !== 'undefined' && parseInt(item['Count'], 10) > 0) {
                                            statuses[item['GroupName']] = parseInt(item['Count'], 10);
                                        }
                                    }
                                    if (statuses.hasOwnProperty('AwaitPay')) {
                                        statusTabs.filter('[data-group="AwaitPay"]').find('i').text('(' + statuses['AwaitPay'] + ')');
                                    }
                                    if (statuses.hasOwnProperty('NotTravel')) {
                                        statusTabs.filter('[data-group="NotTravel"]').find('i').text('(' + statuses['NotTravel'] + ')');
                                    }
                                    if (statuses.hasOwnProperty('AwaitReview')) {
                                        statusTabs.filter('[data-group="AwaitReview"]').find('i').text('(' + statuses['AwaitReview'] + ')');
                                    }
                                }
                            }
                        }, function (err) {
                        }, true, this, function (complete) {
                        });
                    }
                },
                /**
                 * 判断是否登录
                 */
                _checkLogin: function () {
                    var self = this;
                    self.loginStatus = MyctripCommon.checkLogin();
                    if (self.loginStatus === 0) {
                        var fromUrl = '';
                        if (!cUtilCommon.isInApp) {
                            fromUrl = Lizard.P('from') || '';
                            fromUrl && (fromUrl = '&backurl=' + encodeURIComponent(fromUrl));
                        }
                        var param = {
                            param: this.frompageurl + fromUrl
                        };
                        if (cUtilCommon.isInApp) {
                            var _callback = function (data) {
                                if (!data) {
                                    var from = Lizard.P('from');
                                    var fromurl = Lizard.P('from_native_page');
                                    if (fromurl == 1) {
                                        Guider.backToLastPage();
                                    } else if (from) {
                                        if (/.*(\/webapp\/)(\w*)(\/)(.*)/.test(from)) {
                                            Lizard.jump(from);
                                        } else {
                                            Guider.backToLastPage();
                                        }
                                    } else {
                                        Guider.jump({
                                            targetModel: 'app',
                                            module: 'myctrip'
                                        });
                                    }
                                } else {
                                    self.onShow();
                                }
                            };
                            param.callback = _callback;
                        }
                        Member.memberLogin(param);
                        return false;
                    } else {
                        return true;
                    }
                },

                /**
                 * 设置头部订单数目
                 */
                _setTitleNumber: function (count) {
                    if (count > 0) {
                        //手机设备，会显示框架的头部，更新此头部上的订单数目
                        if (MyctripCommon.isMobile) {
                            //不是搜索结果页
                            if (this.viewType !== 'searchresult') {
                                // 如果是待付款、未出行、待评价订单列表页
                                if (this.viewType === 'uncommentorderlist' || this.viewType === 'unpaidorderlist' || this.viewType === 'unuseorderlist') {
                                    this.header.updateHeader('title', this.title + '（' + count + '）');
                                } else {
                                    this.header.updateHeader('citybtn', this.title + '（' + count + '）');
                                }
                            }
                        } else {//宽屏设备，更新tabs上的订单数目
                            var orderTypes = MyctripCommon.getOrderTypeList(this.isOnline),
                                biztype = this.viewType === 'allorders' ? 'All' : this.bizType;
                            for (var i = 0, len = orderTypes.length; i < len; i++) {
                                if (orderTypes[i].biztype === biztype || orderTypes[i].biztype instanceof Array) {
                                    this.$el.find('.order-header .filter-all .title').text(orderTypes[i].name + '(' + count + ')');
                                    break;
                                }
                            }
                        }
                    }
                },
                //各BU订单，有的是不包含未出行、待点评或待支付的，此时在头部tab中应该不显示。（后端以后会过滤，但现在还未支持）
                _getOrderNumberRequestParam: function (viewType) {
                    var mappings = {
                            NotTravel: ['vacationunionorderlist', 'trainorderlist', 'tuantravelorderlist', 'busorderlist', 'flightorderlist', 'hotelorderlist', 'carunionorderlist', 'ticketsorderlist', 'insureorderlist', 'cruiseorderlist', 'localeventorderlist', 'selftravelorderlist', 'sceneryhotelorderlist', 'hhtravelorderlist', 'allorders', 'unpaidorderlist', 'unuseorderlist', 'uncommentorderlist'],
                            AwaitPay: ['vacationunionorderlist', 'tuanorderlist', 'busorderlist', 'trainorderlist', 'tuantravelorderlist', 'topshoporderlist', 'cruiseorderlist', 'hotelorderlist', 'travelticketorderlist', 'insureorderlist', 'airportbusorderlist', 'mallorderlist', 'globalbuyorderlist', 'localeventorderlist', 'allorders', 'unpaidorderlist', 'unuseorderlist', 'uncommentorderlist'],
                            AwaitReview: ['hotelorderlist', 'carunionorderlist', 'ticketsorderlist', 'localeventorderlist', 'cruiseorderlist', 'tuantravelorderlist', 'allorders', 'unpaidorderlist', 'unuseorderlist', 'uncommentorderlist']
                        },
                        param = {};
                    if (this.isOnline) {
                        mappings = {
                            NotTravel: ['vacationunionorderlist', 'flightorderlist', 'hotelorderlist', 'trainorderlist', 'carunionorderlist', 'hhtravelorderlist', 'busorderlist', 'insureorderlist', 'localeventorderlist', 'ticketsorderlist', 'cruiseorderlist', 'selftravelorderlist', 'sceneryhotelorderlist', 'tuantravelorderlist', 'allorders', 'unpaidorderlist', 'unuseorderlist', 'uncommentorderlist'],
                            AwaitPay: ['vacationunionorderlist', 'travelticketorderlist', 'tuanorderlist', 'trainorderlist', 'busorderlist', 'allorders', 'unpaidorderlist', 'unuseorderlist', 'uncommentorderlist', 'globalbuyorderlist'],
                            AwaitReview: ['hotelorderlist', 'carunionorderlist', 'tuantravelorderlist', 'ticketsorderlist', 'localeventorderlist', 'allorders', 'unpaidorderlist', 'unuseorderlist', 'uncommentorderlist']
                        };
                    }
                    if (mappings['NotTravel'].indexOf(viewType) > -1) {
                        param['NotTravel'] = true;
                    }
                    if (mappings['AwaitPay'].indexOf(viewType) > -1) {
                        param['AwaitPay'] = true;
                    }
                    if (mappings['AwaitReview'].indexOf(viewType) > -1) {
                        param['AwaitReview'] = true;
                    }
                    return param;
                }
            });
            return View;
        }
    }
    return CommonListFactory;
});
