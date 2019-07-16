/* eslint-disable object-property-newline, no-unused-expressions */
require('dotenv').config({ path: '.env.test' })

import { expect } from 'chai';
import request = require('supertest');

import * as db from '../../src/db';
import app from '../../src/app';
import { port } from '../config';

db.connect()
let server
const mockData = require('../mock-data')

describe('Login routes tests', () => {
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

  /**
   * Tests for login route
   *
   */
  it('should login successfully with the correct credentials', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res: any) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        request(server)
          .post('/login')
          .send({ email: user.email, password: user.password })
          .end((err, res: any) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200)
            expect(res.headers['set-cookie']).to.not.equal(undefined)
            expect(res.body.accessToken).to.not.equal(undefined)
            done()
          })
      })
  })

  it('should return 404 for user account that is not registered', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        request(server)
          .post('/login')
          .send({ email: 'random', password: user.password })
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(404)
            done()
          })
      })
  })

  it('should return 401 for incorrect password', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        request(server)
          .post('/login')
          .send({ email: user.email, password: 'randompassword' })
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(401)
            done()
          })
      })
  })
})
