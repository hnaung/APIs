const { Client } = require('@elastic/elasticsearch');

let client;

// See: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html

exports.connect = () => {
  client = new Client({
    node: `${process.env.ES_HOST}`,
    headers: { 'Content-Type': 'application/json' },
    maxRetries: 5,
    requestTimeout: 1000,
    suggestCompression: true,
    compression: 'gzip',
  });
};

exports.getClient = () => client;
