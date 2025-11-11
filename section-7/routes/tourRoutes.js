const express = require('express');
const tourController = require('../controllers/tourController');

const router = express.Router();

//router.param is use for: 
// Validating parameters (checking if an ID exists or is valid)
//Preprocessing data before the main route handler runs
router.param('id', tourController.checkID );

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
