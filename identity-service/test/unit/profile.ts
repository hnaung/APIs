import { expect } from 'chai';
import sinon = require('sinon');
const dateFns = require('date-fns');

import * as db from '../../src/db';
import { updateUserProfile, getVerificationStatus, updatePreferences } from '../../src/controllers/profile';
import { DATE_TIME_FORMAT } from '../../src/constants';
const mockData = require('../mock-data');

const sandbox = sinon.createSandbox();

const user = mockData.getUser();

describe('Profile tests', () => {
  /**
   * Update user profile tests
   */
  describe('Update user profile tests', () => {
    const ctx: any = {
      request: {
        body: {
          email: 'han@han.com',
          firstName: 'han 2',
          lastName: "solo",
          provider: db.PROVIDERS.email,
          phoneNumber: "12345678"
        }
      },
    };
  
    let queryCallback;

    beforeEach(() => {
      queryCallback = sandbox.stub(db, 'query')
    })
  
    afterEach(() => {
      sandbox.restore();
      queryCallback.restore();
    });
  
    it('Should update UserProfile and EmailAccount', async () => {
      queryCallback.onCall(0).resolves();
      queryCallback.onCall(1).resolves();
  
      await updateUserProfile(ctx);
  
      expect(ctx.body.message).to.not.equal(undefined);
    });
  
    it('Should update UserProfile and GoogleAccount', async () => {
      queryCallback.onCall(0).resolves();
      queryCallback.onCall(1).resolves();
  
      let myCtx = {...ctx}
      myCtx.request.body.provider = db.PROVIDERS.google;
  
      await updateUserProfile(ctx);
  
      expect(ctx.body.message).to.not.equal(undefined);
    });
  
    it('Should update UserProfile and FacebookAccount', async () => {
      queryCallback.onCall(0).resolves();
      queryCallback.onCall(1).resolves();
  
      let myCtx = {...ctx}
      myCtx.request.body.provider = db.PROVIDERS.facebook;
  
      await updateUserProfile(ctx);
  
      expect(ctx.body.message).to.not.equal(undefined);
    });
  
    it('should throw error if error occurred while updating UserProfile', async () => {
      queryCallback.onCall(0).throws();
  
      try {
        await updateUserProfile(ctx);
      } catch(err) {
        expect(err instanceof Error).to.equal(true);
      }
  
    })
  });

  /**
   * Get verification status tests
   */
  describe('Update verification status tests', () => {
    const ctx: any = {
      query: {
        email: user.email,
      }
    }

    const today = new Date()
    const verifiedUser = {
      is_email_verified: 1,
      created_at: dateFns.format(today, DATE_TIME_FORMAT)
    }

    const unverifiedUserWithin48Hrs = {
      is_email_verified: 0,
      created_at: dateFns.subHours(today, 48)
    }

    const unverifiedUserAfter48Hrs = {
      is_email_verified: 0,
      created_at: dateFns.subHours(today, 49)
    }


    afterEach(() => {
      sandbox.restore();
    })

    it ('should return verified user', async () => {
      sandbox.stub(db, 'query').resolves([[verifiedUser]])

      await getVerificationStatus(ctx);

      expect(ctx.body.isVerified).to.equal(true);
    })

    it ('should return verified user', async () => {
      sandbox.stub(db, 'query').resolves([[verifiedUser]])

      await getVerificationStatus(ctx);

      expect(ctx.body.isVerified).to.equal(true);
    })

    it ('should return unverified user within 48 hours', async () => {
      sandbox.stub(db, 'query').resolves([[unverifiedUserWithin48Hrs]])

      await getVerificationStatus(ctx);

      expect(ctx.body.isVerified).to.equal(false);
      expect(ctx.body.hoursElapsed).to.equal(48);
    })

    it ('should return unverified user after 48 hours', async () => {
      sandbox.stub(db, 'query').resolves([[unverifiedUserAfter48Hrs]])

      await getVerificationStatus(ctx);

      expect(ctx.body.isVerified).to.equal(false);
      expect(ctx.body.hoursElapsed).to.equal(49);
    })
  });

  describe('Update preference tests', () => {
    const ctx: any = {
      request: {
        body: {
          email: user.email,
        }
      }
    }

    afterEach(() => {
      sandbox.restore();
    })

    it('should update cuisines preference only', async () => {
      let myCtx = {...ctx};
      myCtx.request.body.preferences = {
        cuisines: mockData.preferences.cuisines
      };
      sandbox.stub(db, 'query').resolves([])

      await updatePreferences(myCtx)

      expect(myCtx.body).to.not.equal(undefined);
    })

    it('should update atmosphere preference only', async () => {
      let myCtx = {...ctx};
      myCtx.request.body.preferences = {
        atmosphere: mockData.preferences.atmosphere
      };
      sandbox.stub(db, 'query').resolves([])

      await updatePreferences(myCtx)

      expect(myCtx.body).to.not.equal(undefined);
    })

    it('should update dietary preference only', async () => {
      let myCtx = {...ctx};
      myCtx.request.body.preferences = {
        dietary: mockData.preferences.dietary
      };
      sandbox.stub(db, 'query').resolves([])

      await updatePreferences(myCtx)

      expect(myCtx.body).to.not.equal(undefined);
    })

  });
});