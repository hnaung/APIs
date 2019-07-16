export const ERROR_CODE = {
  ER_DUP_ENTRY: 'ER_DUP_ENTRY',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
};

export const VALIDATORS = {
  password: {
    min: 6,
    max: 56, // https://www.usenix.org/legacy/events/usenix99/provos/provos_html/node4.html
  },
  email: {
    min: 3,
  },
  firstName: {
    min: 1,
  },
  lastName: {
    min: 1,
  },
  preferredName: {
    min: 1,
  },
};

export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const cookieTestExp = 3 * 1000; // 3 seconds
const cookieDefaultExp = 30 * 24 * 60 * 60 * 1000; // 30 days

export const COOKIE_OPTIONS = {
  maxAge: process.env.NODE_ENV === 'test' ? cookieTestExp : cookieDefaultExp,
  // secure: true,
  signed: true,
  httpOnly: true,
  overwrite: true,
};
