const Koa = require('koa')
const app = new Koa()
const cors = require('@koa/cors')
const koaBunyanLogger = require('koa-bunyan-logger')

const routes = require('./routes')
const middlewares = require('./middlewares')
const { requestLoggerOpts, logger } = require('./utils/logging')

app.keys = [process.env.COOKIE_SECRET]
app.use(
  cors({
    credentials: true,
  })
)

app.use(middlewares.catchAndPropagateError)
if (process.env.NODE_ENV !== 'test') {
  // bunyan logger
  app.use(koaBunyanLogger(logger))
  app.use(koaBunyanLogger.requestIdContext())
  app.use(koaBunyanLogger.requestLogger(requestLoggerOpts))
}

app.use(routes.routes())

app.use(middlewares.notFound)

// app level error handler
app.on('error', (err, ctx) => {
  if (process.env.NODE_ENV != 'test') {
    if (err.status >= 500) {
      ctx.log.error(err.message)
    } else if (err.status >= 400) {
      ctx.log.warn(err.message)
    }
  }
})

module.exports = app
