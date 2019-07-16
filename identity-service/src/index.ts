require('dotenv').config({ path: '.env.dev' })
const db = require('./db')
import app from './app';

const port = process.env.PORT || 3001

db.connect();

app.listen(port, () => {
  console.log(`Koa is running on port ${port}`)
})
