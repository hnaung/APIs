/* eslint-disable object-property-newline, no-unused-expressions */
require('dotenv').config({ path: '.env.test' })

import { expect } from 'chai';
import request = require('supertest');
import sinon = require('sinon');
import uuid = require('uuid');

import * as db from '../../src/db';
import app from '../../src/app';
import { port } from '../config';

// import { CustomError } from '../../src/controllers/interface';

db.connect()
let server
const mockData = require('../mock-data')

describe('Facebook auth routes tests', () => {
  /**
   * Set up and tear down
   */
  before(() => {
    sinon.stub(uuid, 'v4').returns(mockData.getUuid())
  })

  beforeEach(done => {
    server = app.listen(port, () => {
      done()
    })
  })

  afterEach(done => {
    db.query('DELETE FROM UserAccess').then(() => {
      server.close(() => {
        done()
      })
    })
  })

  after(() => {
    sinon.restore()
  })

  /**
   * helper function to assert values on FacebookAccount table
   */

  /**
   * Ensure that the appropriate (web/mobile) token is inserted according to isMobile
   * @param {} rows from db query
   * @param {bool} isMobile
   */
  function expectFacebookAccountRows(rows, user, isMobile = false) {
    expect(rows.length).to.equal(1)
    if (!isMobile) {
      expect(rows[0].web_long_lived_token).to.equal(user.accessToken)
      expect(rows[0].mobile_long_lived_token).to.equal(null)
    } else {
      expect(rows[0].mobile_long_lived_token).to.equal(user.accessToken)
      expect(rows[0].web_long_lived_token).to.equal(null)
    }
  }

  function expectResponseSuccess(res, user) {
    expect(res.body.accessToken).to.not.equal(undefined);
    expect(res.status).to.equal(200)
    expect(res.headers['set-cookie']).to.not.equal(undefined)
    expect(res.headers['set-cookie'].length).to.above(0)
  }

  function expectResponseFailure(res) {
    expect(res.status).to.equal(500)
    expect(res.headers['set-cookie']).to.equal(undefined)
  }

  /**
   * Web tests
   */
  describe('Web tests', () => {
    it('should sign in with facebook, set cookie and set web_long_lived_token only', done => {
      const user = mockData.getFacebookWebUser()

      request(server)
        .post('/auth/facebook')
        .send(user)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          expectResponseSuccess(res, user)
          expect(res.body.isNewUser).to.equal(true)

          db.query(db.QUERIES.findFacebookAccountById, [user.id]).then(result => {
            const [queryFacebookAccountRows] = result
            expectFacebookAccountRows(queryFacebookAccountRows, user)

            done()
          })
        })
    })

    it('should log in if facebook user is already registered, set cookie and overwrite web_long_lived_token only', done => {
      const user = mockData.getFacebookWebUser()

      request(server)
        .post('/auth/facebook')
        .send(user)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          expectResponseSuccess(res, user)
          expect(res.body.isNewUser).to.equal(true)

          db.query(db.QUERIES.findFacebookAccountById, [user.id])
            .then(result => {
              const [queryFacebookAccountRows] = result
              expectFacebookAccountRows(queryFacebookAccountRows, user)

              return queryFacebookAccountRows
            })
            .then(prevQueryRows => {
              const userSecond = mockData.getFacebookWebUser()

              request(server)
                .post('/auth/facebook')
                .send(userSecond)
                .end((err, res) => {
                  if (err) {
                    return done(err)
                  }
                  expectResponseSuccess(res, user)
                  expect(res.body.isNewUser).to.equal(undefined)

                  db.query(db.QUERIES.findFacebookAccountById, [userSecond.id]).then(result => {
                    const [rows] = result
                    expectFacebookAccountRows(rows, userSecond)
                    expect(prevQueryRows[0].web_long_lived_token).to.not.equal(
                      rows[0].web_long_lived_token
                    )

                    done()
                  })
                })
            })
        })
    })

    describe('Test for group of 3 operations in a transaction', () => {
      const dbError = new Error('Transaction error');

      it('should not create row in UserAccess table if inserting row in UserAccess(1st operation) table fails', done => {
        const user = mockData.getFacebookWebUser()
        const queryStub = sinon.stub(db, 'query')
        queryStub.withArgs(db.QUERIES.insertUserAccess, sinon.match.any).rejects(dbError)

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseFailure(res)

            queryStub.restore()

            db.query(db.QUERIES.findUserAccessById, [mockData.getUuid()]).then(result => {
              const [queryUserAccessRows] = result
              expect(queryUserAccessRows.length).to.equal(0)
              done()
            })
          })
      })

      it('should not create row in UserAccess and FacebookAccount table if inserting row in FacebookAccount(2nd operation) table fails', done => {
        const user = mockData.getFacebookWebUser()
        const queryStub = sinon.stub(db, 'query')
        queryStub.withArgs(db.QUERIES.insertFacebookAccount, sinon.match.any).rejects(dbError)

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseFailure(res)

            queryStub.restore()

            const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
              mockData.getUuid(),
            ])
            const queryFacebookAccountPromise = db.query(db.QUERIES.findFacebookAccountById, [
              user.id,
            ])

            Promise.all([queryUserAccessPromise, queryFacebookAccountPromise])
              .then(result => {
                const [[queryUserAccessRows], [queryFacebookAccountRows]] = result
                expect(queryUserAccessRows.length).to.equal(0)
                expect(queryFacebookAccountRows.length).to.equal(0)
                done()
              })
              .catch(done)
          })
      })

      it('should not create row in UserAccess, FacebookAccount and UserProfile table if inserting row in UserProfile(3rd operation) table fails', done => {
        const user = mockData.getFacebookWebUser()
        const queryStub = sinon.stub(db, 'query')
        queryStub.withArgs(db.QUERIES.insertUserProfile, sinon.match.any).rejects(dbError)

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseFailure(res)

            queryStub.restore()

            const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
              mockData.getUuid(),
            ])
            const queryFacebookAccountPromise = db.query(db.QUERIES.findFacebookAccountById, [
              user.id,
            ])
            const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
              mockData.getUuid(),
            ])

            Promise.all([
              queryUserAccessPromise,
              queryFacebookAccountPromise,
              queryUserProfilePromise,
            ])
              .then(result => {
                const [
                  [queryUserAccessRows],
                  [queryFacebookAccountRows],
                  [queryUserProfileRows],
                ] = result
                expect(queryUserAccessRows.length).to.equal(0)
                expect(queryFacebookAccountRows.length).to.equal(0)
                expect(queryUserProfileRows.length).to.equal(0)
                done()
              })
              .catch(done)
          })
      })

      it('should create row in UserAccess, FacebookAccount and UserProfile table if all operations succeed', done => {
        const user = mockData.getFacebookWebUser()

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseSuccess(res, user)
            expect(res.body.isNewUser).to.equal(true)

            const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
              mockData.getUuid(),
            ])
            const queryFacebookAccountPromise = db.query(db.QUERIES.findFacebookAccountById, [
              user.id,
            ])
            const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
              mockData.getUuid(),
            ])

            Promise.all([
              queryUserAccessPromise,
              queryFacebookAccountPromise,
              queryUserProfilePromise,
            ])
              .then(result => {
                const [
                  [queryUserAccessRows],
                  [queryFacebookAccountRows],
                  [queryUserProfileRows],
                ] = result
                expect(queryUserAccessRows.length).to.equal(1)
                expect(queryFacebookAccountRows.length).to.equal(1)
                expect(queryUserProfileRows.length).to.equal(1)
                expectFacebookAccountRows(queryFacebookAccountRows, user)
                done()
              })
              .catch(done)
          })
      })
    })
  })

  // Mobile tests
  describe('Mobile tests', () => {
    it('should sign in with facebook, set cookie and set mobile_long_lived_token only', done => {
      const user = mockData.getFacebookMobileUser()

      request(server)
        .post('/auth/facebook')
        .send(user)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          expectResponseSuccess(res, user)
          expect(res.body.isNewUser).to.equal(true)

          db.query(db.QUERIES.findFacebookAccountById, [user.id]).then(result => {
            const [queryFacebookAccountRows] = result
            expectFacebookAccountRows(queryFacebookAccountRows, user, true)

            done()
          })
        })
    })

    it('should log in if facebook user is already registered, set cookie and overwrite mobile_long_lived_token only', done => {
      const user = mockData.getFacebookMobileUser()

      request(server)
        .post('/auth/facebook')
        .send(user)
        .end((err, res) => {
          if (err) {
            return done(err)
          }
          expectResponseSuccess(res, user)
          expect(res.body.isNewUser).to.equal(true)

          db.query(db.QUERIES.findFacebookAccountById, [user.id])
            .then(result => {
              const [queryFacebookAccountRows] = result
              expectFacebookAccountRows(queryFacebookAccountRows, user, true)

              return queryFacebookAccountRows
            })
            .then(prevQueryRows => {
              const userSecond = mockData.getFacebookMobileUser()

              request(server)
                .post('/auth/facebook')
                .send(userSecond)
                .end((err, res) => {
                  if (err) {
                    return done(err)
                  }
                  expectResponseSuccess(res, user)
                  expect(res.body.isNewUser).to.equal(undefined)

                  db.query(db.QUERIES.findFacebookAccountById, [userSecond.id]).then(result => {
                    const [rows] = result
                    expectFacebookAccountRows(rows, userSecond, true)
                    expect(prevQueryRows[0].mobile_long_lived_token).to.not.equal(
                      rows[0].mobile_long_lived_token
                    )

                    done()
                  })
                })
            })
        })
    })

    describe('Test for group of 3 operations in a transaction', () => {
      const dbError = new Error('Transaction error');

      it('should not create row in UserAccess table if inserting row in UserAccess(1st operation) table fails', done => {
        const user = mockData.getFacebookMobileUser()
        const queryStub = sinon.stub(db, 'query')
        queryStub.withArgs(db.QUERIES.insertUserAccess, sinon.match.any).rejects(dbError)

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseFailure(res)

            queryStub.restore()

            db.query(db.QUERIES.findUserAccessById, [mockData.getUuid()]).then(result => {
              const [queryUserAccessRows] = result
              expect(queryUserAccessRows.length).to.equal(0)
              done()
            })
          })
      })

      it('should not create row in UserAccess and FacebookAccount table if inserting row in FacebookAccount(2nd operation) table fails', done => {
        const user = mockData.getFacebookMobileUser()
        const queryStub = sinon.stub(db, 'query')
        queryStub.withArgs(db.QUERIES.insertFacebookAccount, sinon.match.any).rejects(dbError)

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseFailure(res)

            queryStub.restore()

            const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
              mockData.getUuid(),
            ])
            const queryFacebookAccountPromise = db.query(db.QUERIES.findFacebookAccountById, [
              user.id,
            ])

            Promise.all([queryUserAccessPromise, queryFacebookAccountPromise])
              .then(result => {
                const [[queryUserAccessRows], [queryFacebookAccountRows]] = result
                expect(queryUserAccessRows.length).to.equal(0)
                expect(queryFacebookAccountRows.length).to.equal(0)
                done()
              })
              .catch(done)
          })
      })

      it('should not create row in UserAccess, FacebookAccount and UserProfile table if inserting row in UserProfile(3rd operation) table fails', done => {
        const user = mockData.getFacebookMobileUser()
        const queryStub = sinon.stub(db, 'query')
        queryStub.withArgs(db.QUERIES.insertUserProfile, sinon.match.any).rejects(dbError)

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseFailure(res)

            queryStub.restore()

            const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
              mockData.getUuid(),
            ])
            const queryFacebookAccountPromise = db.query(db.QUERIES.findFacebookAccountById, [
              user.id,
            ])
            const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
              mockData.getUuid(),
            ])

            Promise.all([
              queryUserAccessPromise,
              queryFacebookAccountPromise,
              queryUserProfilePromise,
            ])
              .then(result => {
                const [
                  [queryUserAccessRows],
                  [queryFacebookAccountRows],
                  [queryUserProfileRows],
                ] = result
                expect(queryUserAccessRows.length).to.equal(0)
                expect(queryFacebookAccountRows.length).to.equal(0)
                expect(queryUserProfileRows.length).to.equal(0)
                done()
              })
              .catch(done)
          })
      })

      it('should create row in UserAccess, FacebookAccount and UserProfile table if all operations succeed', done => {
        const user = mockData.getFacebookMobileUser()

        request(server)
          .post('/auth/facebook')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expectResponseSuccess(res, user)
            expect(res.body.isNewUser).to.equal(true)

            const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
              mockData.getUuid(),
            ])
            const queryFacebookAccountPromise = db.query(db.QUERIES.findFacebookAccountById, [
              user.id,
            ])
            const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
              mockData.getUuid(),
            ])

            Promise.all([
              queryUserAccessPromise,
              queryFacebookAccountPromise,
              queryUserProfilePromise,
            ])
              .then(result => {
                const [
                  [queryUserAccessRows],
                  [queryFacebookAccountRows],
                  [queryUserProfileRows],
                ] = result
                expect(queryUserAccessRows.length).to.equal(1)
                expect(queryFacebookAccountRows.length).to.equal(1)
                expect(queryUserProfileRows.length).to.equal(1)
                expectFacebookAccountRows(queryFacebookAccountRows, user, true)
                done()
              })
              .catch(done)
          })
      })
    })
  })
})
