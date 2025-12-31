const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

//POST /tour/122dfsd/reviews
//GET /tour/122dfsd/reviews
//POST /reviews
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReviews
  );

router
  .route("/:id")
  .delete(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.deleteReview
  )
  .patch(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.updateReview
  );

module.exports = router;
