import { expect } from 'chai';
import sinon = require('sinon');

import * as db from '../../src/db';
import * as auth from '../../src/utils/auth';

import { login } from '../../src/controllers';

const sandbox = sinon.createSandbox();

describe('Login tests', () => {
  const accessToken = 'access token';

  const ctx: any = {
    request: {
      body: {
        email: 'han@han.com',
        password: '12345678',
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

  const emailAccountRows = [{
    user_id: 3,
    first_name: 'han chiang',
  }];

  beforeEach(() => {
    sandbox.stub(auth, 'signToken').resolves(accessToken);
    sandbox.stub(db, 'getConnection').resolves(conn);
    sandbox.stub(db, 'releaseConnection');
  });

  afterEach(() => {
    // Reset spies
    ctx.throw.resetHistory();
    ctx.throw.resetHistory();
    ctx.cookies.set.resetHistory();
    conn.beginTransaction.resetHistory();
    conn.rollback.resetHistory();
    conn.commit.resetHistory();

    sandbox.restore();
  });

  it('should throw 404 email account does not exist', async () => {
    const dbCallback = sandbox.stub(db, 'query');
    dbCallback.onCall(0).resolves([[]]);

    await login(ctx);
    sinon.assert.calledWith(ctx.throw, 404);
  });

  it('should throw 401 if password is incorrect', async () => {
    const dbCallback = sandbox.stub(db, 'query');
    dbCallback.onCall(0).resolves([[emailAccountRows]]);

    sandbox.stub(auth, 'compare').resolves(false);

    await login(ctx);
    sinon.assert.calledWith(ctx.throw, 401);
  });

  it('should throw error if updateUserAccessProvider(step 1 of 2) fails', async () => {
    const dbCallback = sandbox.stub(db, 'query');
    dbCallback.onCall(0).resolves([[emailAccountRows]]);

    sandbox.stub(auth, 'compare').resolves(true);
    dbCallback.onCall(1).throws();

    try {
      await login(ctx);
    } catch(err) {
      expect(err).to.be.instanceof(Error);
    }
  });

  it('should throw error if updateUserProfileNameEmail(step 2 of 2) fails', async () => {
    const dbCallback = sandbox.stub(db, 'query');
    dbCallback.onCall(0).resolves([[emailAccountRows]]);

    sandbox.stub(auth, 'compare').resolves(true);
    dbCallback.onCall(1).resolves();
    dbCallback.onCall(2).throws();

    try {
      await login(ctx);
    } catch(err) {
      expect(err).to.be.instanceof(Error);
    }
  });

  it('should return response body if all operations succeed', async () => {
    const dbCallback = sandbox.stub(db, 'query');
    dbCallback.onCall(0).resolves([emailAccountRows]);

    sandbox.stub(auth, 'compare').resolves(true);
    dbCallback.onCall(1).resolves();
    dbCallback.onCall(2).resolves();

    await login(ctx);

    sinon.assert.calledTwice(ctx.cookies.set);
    expect(ctx.body).to.eql({
      accessToken,
      email: ctx.request.body.email,
      firstName: emailAccountRows[0].first_name,
    });
  });
});