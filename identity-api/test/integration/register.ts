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

describe('Register route tests', () => {
  let user
  const duplicateEmailMessage = 'Please use a different email'
  const firstNameRequiredMessage = 'First name is required'
  const lastNameRequiredMessage = 'Last name is required'
  const emailRequiredMessage = 'Email is required'
  const emailInvalidMessage = 'Email is invalid'
  const passwordRequiredMessage = 'Password is required'
  const passwordInvalidMessage = `Password must be between ${VALIDATORS.password.min} and ${
    VALIDATORS.password.max
  } characters`

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

  after(done => {
    db.endPool().then(() => done())
  })

  /**
   * Tests for register route
   */
  it('should register user successfully with the required details', done => {
    request(server)
      .post('/register')
      .send(user)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(200)
        expect(res.body).to.have.property('accessToken')
        done()
      })
  })

  it('should return 409 when registering user with duplicate email', done => {
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
          .post('/register')
          .send(user)
          .end((err, res) => {
            if (err) {
              return done(err)
            }
            expect(res.status).to.equal(409)
            expect(res.text).to.include(duplicateEmailMessage)
            done()
          })
      })
  })

  it('should return 400 when registering user without email', done => {
    const { email, ...rest } = user

    request(server)
      .post('/register')
      .send(rest)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(400)
        expect(res.text.length).to.be.above(0)
        expect(res.text).to.equal(emailRequiredMessage)
        done()
      })
  })

  it('should return 400 when registering user with invalid email', done => {
    const newUser = { ...user }
    newUser.email = 'invalid_email'

    request(server)
      .post('/register')
      .send(newUser)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(400)
        expect(res.text.length).to.be.above(0)
        expect(res.text).to.equal(emailInvalidMessage)
        done()
      })
  })

  it('should return 400 when registering user without first name', done => {
    const { firstName, ...rest } = user

    request(server)
      .post('/register')
      .send(rest)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(400)
        expect(res.text.length).to.be.above(0)
        expect(res.text).to.equal(firstNameRequiredMessage)
        done()
      })
  })

  it('should return 400 when registering user without last name', done => {
    const { lastName, ...rest } = user

    request(server)
      .post('/register')
      .send(rest)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(400)
        expect(res.text.length).to.be.above(0)
        expect(res.text).to.equal(lastNameRequiredMessage)
        done()
      })
  })

  it('should return 400 when registering user without password', done => {
    const { password, ...rest } = user

    request(server)
      .post('/register')
      .send(rest)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(400)
        expect(res.text.length).to.be.above(0)
        expect(res.text).to.equal(passwordRequiredMessage)
        done()
      })
  })

  it('should return 400 when registering user with password that is too short', done => {
    const newUser = { ...user }
    newUser.password = 'short'

    request(server)
      .post('/register')
      .send(newUser)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(400)
        expect(res.text.length).to.be.above(0)
        expect(res.text).to.equal(passwordInvalidMessage)
        done()
      })
  })

  it('should return 400 when registering user with password that is too long', done => {
    const newUser = { ...user }
    newUser.password =
      'longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong'

    request(server)
      .post('/register')
      .send(newUser)
      .end((err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.status).to.equal(400)
        expect(res.text.length).to.be.above(0)
        expect(res.text).to.equal(passwordInvalidMessage)
        done()
      })
  })

  describe('Test for group of 3 operations in a transaction', () => {
    before(() => {
      sinon.stub(uuid, 'v4').returns(mockData.getUuid())
    })

    after(() => {
      sinon.restore()
    })

    const dbError = new Error('Transaction error');

    const user = mockData.getUser()

    const postBody = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      password: user.password,
    }

    it('should not create row in UserAccess table if inserting row in UserAccess(1st operation) table fails', done => {
      const queryStub = sinon.stub(db, 'query')
      queryStub.withArgs(db.QUERIES.insertUserAccess, sinon.match.any).rejects(dbError)

      request(server)
        .post('/register')
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

    it('should not create row in UserAccess and EmailAccount table if inserting row in EmailAccount(2nd operation) table fails', done => {
      const queryStub = sinon.stub(db, 'query')
      queryStub.withArgs(db.QUERIES.insertEmailAccount, sinon.match.any).rejects(dbError)

      request(server)
        .post('/register')
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
          const queryEmailAccountPromise = db.query(db.QUERIES.findEmailAccountByEmail, [
            postBody.email,
          ])

          Promise.all([queryUserAccessPromise, queryEmailAccountPromise])
            .then(result => {
              const [[queryUserAccessRows], [queryEmailAccountRows]] = result
              expect(queryUserAccessRows.length).to.equal(0)
              expect(queryEmailAccountRows.length).to.equal(0)
              done()
            })
            .catch(done)
        })
    })

    it('should not create row in UserAccess, EmailAccount and UserProfile table if inserting row in UserProfile(3rd operation) table fails', done => {
      const queryStub = sinon.stub(db, 'query')
      queryStub.withArgs(db.QUERIES.insertUserProfile, sinon.match.any).rejects(dbError)

      request(server)
        .post('/register')
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
          const queryEmailAccountPromise = db.query(db.QUERIES.findEmailAccountByEmail, [
            postBody.email,
          ])
          const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
            mockData.getUuid(),
          ])

          Promise.all([queryUserAccessPromise, queryEmailAccountPromise, queryUserProfilePromise])
            .then(result => {
              const [
                [queryUserAccessRows],
                [queryEmailAccountRows],
                [queryUserProfileRows],
              ] = result
              expect(queryUserAccessRows.length).to.equal(0)
              expect(queryEmailAccountRows.length).to.equal(0)
              expect(queryUserProfileRows.length).to.equal(0)
              done()
            })
            .catch(done)
        })
    })

    it('should create row in UserAccess, EmailAccount and UserProfile table if there are no errors in transaction, and email_account_id should be updated in UserAccess table', done => {
      request(server)
        .post('/register')
        .send(postBody)
        .end((err, res: any) => {
          if (err) {
            return done(err)
          }
          expect(res.status).to.equal(200)
          expect(res.headers['set-cookie']).to.not.equal(undefined)
          expect(res.headers['set-cookie'].length).to.above(0)

          expect(res.body.accessToken).to.not.equal(undefined)

          const queryUserAccessPromise = db.query(db.QUERIES.findUserAccessById, [
            mockData.getUuid(),
          ])
          const queryEmailAccountPromise = db.query(db.QUERIES.findEmailAccountByEmail, [
            postBody.email,
          ])
          const queryUserProfilePromise = db.query(db.QUERIES.findUserProfileById, [
            mockData.getUuid(),
          ])

          Promise.all([
            queryUserAccessPromise,
            queryEmailAccountPromise,
            queryUserProfilePromise,
          ]).then(result => {
            const [[queryUserAccessRows], [queryEmailAccountRows], [queryUserProfileRows]] = result
            expect(queryUserAccessRows.length).to.equal(1)
            expect(queryEmailAccountRows.length).to.equal(1)
            expect(queryUserProfileRows.length).to.equal(1)
            expect(queryUserAccessRows.email_account_id).to.equal(queryEmailAccountRows.id)
            done()
          })
        })
    })
  })
})
