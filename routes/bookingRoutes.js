import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.post('/createBooking', bookingController.createBookingDB);

router.use(authController.protect);

router.get('/getKey', bookingController.getKey);
router.post('/checkout', bookingController.createOrder);

// router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.get('/', bookingController.getAllBookings);
router.get('/:userId', bookingController.getAllBookings);

// router.use(authController.restrictedTo('admin'));
// router.post('/', bookingController.createBooking);

// router
//   .route('/:id')
//   .patch(bookingController.updateBooking)
//   .delete(bookingController.deleteBooking);

export default router;
