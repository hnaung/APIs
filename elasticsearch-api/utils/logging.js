const bunyan = require('bunyan');
const cloneDeep = require('lodash.clonedeep');

exports.logger = bunyan.createLogger({
  name: 'Elasticsearch context service',
  serializers: bunyan.stdSerializers,
});

// Disable logging in test mode
if (process.env.NODE_ENV === 'test') {
  exports.logger.level(bunyan.FATAL + 1);
}

exports.requestLoggerOpts = {
  updateLogFields: (ctx) => {
    // Deep clone ctx because this method mutates ctx
    const clonedCtx = cloneDeep(ctx);
    // Do not log request headers
    clonedCtx.req.headers = null;

    if (clonedCtx.res) {
      // Do not log response headers
      const headers = clonedCtx.res.getHeaders();
      delete clonedCtx.res;
      clonedCtx['res.content-length'] = headers['content-length'];
    }
    return clonedCtx;
  },
  updateResponseLogFields: (ctx, err) => {
    // return console.log(ctx.res.headers)
  },
};
