const dateFns = require('date-fns');

import * as db from '../db';
import * as auth from '../utils/auth';
const oauth = require('../utils/oauth-google');

import { COOKIE_OPTIONS, DATE_TIME_FORMAT } from '../constants';
const { getUuid } = require('../utils/uuid');
import { mailOptions, sendMail } from '../utils/mailer';

import {
  IsEmailTakenContext,
  RegisterContext,
  LoginContext,
  GoogleMobileContext,
  GoogleWebContext,
  FacebookContext,
  EmailVerificationContext,
} from './interface';

const doesEmailAccountExist = async (email) => {
  const [rows] = await db.query(db.QUERIES.findEmailAccountByEmail, [email]);
  return rows.length > 0;
};

export const isEmailTaken = async (ctx: IsEmailTakenContext) => {
  const { email } = ctx.query;

  const emailAccountExist = await doesEmailAccountExist(email);
  ctx.body = emailAccountExist;
};

export const emailVerification = async (ctx: EmailVerificationContext) => {
  const { email, firstName, isResend = false } = ctx.request.body;

  if (isResend) {
    const emailAccountExist = await doesEmailAccountExist(email);
    if (!emailAccountExist) {
      return ctx.throw(
        404,
        "Sorry, we can't find an account with this email address. Please try again or create a new account"
      );
    }
  }

  await sendMail(
    mailOptions(firstName, {
      to: email,
    })
  );

  ctx.body = {
    message: `Email verification sent to ${email}`,
  };
};

// TODO: Implement account linking:
// 1. Manual linking option in UI
// 2. Automatic account linking for to resolve duplicate email

// Check whether user has an account in `EmailAccount` table by looking up `email`
// 1. If user exists
//  1.1 throw error
// 2. Else
//  2.1 Create a row in `UserAccess`, `EmailAccount` and `UserProfile` table
//  2.2 Update `UserAccess` table with `emailAccountId`
//  2.3 Generate tokens
//  2.4 Set tokens and `userProfileId` in cookie and return response
export const register = async (ctx: RegisterContext) => {
  const { firstName, lastName, phoneNumber, email, password } = ctx.request.body;

  // Look up `EmailAccount` table by email
  const [emailAccountRows] = await db.query(db.QUERIES.findEmailAccountByEmail, [email]);

  const isEmailAccountExist = emailAccountRows.length > 0;

  if (isEmailAccountExist) {
    let error = new Error(
      `An account with email: ${email} already exists. Please use a different email`
    );
    ctx.throw(409, error);
  } else {
    const conn = await db.getConnection();
    try {
      // 2. Create a row in `UserAccess`, `EmailAccount` and `UserProfile` table
      await conn.beginTransaction();
      const userProfileId = getUuid();

      const today = new Date();
      const refreshTokenPromise = auth.signToken({ lastLogin: today, userProfileId }, false);
      const accessTokenPromise = auth.signToken({ lastLogin: today, userProfileId }, true);
      const passwordPromise = auth.hash(password);

      const [accessToken, refreshToken, hashedPassword] = await Promise.all([
        accessTokenPromise,
        refreshTokenPromise,
        passwordPromise,
      ]);

      // 2.1 Create row in `UserAccess` table
      await db.singleConnQuery(conn, db.QUERIES.insertUserAccess, [
        userProfileId,
        null,
        null,
        null,
        refreshToken,
        db.PROVIDERS.email,
      ]);

      // 2.1 Create row in `EmailAccount` table
      const [insertEmailAccountRows] = await db.singleConnQuery(
        conn,
        db.QUERIES.insertEmailAccount,
        [userProfileId, email, firstName, lastName, hashedPassword]
      );
      const { insertId: emailAccountId } = insertEmailAccountRows;

      // 2.1 Create row in `UserProfile` table
      await db.singleConnQuery(conn, db.QUERIES.insertUserProfile, [
        userProfileId,
        email,
        firstName,
        lastName,
        null, // For registering an email account, we don't ask for profile picture
        phoneNumber,
      ]);

      // 2.2 Update `UserAccess` table with `emailAccountId`
      await db.singleConnQuery(conn, db.QUERIES.updateUserAccessEmailId, [
        emailAccountId,
        userProfileId,
      ]);

      await conn.commit();
      db.releaseConnection(conn);

      // 2.3 Set token and userProfileId in cookie
      ctx.cookies.set('userProfileId', userProfileId);
      ctx.cookies.set('accessToken', accessToken);
      ctx.body = {
        accessToken,
        firstName,
        email,
      };
    } catch (err) {
      await conn.rollback();
      db.releaseConnection(conn);
      ctx.throw(err);
    }
  }
};

