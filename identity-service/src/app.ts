import * as Koa from "koa"
const app = new Koa()
import bodyParser = require("koa-bodyparser");
const cors = require('@koa/cors')
import koaBunyanLogger = require('koa-bunyan-logger');

import routes from './routes';
import * as middlewares from './middlewares';
import { requestLoggerOpts, logger } from './utils/logging';

app.keys = [process.env.COOKIE_SECRET]

app.use(middlewares.catchAndPropagateError)
if (process.env.NODE_ENV !== 'test') {
  // bunyan logger
  app.use(koaBunyanLogger(logger))
  app.use(koaBunyanLogger.requestIdContext())
  app.use(koaBunyanLogger.requestLogger(requestLoggerOpts))
}

const validOrigins = ['https://identity-webapp.dev.thegourmetplus.net', process.env.REDIRECT_URL];
const verifyOrigin = (ctx) => {
  const { origin } = ctx.request.header;
  if (validOrigins.indexOf(origin) === -1) {
    return ctx.throw(`${origin} is not a valid origin`);
  }
  return origin
}

app.use(
  cors({
    credentials: true,
    origin: verifyOrigin
  })
)

app.use(bodyParser())

app.use(routes.routes())

app.use(middlewares.notFound)

// app level error handler
app.on('error', (err, ctx) => {
  if (process.env.NODE_ENV != 'test') {
    if (ctx.status >= 500) {
      ctx.log.error(err.message)
    } else if (err.status >= 400) {
      ctx.log.warn(err.message)
    }
  }
})

export default app
