import multer from 'multer';
import sharp from 'sharp';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as factory from './handlerFactory.js';
import { signToken } from './authController.js';

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users/');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload only images!', 400), false);
  }
};

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user._id}${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

export const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const allowedFields = (obj, ...fields) => {
  const Objnew = {};
  Object.keys(obj).forEach(key => {
    if (fields.includes(key)) {
      Objnew[key] = obj[key];
    }
  });
  return Objnew;
};

export const updateMyPassword = catchAsync(async (req, res, next) => {
  // Get user based on the login
  const updatedUser = await User.findById(req.user.id).select('+password');

  // Verify the posted current password and update the newpassword
  const currentPassword = req.body.currentPassword;
  if (!currentPassword)
    return next(new AppError('Please enter current password', 400));

  if (
    !(await updatedUser.correctPassword(currentPassword, updatedUser.password))
  ) {
    return next(new AppError('Your current password is incorrect', 400));
  }

  updatedUser.password = req.body.password;
  updatedUser.passwordConfirm = req.body.passwordConfirm;
  await updatedUser.save();

  const token = signToken(updatedUser._id);
  res.cookie('jwt', token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  res.status(201).json({
    status: 'success',
    data: updatedUser,
  });
});

export const createUser = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'This route is not defined please use /signup instead',
  });
};

export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);

// Do not update password from this handler please use signup
export const updateUser = factory.updateOne(User);
export const deleteUser = factory.deleteOne(User);

export const getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;

  next();
});

export const updateMe = catchAsync(async (req, res, next) => {
  // Send error if client update password from middleware
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('To change password please use /update-my-password', 400)
    );
  }
  // Remove the obj except name and email
  const filteredObj = allowedFields(req.body, 'name', 'email');

  if (req.file) {
    filteredObj.photo = req.file.filename;
  }

  // Get user based on login and update user
  const user = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({
    status: 'success',
    data: user,
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  // Verify the user password and delete
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError('Incorrect password', 400));
  }

  user.deleteLoggedinUser();
  user.save({ validateBeforeSave: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
