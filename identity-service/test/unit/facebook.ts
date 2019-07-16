import { expect } from 'chai';
import sinon = require('sinon');
import uuid = require('uuid');

import * as db from '../../src/db';
import * as auth from '../../src/utils/auth';
import { signInWithFacebook } from '../../src/controllers';

const sandbox = sinon.createSandbox();

// mock data
const { getUuid } = require('../mock-data');

describe('Sign in with facebook tests', () => {
  const accessToken = 'access token';
  const refreshToken = 'refresh token';

  const ctx: any = {
    request: {
      body: {
        id: '4',
        email: 'han@han.com',
        name: 'han chiang',
        accessToken: 'facebook access token'
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

  const facebookAccountRows = [{
    user_id: '4'
  }];

  beforeEach(() => {
    sandbox.stub(uuid, 'v4').returns(getUuid());
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
  });

  /**
   * Facebook account exist
   */
  describe('Facebook account exist', () => {
    let dbCallback;
    let tokenCallback;

    beforeEach(() => {
      dbCallback = sandbox.stub(db, 'query');
      dbCallback.onCall(0).resolves([facebookAccountRows]);
      tokenCallback = sandbox.stub(auth, 'signToken').resolves(accessToken);
    });

    afterEach(() => {
      dbCallback.restore();
      tokenCallback.restore();
    });

    it('should throw if updateUserProfileNameEmail(step 1 of 2) fails', async () => {
      dbCallback.onCall(1).throws();

      try {
        await signInWithFacebook(ctx);
      } catch(err) {
        expect(err).to.be.instanceof(Error);
      }
    });

    it('should throw if updateFacebookAccountWebToken(step 2 of 2) fails', async () => {
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).throws();

      try {
        await signInWithFacebook({...ctx, isMobile: false});
      } catch(err) {
        expect(err).to.be.instanceof(Error);
      }
    });

    it('should throw if updateFacebookAccountMobileToken(step 2 of 2) fails', async () => {
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).throws();

      try {
        await signInWithFacebook({...ctx, isMobile: true});
      } catch(err) {
        expect(err).to.be.instanceof(Error);
      }
    });

    it('should return response body if all operations succeed', async () => {
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).resolves();

      await signInWithFacebook(ctx);

      sinon.assert.calledTwice(ctx.cookies.set);
      expect(ctx.body).to.eql({
        accessToken,
      });
    });

  });

  /**
   * Facebook account does not exist
   */
  describe('Facebook account does not exist', () => {
    let tokenCallback;
    let dbCallback;

    beforeEach(() => {
      tokenCallback = sandbox.stub(auth, 'signToken');
      tokenCallback.onCall(0).resolves(refreshToken);
      tokenCallback.onCall(1).resolves(accessToken);

      sandbox.stub(db, 'query').resolves([[]]);
      dbCallback = sinon.stub(db, 'singleConnQuery');
    });

    afterEach(() => {
      tokenCallback.restore();
      dbCallback.restore();
    });

    it('should throw if insertUserAccess(step 1 of 3) fails', async () => {
      dbCallback.onCall(0).throws();

      await signInWithFacebook(ctx);

      const throwCall = ctx.throw.getCall(0);
      const error = throwCall.args[0];
      sinon.assert.calledWith(ctx.throw, sinon.match.any);
      expect(error).to.be.instanceof(Error);
    });

    it('should throw if insertFacebookAccount(step 2 of 3) fails', async () => {
      dbCallback.onCall(0).resolves();
      dbCallback.onCall(1).throws();

      await signInWithFacebook(ctx);

      const throwCall = ctx.throw.getCall(0);
      const error = throwCall.args[0];
      sinon.assert.calledWith(ctx.throw, sinon.match.any);
      expect(error).to.be.instanceof(Error);
    });

    it('should throw if insertUserProfile(step 3 of 3) fails', async () => {
      dbCallback.onCall(0).resolves();
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).throws();

      await signInWithFacebook(ctx);

      const throwCall = ctx.throw.getCall(0);
      const error = throwCall.args[0];
      sinon.assert.calledWith(ctx.throw, sinon.match.any);
      expect(error).to.be.instanceof(Error);
    });

    it('should return response body if all operations succeed', async () => {
      dbCallback.onCall(0).resolves();
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).resolves();

      await signInWithFacebook(ctx);

      sinon.assert.calledTwice(ctx.cookies.set);
      expect(ctx.body).to.eql({
        isNewUser: true,
        accessToken,
      });
    });
  });
});