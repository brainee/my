(function() {
   var isOnline = !Lizard.isHybrid && $(window).width() > 767 && location.search.indexOf('for=test') > -1;
    /**
     * 根据当前环境加载不同的module
     */
    window.loadModule = function(model, env) {
        if (env) {
            if (env === 'online' && isOnline) {
                return model + '_online';
            } else if (env === 'h5') {
                return model + '_h5';
            } else {
                return '';
            }
        } else {
            return model + (isOnline ? '_online' : '_h5');
        }
    }
    //根据当前环境引入不同的文件
    if (!Lizard.isHybrid && location.search.indexOf('debug=1') === -1) {
        require(["/webapp/myctrip/dest/webresource/" + (isOnline ? 'onlineconfig.js' : 'h5config.js')]);
    }
})();

define(['http://webresource.c-ctrip.com/ResCRMOnline/R5/basewidget/main.js'], function () {
    
    var baseUrl = Lizard.appBaseUrl + 'webresource/';
    var isDebug = typeof location != 'undefined' && location.search.indexOf('debug=1') != -1;
    var config = {
        paths: {
            myctripCommon: baseUrl + 'common/myctrip.common',
            indexCommon: baseUrl + 'common/index.common',
            MyCtripModel: baseUrl + 'models/myctripmodel',
            MyCtripStore: baseUrl + 'models/myctripstore',
            cardloader: baseUrl + 'views/orders/cards/cardloader',
            basecard: baseUrl + 'views/orders/cards/basecard',
            activitycard: baseUrl + 'views/orders/cards/activitycard',
            airbuscard: baseUrl + 'views/orders/cards/airbuscard',
            carcard: baseUrl + 'views/orders/cards/carcard',
            cruisecard: baseUrl + 'views/orders/cards/cruisecard',
            diycard: baseUrl + 'views/orders/cards/diycard',
            flightcard: baseUrl + 'views/orders/cards/flightcard',
            globalbuycard: baseUrl + 'views/orders/cards/globalbuycard',
            golfcard: baseUrl + 'views/orders/cards/golfcard',
            hhtravelcard: baseUrl + 'views/orders/cards/hhtravelcard',
            hotelcard: baseUrl + 'views/orders/cards/hotelcard',
            insurecard: baseUrl + 'views/orders/cards/insurecard',
            sceneryhotelcard: baseUrl + 'views/orders/cards/sceneryhotelcard',
            lipincard: baseUrl + 'views/orders/cards/lipincard',
            mallcard: baseUrl + 'views/orders/cards/mallcard',
            piaocard: baseUrl + 'views/orders/cards/piaocard',
            qichecard: baseUrl + 'views/orders/cards/qichecard',
            taxicard: baseUrl + 'views/orders/cards/taxicard',
            topshopcard: baseUrl + 'views/orders/cards/topshopcard',
            traincard: baseUrl + 'views/orders/cards/traincard',
            tuancard: baseUrl + 'views/orders/cards/tuancard',
            vacationcard: baseUrl + 'views/orders/cards/vacationcard',
            visacard: baseUrl + 'views/orders/cards/visacard',
            depositcard: baseUrl + 'views/orders/cards/depositcard',
            dnrcard: baseUrl + 'views/orders/cards/dnrcard',
            commonlist: baseUrl + 'views/orders/commonlist',
            template: baseUrl + 'views/orders/cards/template.html',
            indexTpl_online: baseUrl + 'views/indexTpl_online.html',
            orderTypes_h5: baseUrl + 'components/h5/ordertypes',
            orderTypes_online: baseUrl + 'components/online/ordertypes',
            pagination_online: baseUrl + 'components/online/pagination'
        }
    };

    if (isDebug) {
        config.urlArgs = Date.now();
    }

    require.config(config);
})
