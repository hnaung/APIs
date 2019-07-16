/* eslint-disable object-property-newline, no-unused-expressions */
require('dotenv').config({ path: '.env.test' })

import { expect } from 'chai';
import request = require('supertest');

import * as db from '../../src/db';
import app from '../../src/app';
import { port } from '../config';

let server
db.connect()

describe('============== Integration tests ===========\nBasic routes test', () => {
  /**
   * Set up and tear down
   */
  beforeEach(done => {
    server = app.listen(port, () => {
      done()
    })
  })

  afterEach(done => {
    server.close(() => {
      done()
    })
  })

  it('should return health check status at /health', done => {
    request(server)
      .get('/health')
      .end((err, res) => {
        if (err) throw err
        expect(res.body.status).to.include('identity service is up and running')
        done()
      })
  })

  it('should return 404 for unknown routes', done => {
    request(server)
      .get('/unknown')
      .expect(404, '/unknown is not found', done)
  })
})
