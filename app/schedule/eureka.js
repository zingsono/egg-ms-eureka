'use strict';

module.exports = app => {
    const { registerWithEureka, inspectIntervalInSecs } = app.config.msEureka.eureka;
    return {
        disable: !registerWithEureka,
        schedule: {
            interval: inspectIntervalInSecs,
            type: 'worker',
        },
        async task(ctx) {
            await ctx.app.eureka.heartbeat();
        },
    };
};
