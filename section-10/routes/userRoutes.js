const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const {loginLimiter,signupLimiter,forgotPasswordLimiter } = require('../utils/limiters');


const router = express.Router();

router.post('/signup', signupLimiter, authController.signup);
router.post('/login',loginLimiter, authController.login);

router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/updateMyPassword',authController.protect, authController.UpdatePassword);


router.patch('/updateMe',authController.protect, userController.updateMe);
router.delete('/deleteMe',authController.protect, userController.deleteMe);


router
  .route('/')
  .get(authController.protect, userController.getAllUsers)
  .post(authController.protect, userController.createUser);

router
  .route('/:id')
  .get(authController.protect, userController.getUser)
  .patch(authController.protect, userController.updateUser)
  .delete(authController.protect, userController.deleteUser);

module.exports = router;
