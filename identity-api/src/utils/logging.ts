import bunyan = require('bunyan');
import cloneDeep = require('lodash.clonedeep');

export const logger = bunyan.createLogger({
  name: 'Identity service',
  serializers: bunyan.stdSerializers,
});

export const requestLoggerOpts = {
  updateLogFields: (ctx) => {
    // Deep clone ctx because this method mutates ctx
    const clonedCtx = cloneDeep(ctx);

    if (clonedCtx.res) {
      // Do not log request headers
      delete clonedCtx.req.headers;
      // Do not log response headers
      delete clonedCtx.res;
    }
    return clonedCtx;
  },
};