// Check whether email exists in `EmailAccount` table
// 1. If email exists
//  1.1 If password correct
//   1.1.1 Update logged_in_provider in `UserAccess` table and `display_email`, `display_name` in `UserProfile` table
//   1.1.2 Generate token, set token and `userProfileId` in cookie and return response
//  1.2 Else throw 401
// 2. Else throw 404
export const login = async (ctx: LoginContext) => {
  const { email, password } = ctx.request.body;

  const [rows] = await db.query(db.QUERIES.findEmailAccountByEmail, [email]);
  const isEmailAccountExist = rows.length === 1;

  if (isEmailAccountExist) {
    const userProfileId = rows[0].user_id;
    const isCorrectPassword = await auth.compare(password, rows[0].password);

    if (isCorrectPassword) {
      const accessToken = await auth.signToken({ userProfileId }, true);

      // 1.1.1 Update logged_in_provider in `UserAccess` table
      const updateUserAccessPromise = db.query(db.QUERIES.updateUserAccessProvider, [
        db.PROVIDERS.email,
        rows[0].user_id,
      ]);

      // 1.1.1 Update `display_Name` and `display_name` in `UserProfile` table
      const updateUserProfilePromise = db.query(db.QUERIES.updateUserProfileNameEmail, [
        email,
        rows[0].first_name,
        rows[0].last_name,
        rows[0].user_id,
      ]);

      await Promise.all([updateUserAccessPromise, updateUserProfilePromise]);

      ctx.cookies.set('accessToken', accessToken, COOKIE_OPTIONS);
      ctx.cookies.set('userProfileId', userProfileId, COOKIE_OPTIONS);
      ctx.body = {
        accessToken,
        firstName: rows[0].first_name,
        email,
      };
    } else {
      ctx.throw(401, 'The password you have entered is incorrect. Please try again.');
    }
  } else {
    ctx.throw(
      404,
      "Sorry, we can't find an account with this email address. Please try again or create a new account."
    );
  }
};

