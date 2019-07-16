// Define global types for controller
type CtxResponseBody = string | Buffer | object | boolean | null;
type CtxThrow = (status?: number, msg?: string | object, properties?: object) => void;
type CtxCookiesSet = (name: string, value: any, options?: object) => void;
interface CtxCookies {
  set: CtxCookiesSet;
}

// Base interface for all controllers
interface BaseCtx {
  body: CtxResponseBody;
  throw: CtxThrow;
  cookies: CtxCookies;
}

// Auth
interface IsEmailTakenQuery {
  email: string;
}

export interface IsEmailTakenContext extends BaseCtx {
  query: IsEmailTakenQuery;
}

interface RegisterRequestBody {
  firstName: string;
  lastName: string;
  phoneNumber: number;
  email: string;
  password: string;
}

interface RegisterRequest {
  body: RegisterRequestBody;
}

export interface RegisterContext extends BaseCtx {
  request: RegisterRequest;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface LoginRequest {
  body: LoginRequestBody;
}

export interface LoginContext extends BaseCtx {
  request: LoginRequest;
}

interface GoogleMobileRequestBody {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  phoneNumber: string;
  accessToken: string;
  refreshToken: string;
}

interface GoogleMobileRequest {
  body: GoogleMobileRequestBody;
}

export interface GoogleMobileContext extends BaseCtx {
  request: GoogleMobileRequest;
}

interface GoogleWebRequestBody {
  code: string;
}

interface GoogleWebRequest {
  body: GoogleWebRequestBody;
}

export interface GoogleWebContext extends BaseCtx {
  request: GoogleWebRequest;
}

interface FacebookRequestBody {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  phoneNumber: string;
  accessToken: string;
  isMobile: boolean;
}

interface FacebookRequest {
  body: FacebookRequestBody;
}

export interface FacebookContext extends BaseCtx {
  request: FacebookRequest;
}

interface EmailVerificationBody {
  email: string;
  firstName: string;
  isResend?: boolean;
}

interface EmailVerificationRequest {
  body: EmailVerificationBody;
}

export interface EmailVerificationContext extends BaseCtx {
  request: EmailVerificationRequest;
}

export interface VerifyEmailContext extends BaseCtx {
  request: {
    body: {
      email: string;
    };
  };
}

/**
 * profile
 */
export interface UpdateUserProfileContext extends BaseCtx {
  request: {
    body: {
      email: string;
      provider: string;
      firstName?: string;
      lastName?: string;
      picture?: string;
      phoneNumber?: string;
    };
  };
}

export interface GetVerificationStatusContext extends BaseCtx {
  query: {
    email: string;
  };
}

export interface UpdatePreferencescontext extends BaseCtx {
  request: {
    body: {
      email: string;
      preferences: {
        cuisines?: string[];
        atmosphere?: string[];
        dietary?: string[];
      };
    };
  };
}
