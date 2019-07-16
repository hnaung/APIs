/* eslint-disable object-property-newline */
const crypto = require('crypto')

const dateFns = require('date-fns')

/**
 * Mock google token
 *
 */
const googleIss = 'https://accounts.google.com'

const validToken = {
  aud: process.env.GOOGLE_CLIENT_ID,
  iss: googleIss,
  exp: dateFns.addMinutes(new Date(), 1),
  email: 'test@test.com',
  firstName: 'darth',
  lastName: 'vader',
  given_name: 'darth',
  family_name: 'vader',
  id: '1234567890',
  sub: '1234567890',
  picture: 'profile picture url'
}

exports.idToken = {
  valid: validToken,
  invalidAud: {
    ...validToken,
    aud: 'maliciousapp.com',
  },
  invalidIss: {
    ...validToken,
    iss: 'another issuer',
  },
  invalidExp: {
    ...validToken,
    exp: dateFns.addSeconds(new Date(), -1).getTime() / 1000,
  },
}

/**
 * Mock user
 */

const countryCodes = ['65', '852', '64', '33']
const getCountrycode = () => countryCodes[Math.floor(Math.random() * countryCodes.length)]
const getPhoneNumber = numDigits => {
  const numbers = []
  for (let i = 0; i < numDigits; i++) {
    numbers.push(Math.floor(Math.random() * 10))
  }
  return numbers.join('')
}

exports.getUser = () => ({
  email: 'hanchiang.yap@gourmetplus.com',
  password: '12345678',
  firstName: 'darth',
  lastName: 'vader',
  countryCode: getCountrycode(),
  phoneNumber: getPhoneNumber(8),
  languageCode: 'en',
  locale: 'en-us',
  picture: 'profile picture',
  id: 'cfe19c4a-8dd3-4012-bfb3-8a47ec001ebb',
})

exports.getUuid = () => '1'

const generateAccessToken = () => crypto.randomBytes(48).toString('hex')

exports.getFacebookMobileUser = () => ({
  id: 'facebook id',
  email: 'face@book.com',
  firstName: 'facebook',
  lastName: 'user',
  picture: 'profile picture url',
  phoneNumber: '12345678',
  accessToken: generateAccessToken(),
  isMobile: true,
})

exports.getFacebookWebUser = () => ({
  id: 'facebook id',
  email: 'face@book.com',
  firstName: 'facebook',
  lastName: 'user',
  picture: 'profile picture url',
  phoneNumber: '12345678',
  accessToken: generateAccessToken(),
  isMobile: false,
})

/**
 * preferences
 */

 exports.preferences = {
   cuisines: ["italian", "french", "asian fusion"],
   atmosphere: ["family friendly", "free wifi"],
   dietary: ["no pork", "no lard"]
 }