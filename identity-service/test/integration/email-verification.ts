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

describe('Email verification integration tests', () => {
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
   * Send email verification
   */
  it('Should send email verification', done => {
    request(server)
      .post('/auth/email-verification')
      .send({ email: user.email, firstName: user.firstName })
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.body.message).to.not.equal(undefined)

        done()
      })
  })

  it('Should resend email verification if email account with email exist', done => {
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
          .post('/auth/email-verification')
          .send({ email: user.email, firstName: user.firstName, isResend: true })
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200)
            expect(res.body.message).to.not.equal(undefined)

            done()
          })
      })
  })

  it('Should not resend email verification if email account with email does not exist', done => {
    request(server)
      .post('/auth/email-verification')
      .send({ email: user.email, firstName: user.firstName, isResend: true })
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(404)
        expect(res.error).to.not.equal(undefined)
        done()
      })
  })

  /**
   * Verify user's email account
   */
  it('should set user as verified', done => {
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
          .patch('/verification')
          .send({ email: user.email })
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200)
            expect(res.body.message).to.not.equal(undefined)

            db.query(db.QUERIES.findUserProfileByEmail, [user.email])
              .then(result => {
                const [rows] = result
                expect(rows.length).to.equal(1);
                expect(rows[0].is_email_verified).to.equal(1);
                expect(rows[0].email_verified_date).to.not.equal(undefined);

                done()
              })
              .catch(done)
          })
      })
  })
})
