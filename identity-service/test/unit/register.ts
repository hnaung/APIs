
import { expect } from 'chai';
import sinon = require('sinon');
import uuid = require('uuid');

import * as db from '../../src/db';
import * as auth from '../../src/utils/auth';

import { register } from '../../src/controllers';

const sandbox = sinon.createSandbox();

// mock data
const { getUser, getUuid } = require('../mock-data');

describe('register tests', () => {
  const user = getUser();
  const accessToken = 'access token';
  const refreshToken = 'refresh token';

  const ctx: any = {
    request: {
      body: {
        email: 'han@han.com',
        password: '12345678',
        firstName: 'han',
        lastName: 'chiang',
        phoneNumber: '99927217'
      }
    },
    throw: sinon.spy(),
    cookies: {
      set: sinon.spy()
    }
  };

  const conn = {
    beginTransaction: sinon.spy(),
    rollback: sinon.spy(),
    commit: sinon.spy()
  };

  const registerError = new Error('register error');
  const insertEmailAccountRows = { insertId: 2 };

  beforeEach(() => {
    sandbox.stub(uuid, 'v4').returns(getUuid());
    
    const tokenCallback = sandbox.stub(auth, 'signToken');
    tokenCallback.onCall(0).resolves(refreshToken);
    tokenCallback.onCall(1).resolves(accessToken);

    sandbox.stub(auth, 'hash').withArgs(ctx.request.body.password).resolves(ctx.request.body.password);
    sandbox.stub(db, 'getConnection').resolves(conn);
    sandbox.stub(db, 'releaseConnection');
  })

  afterEach(() => {
    // Reset spies
    ctx.throw.resetHistory();
    ctx.cookies.set.resetHistory();
    conn.beginTransaction.resetHistory();
    conn.rollback.resetHistory();
    conn.commit.resetHistory();

    sandbox.restore();
  })

  it('should throw error if email account exists', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[user]]);
    await register(ctx);

    const throwCall = ctx.throw.getCall(0);
    const error = throwCall.args[1];
    sinon.assert.calledWith(ctx.throw, 409, sinon.match.any);
    expect(error).to.be.instanceof(Error);
    expect(error.message).to.equal(`An account with email: ${ctx.request.body.email} already exists. Please use a different email`);
  });

  it('should throw error if insertUserAccess(Step 1 of 4) fails', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[]]);

    // Stub the failing function
    sandbox.stub(db, 'singleConnQuery').withArgs(sinon.match.any, db.QUERIES.insertUserAccess, [
      getUuid(),
      null,
      null,
      null,
      refreshToken,
      db.PROVIDERS.email
    ]).throws(registerError);
    
    await register(ctx);
    const throwCall = ctx.throw.getCall(0);
    const error = throwCall.args[0];
    sinon.assert.calledWith(ctx.throw, sinon.match.any);
    expect(error).to.be.instanceof(Error);
    expect(error).to.equal(registerError);
  });

  it('should throw error if insertEmailAccount(Step 2 of 4) fails', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[]]);
    const dbCallback = sandbox.stub(db, 'singleConnQuery');

    dbCallback.onCall(0).resolves();
    dbCallback.onCall(1).throws(registerError);
    
    await register(ctx);
    const throwCall = ctx.throw.getCall(0);
    const error = throwCall.args[0];
    sinon.assert.calledWith(ctx.throw, sinon.match.any);
    expect(error).to.be.instanceof(Error);
    expect(error).to.equal(registerError);
  });

  it('should throw error if insertUserProfile(Step 3 of 4) fails', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[]]);
    const dbCallback = sandbox.stub(db, 'singleConnQuery');

    dbCallback.onCall(0).resolves();
    dbCallback.onCall(1).resolves([insertEmailAccountRows]);
    dbCallback.onCall(2).throws(registerError);
    
    await register(ctx);
    const throwCall = ctx.throw.getCall(0);
    const error = throwCall.args[0];
    sinon.assert.calledWith(ctx.throw, sinon.match.any);
    expect(error).to.be.instanceof(Error);
    expect(error).to.equal(registerError);
  });

  it('should throw error if updateUserAccessEmailId(Step 4 of 4) fails', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[]]);
    const dbCallback = sandbox.stub(db, 'singleConnQuery');

    dbCallback.onCall(0).resolves();
    dbCallback.onCall(1).resolves([insertEmailAccountRows]);
    dbCallback.onCall(2).resolves();
    dbCallback.onCall(3).rejects(registerError)
    
    await register(ctx);
    const throwCall = ctx.throw.getCall(0);
    const error = throwCall.args[0];
    sinon.assert.calledWith(ctx.throw, sinon.match.any);
    expect(error).to.be.instanceof(Error);
    expect(error).to.equal(registerError);
  });

  it('should return response body if all operations succeed', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[]]);
    const dbCallback = sandbox.stub(db, 'singleConnQuery');

    dbCallback.onCall(0).resolves();
    dbCallback.onCall(1).resolves([insertEmailAccountRows]);
    dbCallback.onCall(2).resolves();
    dbCallback.onCall(3).resolves();
    
    await register(ctx);

    sinon.assert.notCalled(ctx.throw);
    sinon.assert.calledTwice(ctx.cookies.set);

    expect(ctx.body).to.eql({
      accessToken,
      email: ctx.request.body.email,
      firstName: ctx.request.body.firstName,
    });
  });
});