// Check user has a google account in `GoogleAccount` table
// 1. If google account exist
//  1.1 Update `access_token` and `refresh_token` in `GoogleAcccount` table
//  1.2 Update `logged_in_provider` in `UserAccess` table
//  1.3 Set token and user profile id in cookie and return response
//  1.4 Update `display_name` and `display_email` in `UserProfile` table
// 2. Else
//  2.1 Create a row in `UserAccess`, `GoogleAccount` and `UserProfile`
//  2.2 Generate token
//  2.3 Set token and user profile in cookie and return response
export const signInWithGoogleMobile = async (ctx: GoogleMobileContext) => {
  const {
    id: googleId,
    email,
    firstName,
    lastName,
    picture,
    phoneNumber,
    refreshToken: googleRefreshToken,
    accessToken: googleAccessToken,
  } = ctx.request.body;

  const [rows] = await db.query(db.QUERIES.findGoogleAccountById, [googleId]);
  const isGoogleAccountExist = rows.length > 0;

  if (isGoogleAccountExist) {
    const accessTokenPromise = auth.signToken({
      lastLogin: new Date(),
      userProfileId: rows[0].user_id,
    });

    // 1.1 Update `access_token` and `refresh_token` in `GoogleAcccount` table
    const updateGoogleAccountPromise = db.query(db.QUERIES.updateGoogleAccountTokens, [
      googleAccessToken,
      googleRefreshToken,
      googleId,
    ]);

    // 1.2 Update `logged_in_provider` in `UserAccess` table
    const updateUserAccessPromise = db.query(db.QUERIES.updateUserAccessProvider, [
      db.PROVIDERS.google,
      rows[0].user_id,
    ]);

    /* eslint-disable-next-line */
    const [accessToken, _, __] = await Promise.all([
      accessTokenPromise,
      updateGoogleAccountPromise,
      updateUserAccessPromise,
    ]);

    // 1.3 Set token and user profile id in cookie and return response
    ctx.cookies.set('userProfileId', rows[0].user_id, COOKIE_OPTIONS);
    ctx.cookies.set('accessToken', accessToken, COOKIE_OPTIONS);
    ctx.body = {
      accessToken,
    };

    // 1.4 Update `UserProfile` table
    await db.query(db.QUERIES.updateUserProfile, [
      email,
      firstName,
      lastName,
      picture,
      phoneNumber,
      rows[0].user_id,
    ]);
  } else {
    const today = new Date();

    const conn = await db.getConnection();

    try {
      // 2.1 Create a row in `UserAccess`, `GoogleAccount` and `UserProfile`
      await conn.beginTransaction();
      const userProfileId = getUuid();

      const refreshTokenPromise = auth.signToken({ lastLogin: today, userProfileId }, false);
      const accessTokenPromise = auth.signToken({ lastLogin: today, userProfileId });
      const [accessToken, refreshToken] = await Promise.all([
        accessTokenPromise,
        refreshTokenPromise,
      ]);

      // 2.1 Create row in `UserAccess` table
      await db.singleConnQuery(conn, db.QUERIES.insertUserAccess, [
        userProfileId,
        null,
        null,
        googleId,
        refreshToken,
        db.PROVIDERS.google,
      ]);

      // 2.1 create row in `GoogleAccount` table
      await db.singleConnQuery(conn, db.QUERIES.insertGoogleAccount, [
        googleId,
        userProfileId,
        email,
        firstName,
        lastName,
        picture,
        googleAccessToken,
        googleRefreshToken,
      ]);

      // 2.1 Create row in `UserProfile` table
      await db.singleConnQuery(conn, db.QUERIES.insertUserProfileVerified, [
        userProfileId,
        email,
        firstName,
        lastName,
        picture,
        phoneNumber,
        1,
        dateFns.format(new Date(), DATE_TIME_FORMAT),
      ]);

      await conn.commit();
      db.releaseConnection(conn);

      // 2.3 Set token and userProfileId in cookie
      ctx.cookies.set('userProfileId', userProfileId);
      ctx.cookies.set('accessToken', accessToken);
      ctx.body = {
        accessToken,
        isNewUser: true,
      };
    } catch (err) {
      await conn.rollback();
      db.releaseConnection(conn);
      ctx.throw(err);
    }
  }
};

