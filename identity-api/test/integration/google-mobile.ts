/* eslint-disable object-property-newline, no-unused-expressions */
require('dotenv').config({ path: '.env.test' })

import { expect } from 'chai';
import request = require('supertest');
import sinon = require('sinon');
import uuid = require('uuid');

import * as db from '../../src/db';
import app from '../../src/app';
import { port } from '../config';

db.connect()
let server
const mockData = require('../mock-data')

describe('Google mobile auth routes tests', () => {
  const tokens = {
    access_token: 'access token',
    refresh_token: 'refresh token',
  }
  const postBody = {
    id: mockData.idToken.valid.id,
    email: mockData.idToken.valid.email,
    firstName: mockData.idToken.valid.firstName,
    lastName: mockData.idToken.valid.lastName,
    picture: mockData.idToken.valid.picture,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  }

  /**
   * Set up and tear down
   */
  beforeEach(done => {
    server = app.listen(port, () => {
      done()
    })
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
   * Tests for google mobile auth
   */
  it('should sign in with google and set cookie', done => {
    request(server)
      .post('/auth/google-mobile')
      .send(postBody)
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

  it('should log in if google user is already registered and set cookie', done => {
    request(server)
      .post('/auth/google-mobile')
      .send(postBody)
      .end((err, res: any) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.headers['set-cookie']).to.not.equal(undefined)
        expect(res.headers['set-cookie'].length).to.above(0)
        expect(res.body.accessToken).to.not.equal(undefined)
        expect(res.body.isNewUser).to.equal(true)

        request(server)
          .post('/auth/google-mobile')
          .send(postBody)
          .end((err, res: any) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(200)
            expect(res.headers['set-cookie']).to.not.equal(undefined)
            expect(res.headers['set-cookie'].length).to.above(0)
            expect(res.body.accessToken).to.not.equal(undefined)
            expect(res.body.isNewUser).to.equal(undefined)
            done()
          })
      })
  })

  describe('Test for group of 3 operations in a transaction', () => {
    let uuidStub;
    const dbError = new Error('Transaction error');

    beforeEach(() => {
      uuidStub = sinon.stub(uuid, 'v4').returns(mockData.getUuid())
    })

    afterEach(() => {
      uuidStub.restore()
    })

    it('should not create row in UserAccess table if inserting row in UserAccess(1st operation) table fails', done => {
      const queryStub = sinon.stub(db, 'query')
      queryStub.withArgs(db.QUERIES.insertUserAccess, sinon.match.any).rejects(dbError)

      request(server)
        .post('/auth/google-mobile')
        .send(postBody)
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
        .post('/auth/google-mobile')
        .send(postBody)
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
            mockData.idToken.valid.id,
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
        .post('/auth/google-mobile')
        .send(postBody)
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
        .post('/auth/google-mobile')
        .send(postBody)
        .end((err, res: any) => {
          if (err) {
            return done(err)
          }
          expect(res.status).to.equal(200)
          expect(res.headers['set-cookie']).to.not.equal(undefined)
          expect(res.body.accessToken).to.not.equal(undefined)
          expect(res.body.isNewUser).to.equal(true)

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
