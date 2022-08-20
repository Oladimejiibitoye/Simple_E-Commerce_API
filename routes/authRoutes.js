const Router = require('express').Router();


const authController = require('../controllers/auth');


//routes
Router.post('/signup', authController.SignUp);
Router.patch('/sendotp/:userId', authController.SendOTP);
Router.post('/emailverification', authController.EmailVerification);
Router.post('/signin', authController.SignIn);
Router.post('/forgotpassword', authController.forgotPassword);
Router.post('/resetpassword/:token', authController.resetPassword)


module.exports = Router