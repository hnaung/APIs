import { ERROR_CODE } from '../constants';

export const catchAndPropagateError = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    // some errors will have .status, however this is not a guarantee
    err.devMessage = err.message;
    let message = err.message;

    ctx.status = err.status || 500;

    if (err.code === ERROR_CODE.ER_DUP_ENTRY) {
      message = 'Duplicate entry. Please ensure that you enter the proper information.';
      ctx.status = 409;
    } else if (err.type === ERROR_CODE.VALIDATION_ERROR) {
      message = message.split(',').join('\n');
    }
    ctx.body = message;

    // since we handled this manually we'll want to delegate to the regular app
    // level error handling as well so that centralized still functions correctly.
    ctx.app.emit('error', err, ctx);
  }
};

export const notFound = (ctx) => {
  ctx.throw(404, `${ctx.request.url} is not found`);
};
