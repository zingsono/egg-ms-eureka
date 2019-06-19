# egg-ms-eureka

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-ms-eureka.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-ms-eureka
[travis-image]: https://img.shields.io/travis/eggjs/egg-ms-eureka.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-ms-eureka
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-ms-eureka.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-ms-eureka?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-ms-eureka.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-ms-eureka
[snyk-image]: https://snyk.io/test/npm/egg-ms-eureka/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-ms-eureka
[download-image]: https://img.shields.io/npm/dm/egg-ms-eureka.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-ms-eureka

<!--
Description here.
-->

## Install

```bash
$ npm i egg-ms-eureka --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.msEureka = {
  enable: true,
  package: 'egg-ms-eureka',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
exports.msEureka = {
    eureka: {
        serviceUrl: [ 'http://192.168.200.111:8761', 'http://192.168.200.112:8761' ],
        registerWithEureka: false,
        fetchRegistry: true,
        inspectIntervalInSecs: 30 * 1000,
        proxy: { host: '111.152.57.29', port: 39083 }, // eureka和服务不在一个网络，可以使用代理
    },
    instance: {
        app: ulmp,
        ipAddr: '192.168.0.1',
        port: 7004,
    },
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

<!-- example here -->

## Questions & Suggestions

Please open an issue [here](https://github.com/zingsono/egg-ms-eureka/issues).

## License

[MIT](LICENSE)
