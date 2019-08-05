'use strict';
const Axios = require('axios');
const uuid = () => (require('uuid/v1')().split('-').join(''));
const moment = require('moment');
const EurekaClient = require('../eureka-client');

module.exports = {

    get eureka() {
        this.__eureka = this.__eureka || new EurekaClient(this.config.msEureka, this.logger);
        return this.__eureka;
    },

    /**
     * 调用微服务接口
     * @param biz 报文对象
     * @return {Promise<T>}  响应报文对象
     */
    async feign(biz = { requestId: uuid(), submitTime: moment().format('yyyyMMddHHmmss') }) {
        try {
            const appName = biz.method.split('.')[1];
            const instance = await this.eureka.getInstance(appName);
            const axios = Axios.create({ headers: { Accept: 'application/x-www-form-urlencoded' }, timeout: 10 * 1000, proxy: this.eureka.config.eureka.proxy });
            this.logger.info(`'${biz.requestId}'FeignReq: ${JSON.stringify(biz)}`);
            const { data } = await axios.post(`http://${instance.ipAddr}:${instance.port}/internal`, `biz=${JSON.stringify(biz)}`);
            this.logger.info(`'${biz.requestId}'FeignRes: ${JSON.stringify(data)}`);
            if (!data || !data.errno) {
                throw new Error(`服务【${appName}】响应报文无法解析`);
            }
            if (data.errno !== '00000') {
                throw { code: data.errno, msg: data.error, instance };
            }
            return data;
        } catch (e) {
            if (e.code) {
                throw e;
            }
            this.logger.error(e);
            throw { code: 'FEIGN_ERROR', msg: e.message };
        }
    },

};
