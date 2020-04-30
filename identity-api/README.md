# Introduction
This project is created using [koa](https://koajs.com/)

# Usage
* clone the project:
* Install packages: `npm install`
  
# Setup
`private.pem`: The RS256 private key used for signing JWT(Ask around if you don't have it)

## Set up for development
* Set up environment file `.env.dev` at project root, with the following details
  * `NODE_ENV=development`
  * `DB_HOST=localhost`
  * `DB_USER=root`
  * `DB_PASSWORD=<your password>`
  * `DB_NAME=identity`
  * `COOKIE_SECRET=mysecretcookie`
  * `ACCESS_TOKEN_SECRET=mysecretaccess`
  * `ACCESS_TOKEN_LIFETIME=1d`
  * `REFRESH_TOKEN_SECRET=mysecretrefresh`
  * `REFRESH_TOKEN_LIFETIME=14`
  * `GOOGLE_CLIENT_ID=593036411636-ean03umsbrbdod1iol5r5fv0l6usknqi.apps.googleusercontent.com`
  * `GOOGLE_CLIENT_SECRET=FIhionNOzl8ORbCT6ivUvw6a`
  * `REDIRECT_URL=http://localhost:8080`
  * `PRIVATE_KEY=<ask someone for it>`
  * `MAILGUN_API=<ask someone for it>`
  * `MAILGUN_DOMAIN=<ask someone for it>`

## Set up for test
* Set up environment file `.env.test` at project root, with the following details
  * `NODE_ENV=test`
  * `DB_HOST=localhost`
  * `DB_USER=root`
  * `DB_PASSWORD=<your password>`
  * `DB_NAME=identity_test`
  * `COOKIE_SECRET=mysecretcookie`
  * `ACCESS_TOKEN_SECRET=mysecretaccess`
  * `ACCESS_TOKEN_LIFETIME=1d`
  * `REFRESH_TOKEN_SECRET=mysecretrefresh`
  * `REFRESH_TOKEN_LIFETIME=14`
  * `GOOGLE_CLIENT_ID=593036411636-ean03umsbrbdod1iol5r5fv0l6usknqi.apps.googleusercontent.com`
  * `GOOGLE_CLIENT_SECRET=FIhionNOzl8ORbCT6ivUvw6a`
  * `REDIRECT_URL=http://localhost:8080`
  * `PRIVATE_KEY=<ask someone for it>`
  * `MAILGUN_API=<ask someone for it>`
  * `MAILGUN_DOMAIN=<ask someone for it>`

## Create database schema and tables
Refer to `db/scripts` for instructions

## Setup docker and docker-compose
* [docker setup](https://docs.docker.com/install/)
* [docker-compose setup](https://docs.docker.com/compose/install/)

## Create folder to store database data
* Create a `data` folder in `db` folder to store database data
* This `data` folder will be bind mounted onto the database container
* To reinitialise the database, delete the `data` folder and run project with `docker-compose`

# Running the project
**Run in development mode**
* Start: `docker-compose up -d`
* Navigate to `localhost:3001`
* Stop: `docker-compose down`

**Run in production mode**
* Start: `npm run compose-prod-up`
* Navigate to `localhost:3000`
* Stop: `npm run compose-prod-down`

**Run tests**
* Integration test: `npm run test-integration`
* All tests: `npm run test`

