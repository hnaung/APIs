// Refer to https://github.com/googleapis/google-auth-library-nodejs

const dateFns = require('date-fns');
const { OAuth2Client } = require('google-auth-library');

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URL
);

/**
 * Get tokens from authorisation code
 * Shape: access_token, refresh_token, scope, token_type = Bearer, id_token, expiry_date(in ms)
 */
exports.getTokenFromCode = async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens;
};

/**
 * After acquiring an access_token, you may want to check on the audience, expiration,
 * or original scopes requested.  You can do that with the `getTokenInfo` method.
 * Shape: expiry_date(in ms), scopes, azp, aud(client id), sub(user google id), exp(in s), email, email_verified, access_type
 */

exports.verifyAccessToken = async (accessToken) => oAuth2Client.getTokenInfo(accessToken);

// Stubbed function for testing
exports._verifyIdToken = async (idToken) => {
  const ticket = await oAuth2Client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

/**
 *
 * Shape: iss, azp, aud(client id), sub(user google id), hd, email, email_verified, at_hash, name(given_name + family_name),
 * picture, given_name, family_name, locale, iat(in s), exp(in s)
 */
exports.verifyIdToken = async (ctx, idToken) => {
  const decoded = await this._verifyIdToken(idToken);

  if (decoded.aud !== process.env.GOOGLE_CLIENT_ID) {
    return ctx.throw(403, 'Malicious app detected');
  }
  if (!decoded.iss.includes('accounts.google.com')) {
    return ctx.throw(403, 'Token issuer is invalid');
  }
  if (
    ctx.cookies.get('accessToken') == undefined &&
    dateFns.isAfter(new Date().getTime() / 1000, decoded.exp)
  ) {
    return ctx.throw(403, 'ID token expired');
  }
  return decoded;
};
