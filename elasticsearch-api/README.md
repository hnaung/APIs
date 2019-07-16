# Introduction
This project is created using [koa](https://koajs.com/)

# Setup
## Install required tools
* [docker setup](https://docs.docker.com/install/)
* [docker-compose setup](https://docs.docker.com/compose/install/)
* [elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/install-elasticsearch.html)


# Running the project
* Clone the project: `git clone git@gitlab.com:gourmet-plus/identity-service.git`

**Run in development mode**
* Build: `docker-compose build`
* Start: `docker-compose up -d`
* Server is available at: `localhost:4001`
* Stop: `docker-compose down`

**Run in production mode**
* Build: `npm run compose-prod-build`
* Start: `npm run compose-prod-up`
* Server is available at: `localhost:4000`
* Stop: `npm run compose-prod-down`

**Kibana**
Visit `localhost:5601` to set up kibana and connect it to elasticsearch

## Note
Ensure data is [ingested](https://gitlab.com/gourmet-plus/elasticsearch-script) into elasticsearch before using this project
