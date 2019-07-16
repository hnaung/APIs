import { expect } from 'chai';
import sinon = require('sinon');

import * as db from '../../src/db';
import { emailVerification } from '../../src/controllers';
import { verifyEmail } from '../../src/controllers/profile';
import * as mailer from '../../src/utils/mailer';

const sandbox = sinon.createSandbox();

// mock data
const { getUser } = require('../mock-data');

describe('Email verification tests', () => {
  const user = getUser()
  const ctx: any = {
    request: {
      body: {
        email: user.email,
        firstName: user.firstName,
      }
    },
    throw: sinon.spy()
  };

  beforeEach(() => {
    sandbox.stub(mailer, 'sendMail').resolves();
  })

  afterEach(() => {
    sandbox.restore();
    ctx.throw.resetHistory()
  });

  /**
   * Send email verification
   */
  it('Should send email successfully after register successful', async () => {
    await emailVerification(ctx);

    expect(ctx.body.message).to.not.equal(undefined);
  });

  it('should resend email verification successfully with an existing email', async () => {
    const user = getUser();

    let myCtx = { ...ctx };
    ctx.request.body.isResend = true;

    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[user]]);

    await emailVerification(myCtx);

    expect(ctx.body.message).to.not.equal(undefined);
  })

  it('should throw error when resending email verification with email that does not exist', async () => {
    let myCtx = { ...ctx };
    ctx.request.body.isResend = true;

    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.request.body.email]).resolves([[]]);
    await emailVerification(myCtx);
    sinon.assert.calledOnce(myCtx.throw);
  })

  /**
   * Verify user's email account
   */
  it('should set user as verified', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.updateProfileEmailVerified, sinon.match.any).resolves();

    await verifyEmail(ctx);
    expect(ctx.body.message).include('verified');
  })

  it('should not set user as verified', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.updateProfileEmailVerified, sinon.match.any).throws();

    try {
      await verifyEmail(ctx);
    } catch(err) {
      expect(err).to.not.equal(undefined);
    }
  })

});