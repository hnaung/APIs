import { expect } from 'chai';
import sinon = require('sinon');
import uuid = require('uuid');

import * as db from '../../src/db';
import * as auth from '../../src/utils/auth';
import { signInWithGoogleWeb } from '../../src/controllers';
const oauthGoogle = require('../../src/utils/oauth-google');

const sandbox = sinon.createSandbox();

// mock data
const { getUuid } = require('../mock-data');

describe('Sign in with google web tests', () => {
  const accessToken = 'access token';
  const refreshToken = 'refresh token';

  const decodedIdToken = {
    email: 'han@han.com',
    name: 'han chiang'
  };

  const googleAccountIdRows = [{
    user_id: 4
  }];

  const ctx: any = {
    request: {
      body: {
        code: 'google auth code'
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

  const googleTokens = {
    id_token: 'google id token',
    access_token: 'google access token',
    refresh_token: 'google refresh token'
  };

  beforeEach(() => {
    sandbox.stub(uuid, 'v4').returns(getUuid());
    sandbox.stub(db, 'getConnection').resolves(conn);
    sandbox.stub(db, 'releaseConnection');
    sandbox.stub(oauthGoogle, 'getTokenFromCode').resolves(googleTokens);
    sandbox.stub(oauthGoogle, 'verifyIdToken').resolves(decodedIdToken);
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
   * Google account exist
   */
  describe('Google account exist', () => {
    let dbCallback;
    let tokenCallback;

    beforeEach(() => {
      dbCallback = sandbox.stub(db, 'query');
      dbCallback.onCall(0).resolves([googleAccountIdRows]);
      tokenCallback = sandbox.stub(auth, 'signToken').resolves(accessToken);
    });

    afterEach(() => {
      dbCallback.restore();
      tokenCallback.restore();
    });

    it('should throw if updateGoogleAccountTokens(step 1 of 2) fails', async () => {
      dbCallback.onCall(1).throws();

      try {
        await signInWithGoogleWeb(ctx);
      } catch(err) {
        expect(err).to.be.instanceof(Error);
      }
    });

    it('should throw if updateUserAccessProvider(step 2 of 2) fails', async () => {
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).throws();

      try {
        await signInWithGoogleWeb(ctx);
      } catch(err) {
        expect(err).to.be.instanceof(Error);
      }
    });

    it('should return response body if all operations succeed', async () => {
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).resolves();

      await signInWithGoogleWeb(ctx);

      sinon.assert.calledTwice(ctx.cookies.set);
      expect(ctx.body).to.eql({
        accessToken,
      });
    });
    
  });

  /**
   * Google account does not exist
   */
  describe('Google account does not exist', () => {
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

      await signInWithGoogleWeb(ctx);

      const throwCall = ctx.throw.getCall(0);
      const error = throwCall.args[0];
      sinon.assert.calledWith(ctx.throw, sinon.match.any);
      expect(error).to.be.instanceof(Error);
    });

    it('should throw if insertGoogleAccount(step 2 of 3) fails', async () => {
      dbCallback.onCall(0).resolves();
      dbCallback.onCall(1).throws();

      await signInWithGoogleWeb(ctx);

      const throwCall = ctx.throw.getCall(0);
      const error = throwCall.args[0];
      sinon.assert.calledWith(ctx.throw, sinon.match.any);
      expect(error).to.be.instanceof(Error);
    });

    it('should throw if insertUserProfile(step 3 of 3) fails', async () => {
      dbCallback.onCall(0).resolves();
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).throws();

      await signInWithGoogleWeb(ctx);

      const throwCall = ctx.throw.getCall(0);
      const error = throwCall.args[0];
      sinon.assert.calledWith(ctx.throw, sinon.match.any);
      expect(error).to.be.instanceof(Error);
    });

    it('should return response body if all operations succeed', async () => {
      dbCallback.onCall(0).resolves();
      dbCallback.onCall(1).resolves();
      dbCallback.onCall(2).resolves();

      await signInWithGoogleWeb(ctx);

      sinon.assert.calledTwice(ctx.cookies.set);
      expect(ctx.body).to.eql({
        isNewUser: true,
        accessToken,
      });
    });
  });
});