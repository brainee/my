var config = {
    webresourceSrc: "webresource",
    buConfig: "config.js",
    isSimple: false,
    jshint: true,
    channel: "myctrip",
    hybridChannel: "myctrip",
    pageTitle: "携程旅行-我的携程-m.ctrip.com",
    zip: "dest",
    buEnv: "uat",
    host: "172.16.163.129",
    defaultView: 'myctrip/index',
    modules: [
        {
          // 共用的扔到这里面来
          name: 'config',
          include: [
            'indexCommon',
            'myctripCommon',
            'MyCtripModel',
            'MyCtripStore',
            'cardloader',
            'basecard',
            'activitycard',
            'airbuscard',
            'carcard',
            'cruisecard',
            'diycard',
            'flightcard',
            'globalbuycard',
            'golfcard',
            'hhtravelcard',
            'hotelcard',
            'insurecard',
            'sceneryhotelcard',
            'lipincard',
            'mallcard',
            'piaocard',
            'qichecard',
            'taxicard',
            'topshopcard',
            'traincard',
            'tuancard',
            'vacationcard',
            'visacard',
            'depositcard',
            'dnrcard',
            'commonlist',
            'text!template'
          ]
        },
        {
          name: 'onlineconfig',
          create: true,
          include: [
            'orderTypes_online',
            'pagination_online'
          ]
        },
        {
          name: 'h5config',
          create: true,
          include: [
            'orderTypes_h5'
          ]
        }
    ],
    viewsExclude: [

    ],
    jsExclude: [
        "views/pc_index.js",
        "views/onlineconfig.js",
    ],
    resourceExclude: [
        "http://pic.c-ctrip.com/h5/"
    ],
    replace: {
        web: [
            {
                filter: 'views/**/*',
                replace: [
                    {
                        match: /Lizard\.WebresourcePDBaseUrl\s*\+\s*['"]([^'"]+)['"]/g,
                        replacement: '"/webapp/myctrip/dest/webresource/$1"'
                    }
                ]
            }
        ],
        hybrid: [{
            filter: 'webresource/config.js',
            replace: [
                {
                    match: 'http://webresource.c-ctrip.com/ResCRMOnline/R5/basewidget/main.js',
                    replacement: '../../basewidget/main.js'
                }
            ]
        }]
    }
};

module.exports = config;