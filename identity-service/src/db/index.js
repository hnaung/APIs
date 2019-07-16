const mysql = require('mysql2/promise');

let pool;

// TODO: Find a suitable way to manage queries instead of the manual way
exports.QUERIES = {
  // find
  findFacebookAccountById: `SELECT * FROM FacebookAccount WHERE id = ?`,
  findUserAccessById: `SELECT * FROM UserAccess WHERE id = ?`,
  findEmailAccountByEmail: `SELECT * FROM EmailAccount WHERE email = ?`,
  findGoogleAccountById: `SELECT * FROM GoogleAccount WHERE id = ?`,
  findUserProfileById: `SELECT * FROM UserProfile WHERE user_id = ?`,
  findUserProfileByEmail: `SELECT * FROM UserProfile WHERE display_email = ?`,
  findVerifiedByEmail: `SELECT created_at, is_email_verified FROM UserProfile WHERE display_email = ?`,
  // update
  updateProfileEmailVerified: `UPDATE UserProfile SET is_email_verified = 1, email_verified_date = ? WHERE display_email = ?`,
  updateUserProfileNameEmail: `UPDATE UserProfile SET display_email = ?, display_first_name = ?, display_last_name = ?, updated_at = DEFAULT WHERE user_id = ?`,
  updateUserProfile: `UPDATE UserProfile SET display_email = ?, display_first_name = ?, display_last_name = ?, display_picture = ?, phone_number = ?, updated_at = DEFAULT WHERE user_id = ?`,
  updateUserProfileByEmail: `UPDATE UserProfile SET display_first_name = ?, display_last_Name = ?, phone_number = ? WHERE display_email = ?`,
  updateUserAccessProvider: `UPDATE UserAccess SET logged_in_provider = ? WHERE id = ?`,
  updateUserAccessEmailId: `UPDATE UserAccess SET email_account_id = ? WHERE id = ?`,
  updateGoogleAccountTokens: `UPDATE GoogleAccount SET access_token = ?, refresh_token = ? WHERE id = ?`,
  updateFacebookAccountWebToken: `UPDATE FacebookAccount SET web_long_lived_token = ? WHERE id = ?`,
  updateFacebookAccountMobileToken: `UPDATE FacebookAccount SET mobile_long_lived_token = ? WHERE id = ?`,
  updateGoogleAccountByEmail: `UPDATE GoogleAccount SET first_name = ?, last_name = ? WHERE email = ?`,
  updateFacebookAccountByEmail: `UPDATE FacebookAccount SET first_name = ?, last_name = ? WHERE email = ?`,
  updateEmailAccountByEmail: `UPDATE EmailAccount SET first_name = ?, last_name = ? WHERE email = ?`,
  // insert
  insertUserAccess: `INSERT INTO UserAccess(id, email_account_id, facebook_account_id, google_account_id, refresh_token, logged_in_provider) VALUES(?, ?, ?, ?, ?, ?)`,
  insertFacebookAccount: `INSERT INTO FacebookAccount(id, user_id, email, first_name, last_name, picture, web_long_lived_token, mobile_long_lived_token) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
  insertUserProfile: `INSERT INTO UserProfile(user_id, display_email, display_first_name, display_last_name, display_picture, phone_number) VALUES(?, ?, ?, ?, ?, ?)`,
  insertUserProfileVerified: `INSERT INTO UserProfile(user_id, display_email, display_first_name, display_last_name, display_picture, phone_number, is_email_verified, email_verified_date) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
  insertEmailAccount: `INSERT INTO EmailAccount(user_id, email, first_name, last_name, password) values(?, ?, ?, ?, ?)`,
  insertGoogleAccount: `INSERT INTO GoogleAccount(id, user_id, email, first_name, last_name, picture, access_token, refresh_token) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
};

exports.PROVIDERS = {
  email: 'EMAIL',
  facebook: 'FACEBOOK',
  google: 'GOOGLE',
};

exports.connect = async () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
};

exports.getPool = () => pool;

/**
 * Manually acquire a connection
 * conn.release() to release connection
 */
exports.getConnection = async () => pool.getConnection();

/**
 * @param {string} querystring
 * @param {array} args
 */
exports.query = async (querystring, args = []) => this.getPool().query(querystring, args);

/**
//  * @param {connection} conn from getConnection()
 * @param {string} querystring
 * @param {array} args
 */
exports.singleConnQuery = async (conn, querystring, args = []) => conn.query(querystring, args);

/**
//  * @param {connection} conn from getConnection()
 */
exports.releaseConnection = (conn) => {
  conn.release();
};

exports.endPool = async () => pool.end();
