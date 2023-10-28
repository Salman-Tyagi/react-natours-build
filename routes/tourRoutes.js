import express from 'express';
import * as tourController from '../controllers/tourController.js';
import * as authController from '../controllers/authController.js';
import reviweRouter from './reviewRoutes.js';

const router = express.Router();

// router
//   .route('/top-5-tours')
//   .get(tourController.aliasTour, tourController.getAllTours);

router
  .route('/tour-stats')
  .get(
    authController.protect,
    authController.restrictedTo('admin'),
    tourController.getTourStats
  );
router.route('/monthly-plans/:year').get(tourController.getMonthlyPlans);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictedTo('admin'),
    tourController.createTour
  );

router.get('/tour/:slug', tourController.getTourBySlug);

router
  .route('/tours-within/:distance/center/:latlng')
  .get(tourController.toursWithin);

router.route('/distances/:latlng').get(tourController.getDistances);

router.use(authController.protect);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.restrictedTo('admin'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(authController.restrictedTo('admin'), tourController.deleteTour);

router.use('/:tourId/reviews', reviweRouter);

export default router;
