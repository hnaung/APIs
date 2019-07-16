import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

const privateKey = Buffer.from(process.env.PRIVATE_KEY, 'base64').toString('utf-8');

const saltRounds = 10;

/**
 * @param {object} payload JWT payload
 * @param {boolean} isAccessToken true for generating access token, false for refresh token
 */
export const signToken = (payload, isAccessToken = true) => {
  return new Promise((resolve, reject) => {
    const expiresIn = isAccessToken
      ? process.env.ACCESS_TOKEN_LIFETIME
      : process.env.REFRESH_TOKEN_LIFETIME;

    jwt.sign(payload, privateKey, { expiresIn, algorithm: 'RS256' }, (err, token) => {
      if (err) {
        return reject(err);
      }
      resolve(token);
    });
  });
};

export const hash = async (password, rounds = saltRounds) => {
  return bcrypt.hash(password, rounds);
};

export const compare = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