// Check whether user has a google account in `GoogleAccount` table
// 1. If google account exists
//  1.1 Update `access_token` and `refresh_token` `GoogleAccount`
//  1.2 Update `logged_in_provider` in `UserAccess`
//  1.3 Generate token, set token and user profile id in cookie and return response
//  1.4 Update `display_name` and `display_email` in `UserProfile` table
// 2. Else
//  2.1 Create a row in `UserAccess`, `GoogleAccount` and `UserProfile` table
//  2.2 Generate tokens
//  2.3 Set token and user profile id in cookie and return response
export const signInWithGoogleWeb = async (ctx: GoogleWebContext) => {
  const { code } = ctx.request.body;
  const {
    id_token: googleIdToken,
    access_token: googleAccessToken,
    refresh_token: googleRefreshToken,
  } = await oauth.getTokenFromCode(code);

  const decodedIdToken = await oauth.verifyIdToken(ctx, googleIdToken);
  const {
    given_name: firstName,
    family_name: lastName,
    sub: googleId,
    email,
    picture,
  } = decodedIdToken;

  const [rows] = await db.query(db.QUERIES.findGoogleAccountById, [googleId]);
  const isGoogleAccountExist = rows.length > 0;

  if (isGoogleAccountExist) {
    const accessTokenPromise = auth.signToken({
      lastLogin: new Date(),
      userProfileId: rows[0].user_id,
    });

    // 1.1 Update `access_token` and `refresh_token` in `GoogleAccount`
    const updateGoogleAccountPromise = db.query(db.QUERIES.updateGoogleAccountTokens, [
      googleAccessToken,
      googleRefreshToken,
      googleId,
    ]);

    // 1.2 Update `logged_in_provider in `UserAccess` table
    const updateUserAccessPromise = db.query(db.QUERIES.updateUserAccessProvider, [
      db.PROVIDERS.google,
      googleId,
    ]);

    /* eslint-disable-next-line */
    const [accessToken, _, __] = await Promise.all([
      accessTokenPromise,
      updateGoogleAccountPromise,
      updateUserAccessPromise,
    ]);

    // 1.3 Generate token, set token and user profile id in cookie and return response
    ctx.cookies.set('userProfileId', rows[0].user_id, COOKIE_OPTIONS);
    ctx.cookies.set('accessToken', accessToken, COOKIE_OPTIONS);
    ctx.body = {
      accessToken,
    };

    // 1.4 Update `UserProfile` table
    await db.query(db.QUERIES.updateUserProfile, [
      email,
      firstName,
      lastName,
      picture,
      null,
      rows[0].user_id,
    ]);
  } else {
    const today = new Date();

    const conn = await db.getConnection();

    try {
      await conn.beginTransaction();
      const userProfileId = getUuid();

      const refreshToken = await auth.signToken({ lastLogin: today, userProfileId }, false);

      // 2.2 Create a row in `UserAccess` table
      await db.singleConnQuery(conn, db.QUERIES.insertUserAccess, [
        userProfileId,
        null,
        null,
        googleId,
        refreshToken,
        db.PROVIDERS.google,
      ]);

      // 2.2 Create a row in `GoogleAccount` table
      await db.singleConnQuery(conn, db.QUERIES.insertGoogleAccount, [
        googleId,
        userProfileId,
        email,
        firstName,
        lastName,
        picture,
        googleAccessToken,
        googleRefreshToken,
      ]);

      // 2.2 Create a row in `UserProfile` table
      await db.singleConnQuery(conn, db.QUERIES.insertUserProfileVerified, [
        userProfileId,
        email,
        firstName,
        lastName,
        picture,
        null, // Pending UI for collecting first name, last name and phone number. Right now we don't have phone number
        1,
        dateFns.format(new Date(), DATE_TIME_FORMAT),
      ]);

      await conn.commit();
      db.releaseConnection(conn);

      // 2.3 Set token and userProfileId in cookie
      const accessToken = await auth.signToken({ lastLogin: today, userProfileId });

      ctx.cookies.set('userProfileId', userProfileId);
      ctx.cookies.set('accessToken', accessToken);
      ctx.body = {
        accessToken,
        isNewUser: true,
      };
    } catch (err) {
      await conn.rollback();
      db.releaseConnection(conn);
      ctx.throw(err);
    }
  }
};

