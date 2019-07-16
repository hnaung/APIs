const dateFns = require('date-fns');

import * as db from '../db';
import { DATE_TIME_FORMAT } from '../constants';
import {
  UpdateUserProfileContext,
  GetVerificationStatusContext,
  VerifyEmailContext,
  UpdatePreferencescontext,
} from './interface';

export const updateUserProfile = async (ctx: UpdateUserProfileContext) => {
  const { email, provider, firstName, lastName, phoneNumber } = ctx.request.body;

  await db.query(db.QUERIES.updateUserProfileByEmail, [firstName, lastName, phoneNumber, email]);

  if (provider === db.PROVIDERS.google) {
    await db.query(db.QUERIES.updateGoogleAccountByEmail, [firstName, lastName, email]);
  } else if (provider === db.PROVIDERS.facebook) {
    await db.query(db.QUERIES.updateFacebookAccountByEmail, [firstName, lastName, email]);
  } else if (provider === db.PROVIDERS.email) {
    await db.query(db.QUERIES.updateEmailAccountByEmail, [firstName, lastName, email]);
  }

  ctx.body = {
    message: `Profile for ${email} is updated!`,
  };
};

export const getVerificationStatus = async (ctx: GetVerificationStatusContext) => {
  const { email } = ctx.query;
  const [rows] = await db.query(db.QUERIES.findVerifiedByEmail, [email]);

  const isVerified = rows[0].is_email_verified === 1;
  if (isVerified) {
    ctx.body = { isVerified: true };
  } else {
    const hoursDifference = dateFns.differenceInHours(new Date(), rows[0].created_at);

    ctx.body = {
      isVerified: false,
      hoursElapsed: hoursDifference,
    };
  }
};

export const verifyEmail = async (ctx: VerifyEmailContext) => {
  const { email } = ctx.request.body;

  await db.query(db.QUERIES.updateProfileEmailVerified, [
    dateFns.format(new Date(), DATE_TIME_FORMAT),
    email,
  ]);

  ctx.body = {
    message: `${email} is verified!`,
  };
};

export const updatePreferences = async (ctx: UpdatePreferencescontext) => {
  const { email, preferences } = ctx.request.body;
  const { cuisines, atmosphere, dietary } = preferences;

  let values = [];
  // Array will be stringified
  if (cuisines) {
    values.push(`'$.cuisines'`);
    values.push(`'${JSON.stringify(cuisines)}'`);
  }
  if (atmosphere) {
    values.push(`'$.atmosphere'`);
    values.push(`'${JSON.stringify(atmosphere)}'`);
  }
  if (dietary) {
    values.push(`'$.dietary'`);
    values.push(`'${JSON.stringify(dietary)}'`);
  }

  const query = `UPDATE UserProfile SET onboarding_preference = JSON_SET(COALESCE(onboarding_preference, '{}'), ${values.join(
    ','
  )}) WHERE display_email = '${email}'`;
  await db.query(query);

  ctx.body = {
    message: `Updated preferences for ${email}`,
  };
};
