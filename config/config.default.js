'use strict';

const ip = require('ip');

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    // @type {Egg.EggAppConfig}
    const config = exports = { };

    // Eureka 注册中心
    config.msEureka = {
        eureka: {
            serviceUrl: [ 'http://eureka.sc1:8761', 'http://eureka.sc2:8761' ],
            registerWithEureka: true,
            fetchRegistry: true,
            inspectIntervalInSecs: 30 * 1000,
        },
        /* instance: {
            app: config.name,
            ipAddr: ip.address(),
            port: 80,
        },*/
    };

    return config;
};
