define(['cUtilCommon', 'MyCtripModel'], function(cUtilCommon, MyCtripModel) {
	return {
		/**
		 * 初始化操作，把HTML插入到页面中
		 */
		append: function(view, orderTypes) {
    		var self = this,
		        html = '',
		        orderType = null;

		    html = '<div class="cui-layer" style="display: none;"><div class="dropdown-group-modal"><div class="dropdown-group-bd"><div class="ordercenter-list"><span class="close">×</span><ul class="cui-select-view">';
		    for (var i = 0, len = orderTypes.length; i < len; i++) {
		        orderType = orderTypes[i];
		        html += '<li class="' + orderType.classname + '" data-biztype="' + orderType.biztype + '" data-href="' + orderType.url + '">' + orderType.name + '<span></span></li>';
		    }
		    html += '</ul></div></div></div></div>';
		    view.$el.prepend(html);
		    view.$el.find('.ordercenter-list .close').on('click', function (e) {
		        self.hide(view);
		    });
		    view.$el.find('.cui-select-view li').on('click', function (e) {
		        var element = $(e.currentTarget),
		            url = element.data('href'),
		            title = element.html(),
		            result = /(.*)\<(\w+)\>.*\<\/\2\>/.exec(title);
		        if (result) {
		            title = result[1];
		        }
		        self.hide(view);
		        Lizard.jump(Lizard.appBaseUrl + url);
		    });
		},

		/**
		 * 显示订单选择弹层
		 */
		show: function(view, e, OrderNumbersModel) {
			var container = view.$el.find('.cui-layer');
	        if (container.css('display') === 'none') {
	            container.css({
	            	left: 0,
	            	top: '50px',
	            	display: 'block'
	            });
	            this._loadData(view, OrderNumbersModel);
	        } else {
	        	this.hide(view);
	        }
		},

		/**
		 * 隐藏订单选择弹层
		 */
		hide: function(view) {
			view.$el.find('.cui-layer').hide();
		},

		/**
		 * 加载各订单数量数据，首次点击时加载
		 */
		_loadData: function(view, OrderNumbersModel) {			
	        if (!view.bLoadedOrdersCount) {
	        	view.bLoadedOrdersCount = true;
	            OrderNumbersModel.excute(function (data) {
	                if (data && data.ResponseStatus && data.ResponseStatus.Ack === 'Success') {
	                    var orderNumbersObj = {},
	                        orderNumbers = data.OrderNumbers,
	                        orderNumber = null,
	                        elements = view.$el.find('.cui-select-view li'),
	                        biztype = '',
	                        count = '';
	                    if (orderNumbers && orderNumbers.length > 0) {
	                        for (var i = 0, len = orderNumbers.length; i < len; i++) {
	                            orderNumber = orderNumbers[i];
	                            if (orderNumber.BizType && parseInt(orderNumber.OrderNum, 10) > 0) {
	                                count = orderNumber.OrderNum;
	                                biztype = orderNumber.BizType;
	                                if (biztype.indexOf('Train') === 0) {
	                                    orderNumbersObj['Train'] = orderNumbersObj['Train'] ? orderNumbersObj['Train'] + count : count;
	                                } else {
	                                    orderNumbersObj[biztype] = count;
	                                }
	                            }
	                        }
	                        elements.each(function(index, element) {
	                            biztype = $(this).data('biztype');
	                            if (orderNumbersObj.hasOwnProperty(biztype)) {
	                                $(this).find('span').eq(0).html('（' + orderNumbersObj[biztype] + '）')
	                            }
	                        });
	                    }
	                }
	            }, null, true, view, null);
	        }
		}
	}
});