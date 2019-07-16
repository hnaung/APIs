import * as Router from 'koa-router';
const router = new Router();

import * as controllers from '../controllers';
import * as profileControllers from '../controllers/profile';
import * as validator from '../utils/validate';

router.get('/health', (ctx) => {
  ctx.body = {
    status: 'identity service is up and running!',
  };
});

// auth
router.post('/register', validator.validateRegister, controllers.register);
router.post('/login', <Router.IMiddleware>controllers.login);
router.get('/is-email-taken', controllers.isEmailTaken);
router.post('/auth/google-web', <Router.IMiddleware>controllers.signInWithGoogleWeb);
router.post('/auth/google-mobile', <Router.IMiddleware>controllers.signInWithGoogleMobile);
router.post('/auth/facebook', <Router.IMiddleware>controllers.signInWithFacebook);
router.post('/auth/email-verification', <Router.IMiddleware>controllers.emailVerification);

// profile
router.patch('/verification', <Router.IMiddleware>profileControllers.verifyEmail);
router.get('/verification', <Router.IMiddleware>profileControllers.getVerificationStatus);
router.patch('/profile', <Router.IMiddleware>profileControllers.updateUserProfile);
router.patch('/preferences', <Router.IMiddleware>profileControllers.updatePreferences);

export default router;
