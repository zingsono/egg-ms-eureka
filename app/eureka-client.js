'use strict';
const axios = require('axios');
const ip = require('ip');

const defaultConfig = {
    eureka: {
        serviceUrl: [ 'http://127.0.0.1:8761' ],
        servicePath: '/eureka/apps',
        registerWithEureka: false, // 注册到Eureka服务
        fetchRegistry: true, // 抓取注册表信息
        inspectIntervalInSecs: 30 * 1000, // 实例更新检查间隔秒数
        timeout: 5000,
        proxy: undefined, /* { host: '127.0.0.1',port: 9000 }*/
    },
    instance: {
        instanceId: '',
        hostName: '',
        app: '',
        ipAddr: ip.address(),
        status: 'UP',
        overriddenStatus: 'UNKNOWN',
        port: {
            $: 39805,
            '@enabled': 'true',
        },
        securePort: {
            $: 443,
            '@enabled': 'false',
        },
        countryId: 1,
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
        leaseInfo: {
            renewalIntervalInSecs: 10, // 更新间隔秒
            durationInSecs: 30,
            registrationTimestamp: 0,
            lastRenewalTimestamp: 0,
            evictionTimestamp: 0,
            serviceUpTimestamp: 0,
        },
        metadata: {
            'management.port': '8080',
        },
        homePageUrl: '',
        statusPageUrl: '/actuator/info',
        healthCheckUrl: '/actuator/health',
        vipAddress: '',
        secureVipAddress: '',
        isCoordinatingDiscoveryServer: 'false',
        lastUpdatedTimestamp: '',
        lastDirtyTimestamp: '',
    },
};

function defaultLogger(level = 'debug') {
    const logger = {
        debug(msg) {
            'debug info wran error'.indexOf(level) === -1 || console.log(`debug>>  ${msg}`);
        },
        info(msg) {
            'info wran error'.indexOf(level) === -1 || console.info(`info>>  ${msg}`);
        },
        warn(msg) {
            'wran error'.indexOf(level) === -1 || console.info(`wran>>  ${msg}`);
        },
        error(msg) {
            'error'.indexOf(level) === -1 || console.error(`error>>  ${msg}`);
        },
    };
    return logger;
}

class EurekaClient {
    constructor(ops, logger) {
        this.logger = logger || defaultLogger;
        this.applications = { }; // 服务实例缓存
        this.applicationsFetchTime = {};

        this.logger.info(`Eureka Config ops: ${JSON.stringify(ops)}`);
        if (!(ops && ops.instance)) {
            throw new TypeError('Error：*** Instance configuration does not exist');
        }
        // 设置默认参数
        const instance = ops.instance;
        if (typeof (instance.port) !== 'object') {
            instance.port = { $: instance.port, '@enabled': 'true' };
        }
        instance.app = instance.app.toLocaleUpperCase();
        instance.instanceId = instance.instanceId || `${instance.ipAddr}:${instance.port.$}`;
        instance.hostName = instance.hostName || instance.ipAddr;
        instance.metadata = { 'management.port': instance.port.$ };
        instance.homePageUrl = instance.homePageUrl || `http://${instance.ipAddr}:${instance.port.$}`;
        instance.statusPageUrl = instance.statusPageUrl || `${instance.homePageUrl}/actuator/info`;
        instance.healthCheckUrl = instance.healthCheckUrl || `${instance.homePageUrl}/actuator/health`;
        instance.vipAddress = instance.vipAddress || instance.app;
        instance.secureVipAddress = instance.secureVipAddress || instance.app;
        instance.lastUpdatedTimestamp = new Date().getTime().toString();
        instance.lastDirtyTimestamp = new Date().getTime().toString();

        // 应用配置ops覆盖默认配置
        this.config = defaultConfig;
        this.config.eureka = Object.assign(this.config.eureka, ops.eureka);
        this.config.instance = Object.assign(this.config.instance, instance);
    }

    axios() {
        const serviceUrls = this.config.eureka.serviceUrl;
        const i = Math.floor(Math.random() * serviceUrls.length + 1) - 1;
        return axios.create({
            baseURL: `${serviceUrls[i]}${this.config.eureka.servicePath}`,
            timeout: this.config.eureka.timeout,
            headers: { Accept: 'application/json' },
            proxy: this.config.eureka.proxy,
        });
    }

    // 注册新实例.  响应 http 204
    async register() {
        const { eureka, instance } = this.config;
        const app = instance.app;
        if (!eureka.registerWithEureka) {
            this.logger.info('eureka.registerWithEureka = false');
            return false;
        }

        try {
            const axiosInstance = this.axios();
            const regRes = await axiosInstance.post(`/${app}`, { instance });
            if (regRes.status === 204) {
                this.logger.info(`Eureka register success app=${app} instance=${JSON.stringify(instance)} `);
                return true;
            }
        } catch (e) {
            this.logger.error(`Eureka register error ${e.message} `);
        }
        return false;
    }

    // 查询所有应用实例  响应数据格式参考queryAll.res.json
    async queryAll() {
        const response = await this.axios().get('');
        this.logger.debug(`Eureka query all instance ${JSON.stringify(response.data)}`);
        return response.data;
    }

    // 查询应用的所有实例
    async queryByappid(app) {
        const response = await this.axios().get(`/${app}`);
        this.logger.debug(`Eureka query app instance ${JSON.stringify(response.data)}`);
        return response.data;
    }

    // 发送实例健康检查
    async heartbeat() {
        if (!this.status) {
            (await this.register()) && (this.status = 'UP');
            return true;
        }
        const app = this.config.instance.app;
        const instanceId = this.config.instance.instanceId;
        const path = `/${app}/${instanceId}`;
        let status = 0;
        try {
            const response = await this.axios().put(path, { status: 'UP', lastDirtyTimestamp: new Date().getTime() });
            this.logger.debug(`Eureka app=${app}  ${instanceId} heartbeat ...ok `);
            status = response.status;
        } catch (e) {
            this.logger.error(`Eureka app=${app}  ${instanceId} heartbeat ...fail put uri=${JSON.stringify(this.config.eureka)} path=${path}  ${e.message}`);
        }
        return status === 200;
    }

    // 删除实例
    async delete() {
        const app = this.config.instance.app;
        const instanceId = this.config.instance.instanceId;
        const response = await this.axios().delete(`/${app}/${instanceId}`);
        this.logger.debug(`Eureka ${app}  ${instanceId} delete ...ok `);
        return response.status === 200;
    }

    // 随机获取微服务实例信息
    async getInstance(name) {
        name = name.toUpperCase();
        const { eureka } = this.config;
        try {
            const cTime = new Date().getTime();
            if ((!this.applications[name]) || (this.applicationsFetchTime[name] < cTime)) {
                this.applications[name] = await this.queryByappid(name);
                this.applicationsFetchTime[name] = cTime + eureka.inspectIntervalInSecs;
            }
            const { instance } = this.applications[name].application;
            const rn = Math.floor(Math.random() * instance.length + 1) - 1;
            const { instanceId, app, ipAddr, port } = instance[rn];
            return { instanceId, app, ipAddr, port: port.$ };
        } catch (e) {
            throw new Error(`Eureka getInstance('${name}')  Error ${e.message}`);
        }
    }

    /* // 启动健康检查
    async start(callback) {
        this.timer = setInterval(() => {
            this.heartbeat();
        }, 1000);
        !callback || callback(this);
    }

    // 停止健康检查
    async stop(callback) {
        clearTimeout(this.timer);
        !callback || callback(this);
    }*/
}

module.exports = EurekaClient;

