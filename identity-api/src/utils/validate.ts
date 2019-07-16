import validator = require('validator');
import { ERROR_CODE, VALIDATORS } from '../constants';

export const validateRegister = async (ctx, next) => {
  const { firstName, lastName, phoneNumber, email, password } = ctx.request.body;
  const errors = [];

  if (!firstName) {
    errors.push('First name is required');
  }
  if (!lastName) {
    errors.push('Last name is required');
  }
  if (!phoneNumber) {
    errors.push('Phone number is required');
  }

  if (!email) {
    errors.push('Email is required');
  } else if (!validator.isEmail(email)) {
    errors.push('Email is invalid');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (
    !validator.isLength(password, {
      min: VALIDATORS.password.min,
      max: VALIDATORS.password.max,
    })
  ) {
    errors.push(
      `Password must be between ${VALIDATORS.password.min} and ${
        VALIDATORS.password.max
      } characters`
    );
  }

  // TODO: Use this for phone validation https://github.com/googlei18n/libphonenumber
  // if (!phone) {
  //   errors.push('Phone number is required');
  // } else if (!validator.isMobilePhone(phone)) {
  //   errors.push('Phone number is invalid');
  // }

  if (errors.length > 0) {
    return ctx.throw(400, errors.join(','), { type: ERROR_CODE.VALIDATION_ERROR });
  }

  await next();
};
