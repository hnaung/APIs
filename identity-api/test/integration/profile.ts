/* eslint-disable object-property-newline, no-unused-expressions */
require('dotenv').config({ path: '.env.test' })

import { expect } from 'chai';
import request = require('supertest');
import sinon = require('sinon');

import * as db from '../../src/db';
import app from '../../src/app';
import { port } from '../config';

db.connect()
let server
const mockData = require('../mock-data')

const sandbox = sinon.createSandbox();

describe('Profile integration tests', () => {
  let user = mockData.getUser()
  let body = {
    email: user.email,
    firstName: 'first name',
    lastName: 'last name',
    provider: db.PROVIDERS.email,
    phoneNumber: user.phoneNumber
  }

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
    sandbox.restore();

    db.query('DELETE FROM UserAccess').then(() => {
      server.close(() => {
        done()
      })
    })
  })

  /**
   * Update user profile
   */
  it('should update UserProfile and EmailAccount', done => {
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
          .patch('/profile')
          .send(body)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200);
            done();
          })
      })
  })

  it('should update UserProfile and GoogleAccount', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.body).to.have.property('accessToken')

        let mybody = {...body}
        mybody.provider = db.PROVIDERS.google;

        request(server)
          .patch('/profile')
          .send(mybody)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200);
            done();
          })
      })
  })

  it('should update UserProfile and FacebookAccount', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.body).to.have.property('accessToken')

        let mybody = {...body}
        mybody.provider = db.PROVIDERS.facebook;

        request(server)
          .patch('/profile')
          .send(mybody)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200);
            done();
          })
      })
  })

  it('should throw error if error occurred while updating UserProfile', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.body).to.have.property('accessToken')

        const cb = sandbox.stub(db, 'query');
        cb.onCall(0).throws();

        request(server)
          .patch('/profile')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err);
            }

            expect(res.status).to.equal(500);
            cb.restore();
            done()
          })
      })
  })

  describe('Update preferences tests', () => {
    it('should update cuisine preference only', done => {
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
            .patch('/preferences')
            .send({ email: user.email, preferences: { cuisines: mockData.preferences.cuisines } })
            .end((err, res) => {
              if (err) {
                return done(err)
              }

              expect(res.status).to.equal(200)
              expect(res.body).to.have.property('message')  

              db.query(`SELECT onboarding_preference FROM UserProfile WHERE display_email = '${user.email}'`)
                .then(result => {
                  const [rows] = result;
                  expect(rows.length).to.equal(1)
                  expect(JSON.parse(rows[0].onboarding_preference.cuisines)).to.eql(mockData.preferences.cuisines)
                  done();
                })
            })
        })
    })

    it('should update atmosphere preference only', done => {
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
            .patch('/preferences')
            .send({ email: user.email, preferences: { atmosphere: mockData.preferences.atmosphere } })
            .end((err, res) => {
              if (err) {
                return done(err)
              }

              expect(res.status).to.equal(200)
              expect(res.body).to.have.property('message')  

              db.query(`SELECT onboarding_preference FROM UserProfile WHERE display_email = '${user.email}'`)
                .then(result => {
                  const [rows] = result;
                  expect(rows.length).to.equal(1)
                  expect(JSON.parse(rows[0].onboarding_preference.atmosphere)).to.eql(mockData.preferences.atmosphere)
                  done();
                })
            })
        })
    })

    it('should update dietary preference only', done => {
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
            .patch('/preferences')
            .send({ email: user.email, preferences: { dietary: mockData.preferences.dietary } })
            .end((err, res) => {
              if (err) {
                return done(err)
              }

              expect(res.status).to.equal(200)
              expect(res.body).to.have.property('message')  

              db.query(`SELECT onboarding_preference FROM UserProfile WHERE display_email = '${user.email}'`)
                .then(result => {
                  const [rows] = result;
                  expect(rows.length).to.equal(1)
                  expect(JSON.parse(rows[0].onboarding_preference.dietary)).to.eql(mockData.preferences.dietary)
                  done();
                })
            })
        })
    })
  });
})
