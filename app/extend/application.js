'use strict';

const EurekaClient = require('../eureka-client');

module.exports = {

    get eureka() {
        this.__eureka = this.__eureka || new EurekaClient(this.config.msEureka, this.logger);
        return this.__eureka;
    },

    // 调用微服务接口
    async feign(biz) {
        try {
            const appName = biz.method.split('.')[1];
            const instance = await this.eureka.getInstance(appName);
            const axios = require('axios').create({ headers: { Accept: 'application/x-www-form-urlencoded' }, timeout: 10000, proxy: this.eureka.config.eureka.proxy });
            this.logger.info(`FeignReq ${JSON.stringify(biz)}`);
            const { data } = await axios.post(`http://${instance.ipAddr}:${instance.port}/internal`, `biz=${JSON.stringify(biz)}`);
            this.logger.info(`FeignRes ${JSON.stringify(data)}`);
            if (data.errno !== '00000') {
                throw { code: data.errno, msg: data.error, instance };
            }
            return data;
        } catch (e) {
            throw { code: 'FEIGN_ERROR', msg: e.message };
        }
    },

};
