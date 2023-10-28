import Tour from '../models/tourModel.js';
import Booking from '../models/bookingModel.js';
import * as factory from '../controllers/handlerFactory.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config({ path: 'server/.env' });

export const getKey = (req, res) => {
  res.status(200).json({
    status: 'success',
    key: process.env.RAZORPAY_KEY_ID,
  });
};

export const createOrder = async (req, res, next) => {
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const tour = await Tour.findOne({ slug: req.body.slug });

    const options = {
      amount: tour.price * 100,
      currency: 'INR',
    };

    const order = await instance.orders.create(options);

    res.status(200).json({
      status: 'success',
      order: { ...order, user: req.user },
    });
  } catch (err) {
    next(err);
  }
};

export const createBookingDB = async (req, res, next) => {
  try {
    const { tour, user, price } = req.query;
    const {
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature,
    } = req.body;

    // Verify payment
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    if (generatedSignature === razorpay_signature) {
      await Booking.create({
        paymentId,
        orderId,
        user,
        tour,
        price: price / 100,
      });

      res.redirect(`FRONT_END_URL/payments?status=${true}&order=${orderId}`);
    } else {
      const {
        error: { code, description },
      } = req.body;

      res.redirect(
        `FRONT_END_URL/payments?status=${false}&code=${code}&err=${description}`
      );
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err });
  }
};

export const getAllBookings = factory.getAll(Booking);
export const getBooking = factory.getOne(Booking);
export const createBooking = factory.createOne(Booking);
export const updateBooking = factory.updateOne(Booking);
export const deleteBooking = factory.deleteOne(Booking);