// Check whether user has a facebook account in `UserAccess` table.
// 1. If facebook account exist
//  1.1 Update `display_name` and `display_email` `UserProfile` table
//  1.2 Update (web|mobile))long_lived_token in `FacebookAccount` table
//  1.3 Generate access token, set token and userProfileId in cookie and return response.
//  1.4 Update `logged_in_provider` in `UserAccess table
// 2. Else
//  2.1 Generate refresh token
//  2.2 Transaction: Create a row in FacebookAccount, UserAccess table and UserProfile table
//  2.3 Generate access token, set token and userProfileId in cookie
// Implicit flow for web and mobile
export const signInWithFacebook = async (ctx: FacebookContext) => {
  const {
    id: facebookId,
    email,
    firstName,
    lastName,
    picture,
    phoneNumber,
    accessToken: facebookAccessToken,
    isMobile,
  } = ctx.request.body;

  const [rows] = await db.query(db.QUERIES.findFacebookAccountById, [facebookId]);
  const isFacebookUserExist = rows.length > 0;

  if (isFacebookUserExist) {
    const userProfileId = rows[0].user_id;

    // 1.1 Update display_first_name, display_last_name and display_email in UserProfile table
    await db.query(db.QUERIES.updateUserProfile, [
      email,
      firstName,
      lastName,
      picture,
      phoneNumber,
      userProfileId,
    ]);

    // 1.2 Update (web|mobile)_long_lived_token in FacebookAccount table
    const query = isMobile
      ? db.QUERIES.updateFacebookAccountMobileToken
      : db.QUERIES.updateFacebookAccountWebToken;
    await db.query(query, [facebookAccessToken, facebookId]);

    // 1.3 Generate access token, set token and userProfileId in cookie
    const accessToken = await auth.signToken(
      { lastLogin: new Date(), userProfileId: rows[0].user_id },
      true
    );

    ctx.cookies.set('userProfileId', userProfileId, COOKIE_OPTIONS);
    ctx.cookies.set('accessToken', accessToken, COOKIE_OPTIONS);

    ctx.body = {
      accessToken,
    };

    // 1.4 Update `logged_in_provider` in `UserAccess table
    await db.query(db.QUERIES.updateUserAccessProvider, [db.PROVIDERS.facebook, userProfileId]);
  } else {
    const conn = await db.getConnection();

    try {
      // 2.2 Create a row in `UserAccess table, `FacebookAccount` and `UserProfile` table
      await conn.beginTransaction();

      const today = new Date();
      const userProfileId = getUuid();

      // 2.1 Generate tokens
      const refreshTokenPromise = auth.signToken({ lastLogin: today, userProfileId }, false);
      const accessTokenPromise = auth.signToken({ lastLogin: today, userProfileId }, true);
      const [refreshToken, accessToken] = await Promise.all([
        refreshTokenPromise,
        accessTokenPromise,
      ]);

      // Create row in `UserAccess` table
      await db.singleConnQuery(conn, db.QUERIES.insertUserAccess, [
        userProfileId,
        null,
        facebookId,
        null,
        refreshToken,
        db.PROVIDERS.facebook,
      ]);

      // Create row in `FacebookAccount` table
      // TODO: Figure out how to generate `long_lived_token`
      await db.singleConnQuery(conn, db.QUERIES.insertFacebookAccount, [
        facebookId,
        userProfileId,
        email,
        firstName,
        lastName,
        picture,
        !isMobile ? facebookAccessToken : null,
        isMobile ? facebookAccessToken : null,
      ]);

      // Create row in `UserProfile` table
      // TODO: Insert `phone`, `country_code`, `onboarding_preferences` in the future
      await db.singleConnQuery(conn, db.QUERIES.insertUserProfileVerified, [
        userProfileId,
        email,
        firstName,
        lastName,
        picture,
        phoneNumber,
        1,
        dateFns.format(new Date(), DATE_TIME_FORMAT),
      ]);

      await conn.commit();
      db.releaseConnection(conn);

      // 2.3 Set token and userProfileId in cookie
      ctx.cookies.set('userProfileId', userProfileId);
      ctx.cookies.set('accessToken', accessToken);
      ctx.body = {
        accessToken,
        isNewUser: true,
      };
    } catch (err) {
      await conn.rollback();
      db.releaseConnection(conn);
      ctx.throw(err);
    }
  }
};
