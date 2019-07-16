const app = require('./app')
const es = require('./services/elasticsearch');
es.connect();

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log(`Elasticsearch context is running on port ${port}`)
})
