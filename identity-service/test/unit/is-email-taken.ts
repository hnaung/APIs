import { expect } from 'chai';
import sinon = require('sinon');

import * as db from '../../src/db';
import { isEmailTaken } from '../../src/controllers';

const sandbox = sinon.createSandbox();

// mock data
const { getUser } = require('../mock-data');

describe('============== Unit tests ============\nisEmailTaken tests', () => {
  const ctx: any = {
    query: {
      email: 'han@han.com'
    }
  };

  afterEach(() => {
    sandbox.restore();
  });

  it('Return true in body if email is not taken', async () => {
    const user = getUser();

    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.query.email]).resolves([[user]]);
    await isEmailTaken(ctx);
    expect(ctx.body).to.equal(true);
  });

  it('Return false in body if email is taken', async () => {
    sandbox.stub(db, 'query').withArgs(db.QUERIES.findEmailAccountByEmail, [ctx.query.email]).resolves([[]]);
    await isEmailTaken(ctx);
    expect(ctx.body).to.equal(false);
  });
});