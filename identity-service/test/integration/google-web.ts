/* eslint-disable object-property-newline, no-unused-expressions */
require('dotenv').config({ path: '.env.test' })

import { expect } from 'chai';
import request = require('supertest');
import sinon = require('sinon');
import uuid = require('uuid');

import * as db from '../../src/db';
import app from '../../src/app';
import { port } from '../config';
const oauthGoogle = require('../../src/utils/oauth-google')

db.connect()
let server
const mockData = require('../mock-data')

describe('Google web auth routes tests', () => {
  const tokens = {
    access_token: 'access token',
    refresh_token: 'refresh token',
  }

  const authorisationCode = 'auth code'
  const invalidAudMessage = 'Malicious app'
  const invalidIssMessage = 'Token issuer is invalid'
  const invalidExpMessage = 'ID token expired'

  /**
   * Set up and tear down
   */
  beforeEach(done => {
    server = app.listen(port, () => {
      done()
    })
  })

  beforeEach(() => {
    sinon.stub(oauthGoogle, 'getTokenFromCode').returns(tokens)
  })

  afterEach(() => {
    sinon.restore()
  })

  afterEach(done => {
    db.query('DELETE FROM UserAccess').then(() => {
      server.close(() => {
        done()
      })
    })
  })

  /**
   * Tests for google auth
   */
  it('should sign in with google with valid id token and set cookie', done => {
    sinon.stub(oauthGoogle, '_verifyIdToken').resolves(mockData.idToken.valid)

    request(server)
      .post('/auth/google-web')
      .send({ code: authorisationCode })
      .end((err, res: any) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.headers['set-cookie']).to.not.equal(undefined)
        expect(res.headers['set-cookie'].length).to.above(0)
        expect(res.body.accessToken).to.not.equal(undefined)
        expect(res.body.isNewUser).to.equal(true);
        done()
      })
  })

  it('should log in if google user is already registered with valid id token and set cookie', done => {
    sinon.stub(oauthGoogle, '_verifyIdToken').resolves(mockData.idToken.valid)

    request(server)
      .post('/auth/google-web')
      .send({ code: authorisationCode })
      .end((err, res: any) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.headers['set-cookie']).to.not.equal(undefined)
        expect(res.headers['set-cookie'].length).to.above(0)
        expect(res.body.accessToken).to.not.equal(undefined)
        expect(res.body.isNewUser).to.equal(true);

        request(server)
          .post('/auth/google-web')
          .send({ code: authorisationCode })
          .end((err, res: any) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200)
            expect(res.headers['set-cookie']).to.not.equal(undefined)
            expect(res.headers['set-cookie'].length).to.above(0)
            expect(res.body.accessToken).to.not.equal(undefined)
            expect(res.body.isNewUser).to.equal(undefined);
            done()
          })
      })
  })

  it('should reject id token with invalid aud and not set cookie', done => {
    sinon.stub(oauthGoogle, '_verifyIdToken').resolves(mockData.idToken.invalidAud)

    request(server)
      .post('/auth/google-web')
      .send({ code: authorisationCode })
      .end((err, res: any) => {
        if (res) {
          return done(err)
        }
        expect(res.text).includes(invalidAudMessage)
        expect(res.status).to.equal(403)
        expect(res.headers['set-cookie']).to.equal(undefined)
        done()
      })
  })

  it('should reject id token with invalid iss and not set cookie', done => {
    sinon.stub(oauthGoogle, '_verifyIdToken').resolves(mockData.idToken.invalidIss)

    request(server)
      .post('/auth/google-web')
      .send({ code: authorisationCode })
      .end((err, res: any) => {
        if (err) {
          return done(err)
        }
        expect(res.text).includes(invalidIssMessage)
        expect(res.status).to.equal(403)
        expect(res.headers['set-cookie']).to.equal(undefined)
        done()
      })
  })

  it('should reject id token with invalid exp and not set cookie', done => {
    sinon.stub(oauthGoogle, '_verifyIdToken').resolves(mockData.idToken.invalidExp)

    request(server)
      .post('/auth/google-web')
      .send({ code: authorisationCode })
      .end((err, res: any) => {
        if (err) {
          return done(err)
        }
        expect(res.text).includes(invalidExpMessage)
        expect(res.status).to.equal(403)
        expect(res.headers['set-cookie']).to.equal(undefined)
        done()
      })
  })

  describe('Test for group of 3 operations in a transaction', () => {
    let uuidStub;
    beforeEach(() => {
      uuidStub = sinon.stub(uuid, 'v4').returns(mockData.getUuid())
      sinon.stub(oauthGoogle, '_verifyIdToken').resolves(mockData.idToken.valid)
    })

    afterEach(() => {
      oauthGoogle._verifyIdToken.restore()
      uuidStub.restore()
    })

    const dbError = new Error('Transaction error');

    it('should not create row in UserAccess table if inserting row in UserAccess(1st operation) table fails', done => {
      const queryStub = sinon.stub(db, 'query')
      queryStub.withArgs(db.QUERIES.insertUserAccess, sinon.match.any).rejects(dbError)

      request(server)
        .post('/auth/google-web')
        .send({ code: authorisationCode })
        .end((err, res: any) => {
          if (err) {
            return done(err)
          }
          expect(res.status).to.equal(500)
          expect(res.headers['set-cookie']).to.equal(undefined)

          queryStub.restore()

          db.query(db.QUERIES.findUserAccessById, [mockData.getUuid()]).then(result => {
            const [queryUserAccessRows] = result
            expect(queryUserAccessRows.length).to.equal(0)
            done()
          })
        })
    })

    it('should not create row in UserAccess and GoogleAccount table if inserting row in GoogleAccount(2nd operation) table fails', done => {
      const queryStub = sinon.stub(db, 'query')
      queryStub.withArgs(db.QUERIES.insertGoogleAccount, sinon.match.any).rejects(dbError)

      request(server)
        .post('/auth/google-web')
        .send({ code: authorisationCode })
        .end((err, res: any) => {
          if (err) {
            return done(err)
          }
          expect(res.status).to.equal(500)
          expect(res.headers['set-cookie']).to.equal(undefined)

          queryStub.restore()

          const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
            mockData.getUuid(),
          ])
          const queryGoogleAccountPromise = db.query(db.QUERIES.findGoogleAccountById, [
            mockData.idToken.valid.sub,
          ])

          Promise.all([queryUserAccessPromise, queryGoogleAccountPromise])
            .then(result => {
              const [[queryUserAccessRows], [queryGoogleAccountRows]] = result
              expect(queryUserAccessRows.length).to.equal(0)
              expect(queryGoogleAccountRows.length).to.equal(0)
              done()
            })
            .catch(done)
        })
    })

    it('should not create row in UserAccess, GoogleAccount and UserProfile table if inserting row in UserProfile(3rd operation) table fails', done => {
      const queryStub = sinon.stub(db, 'query')
      queryStub.withArgs(db.QUERIES.insertUserProfile, sinon.match.any).rejects(dbError)

      request(server)
        .post('/auth/google-web')
        .send({ code: authorisationCode })
        .end((err, res: any) => {
          if (err) {
            return done(err)
          }
          expect(res.status).to.equal(500)
          expect(res.headers['set-cookie']).to.equal(undefined)

          queryStub.restore()

          const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
            mockData.getUuid(),
          ])
          const queryGoogleAccountPromise = db.query(db.QUERIES.findGoogleAccountById, [
            mockData.idToken.valid.sub,
          ])
          const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
            mockData.getUuid(),
          ])

          Promise.all([queryUserAccessPromise, queryGoogleAccountPromise, queryUserProfilePromise])
            .then(result => {
              const [
                [queryUserAccessRows],
                [queryGoogleAccountRows],
                [queryUserProfileRows],
              ] = result
              expect(queryUserAccessRows.length).to.equal(0)
              expect(queryGoogleAccountRows.length).to.equal(0)
              expect(queryUserProfileRows.length).to.equal(0)
              done()
            })
            .catch(done)
        })
    })

    it('should create row in UserAccess, GoogleAccount and UserProfile table if all operations succeed', done => {
      request(server)
        .post('/auth/google-web')
        .send({ code: authorisationCode })
        .end((err, res: any) => {
          if (err) {
            return done(err)
          }
          expect(res.status).to.equal(200)
          expect(res.headers['set-cookie']).to.not.equal(undefined)
          expect(res.body.accessToken).to.not.equal(undefined)
          expect(res.body.isNewUser).to.equal(true);

          const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
            mockData.getUuid(),
          ])
          const queryGoogleAccountPromise = db.query(db.QUERIES.findGoogleAccountById, [
            mockData.idToken.valid.id,
          ])
          const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
            mockData.getUuid(),
          ])

          Promise.all([queryUserAccessPromise, queryGoogleAccountPromise, queryUserProfilePromise])
            .then(result => {
              const [
                [queryUserAccessRows],
                [queryGoogleAccountRows],
                [queryUserProfileRows],
              ] = result
              expect(queryUserAccessRows.length).to.equal(1)
              expect(queryGoogleAccountRows.length).to.equal(1)
              expect(queryUserProfileRows.length).to.equal(1)
              done()
            })
            .catch(done)
        })
    })
  })
})
