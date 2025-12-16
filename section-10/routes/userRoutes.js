const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);


router
  .route('/')
  .get(authController.protect, authController.restrictTo('admin','lead-guide'), userController.getAllUsers)
  .post(authController.protect, userController.createUser);

router
  .route('/:id')
  .get(authController.protect, userController.getUser)
  .patch(authController.protect, userController.updateUser)
  .delete(authController.protect, userController.deleteUser);

module.exports = router;
