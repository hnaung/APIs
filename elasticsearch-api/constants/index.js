exports.ERROR_CODE = {
  ER_DUP_ENTRY: 'ER_DUP_ENTRY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

const cookieTestExp = 3 * 1000; // 3 seconds
const cookieDefaultExp = 30 * 24 * 60 * 60 * 1000; // 30 days

exports.COOKIE_OPTIONS = {
  maxAge: process.env.NODE_ENV === 'test' ? cookieTestExp : cookieDefaultExp,
  // secure: true,
  signed: true,
  httpOnly: true,
  overwrite: true,
};

exports.DISTANCE_UNITS = 'km';

exports.MAX_BUFFER = 1024 * 1024;
exports.MAX_CUISINES_BUCKETS = 200;

exports.ALIASES = {
  RESTAURANTS: 'restaurantAlias',
};
