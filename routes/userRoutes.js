import express from 'express';

const router = express.Router();


import UserController from '../controllers/userController.js'

import { registerSchema, verifyEmailSchema,loginSchema } from '../validation/userValidation.js';
import { validateRequest } from '../middlewares/validateRequest.js';        
import passport from 'passport';
import accessTokenAutoRefresh from '../middlewares/accessTokenAutoRefresh.js';


router.post('/register', validateRequest(registerSchema),UserController.userRegistration);

router.post('/verify-email',validateRequest(verifyEmailSchema,loginSchema),UserController.verifyEmail)


router.post('/login',UserController.userLogin)
router.post('/refresh-token',UserController.getNewAccessToken)
router.post('/reset-password-link', UserController.sendUserPasswordResetEmail)
router.post('/reset-password/:id/:token',UserController.userPasswordReset)
//protected routes
//router.get('/profile',passport.Authenticator('jwt',{session : false}),UserController.userProfile)
router.get('/me',accessTokenAutoRefresh,passport.authenticate('jwt', { session: false }), UserController.userProfile);
router.post('/change-password',accessTokenAutoRefresh,passport.authenticate('jwt', { session: false }), UserController.changePassword);
router.post('/logout',accessTokenAutoRefresh,passport.authenticate('jwt', { session: false }), UserController.userLogout);
router.get('/get-all-users',UserController.getAllusers);
router.get('/get-user/:id', UserController.getUsersById);
router.put('/update-user/:id',UserController.updateUserById)
// Google OAuth routes

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
}));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Google login failed', error: err.message });
    }
    if (!user) {
      return res.status(401).json({ success: false, message: 'No user returned from Google' });
    }
    return res.status(200).json({ success: true, user });
  })(req, res, next);
});
export default router;