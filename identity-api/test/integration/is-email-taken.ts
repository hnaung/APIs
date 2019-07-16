/* eslint-disable object-property-newline, no-unused-expressions */
require('dotenv').config({ path: '.env.test' })

import { expect } from 'chai';
import request = require('supertest');
import sinon = require('sinon');
import uuid = require('uuid');

import * as db from '../../src/db';
import app from '../../src/app';
import { port } from '../config';
import { VALIDATORS } from '../../src/constants';

db.connect()
let server
const mockData = require('../mock-data')

describe('Is email taken integration tests', () => {
  let user

  /**
   * Set up and tear down
   */
  beforeEach(done => {
    server = app.listen(port, () => {
      done()
    })
  })

  beforeEach(() => {
    user = mockData.getUser()
  })

  afterEach(done => {
    db.query('DELETE FROM UserAccess').then(() => {
      server.close(() => {
        done()
      })
    })
  })

  it('should return true if email account with email exists', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.body).to.have.property('accessToken')

        request(server)
          .get('/is-email-taken')
          .query({ email: user.email })
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200)
            expect(res.body).to.equal(true);
            done()
          })
      })
  })

  it('should return false if email account with email does not exist', done => {
    request(server)
      .get('/is-email-taken')
      .query({ email: user.email })
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.body).to.equal(false);
        done()
      })
  })
})
