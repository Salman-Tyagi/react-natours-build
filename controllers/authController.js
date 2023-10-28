import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import email from '../utils/email.js';

export const signToken = id => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    // secure: true,
    httpOnly: true,
    secure: req.secure,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: user,
  });
};

// SIGNUP =>>>>>>>>>>>>>>>>>>>>>>>
// ======================================================

export const signup = catchAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  user.active = undefined;
  user.role = undefined;
  user.password = undefined;

  const verifyToken = '123456';
  const verifyUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/verify/${verifyToken}`;

  try {
    await email({
      email: user.email,
      subject: 'Welcome to the Natours family',
      html: `<div
      style="
        display: flex;
        flex-direction: column;
        align-items: start;
        font-family: sans-serif;
        max-width: 30rem;
        color: #333;
      "
    >
      <p style="margin-bottom: 0.5rem; font-size: 1.5rem; color: #333">
        Hi <span style="color: #7dd56f">${user.name},</span>
      </p>
      <p style="font-size: 1.2rem; margin-bottom: 0.5rem">
        We are happy to have you as a valuable customer in our family.
      </p>
      <p style="font-size: 1.2rem; margin-bottom: 2rem">
        Please verify your account by simply click on
        'Verify account'
      </p>
      <a
        style="
          text-decoration: none;
          color: #fff;
          font-size: 1.2rem;
          border-radius: 10rem;
          padding: 0.5rem 1rem;
          background-image: linear-gradient(to right, #7dd56f, #28b487);
          margin-bottom: 1rem;
        "
        href="${verifyUrl}"
      >
        Verify account
      </a>

      <hr />
      <div
        style="
          font-size: 1rem;
          display: flex;
          flex-direction: column;
          color: #777;
        "
      >
        <p style="margin-bottom: -0.6rem">Sincerely,</p>
        <p>${process.env.EMAIL_FROM}</p>
      </div>
    </div>`,
    });

    res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
    });
  } catch (err) {
    // console.log(err.response.body);
    res.status(201).json({
      status: 'success',
      message: 'Account create success',
    });
  }
});

export const login = catchAsync(async (req, res, next) => {
  // Check email and password are exists
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check user and password are valid
  const user = await User.findOne({ email, active: { $ne: false } }).select(
    '+password -__v'
  );

  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // user.role = undefined;
  user.active = undefined;
  user.password = undefined;

  // If everything ok, send the token to client
  createSendToken(user, 200, req, res);
});

export const protect = catchAsync(async (req, res, next) => {
  // Get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    return next(
      new AppError('You are not logged in! Please login to get access.', 401)
    );

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check user still exists after verify token
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('No user exists for this token', 404));
  }

  // Check user changed the password after verifying the token
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  // Grant access to the user
  req.user = currentUser;
  return next();
});

export const isLoggedIn = async (req, res, next) => {
  // Get token and check if it's there

  if (req.cookies.jwt) {
    try {
      // Verify token
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      // Check user still exists after verify token
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // Check user changed the password after verifying the token
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        res.cookie('jwt', '');
        res.redirect('/login');
      }

      // Grant access to the user
      req.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  return next();
};

export const haveUser = (req, res, next) => {
  // 1. If if jwt is exist
  // 2. If invalidate jwt --> remove cookie and redirect to login
  // 3. Move it to next middleware
  if (!req.cookies.jwt) return res.redirect('/login');
  next();
};

export const logout = async (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const restrictedTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are forbidden to do this action!', 403));
    }

    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on the posted email
  const user = await User.findOne({ email: req.body.email }).select(
    '-createdAt -passwordChangedAt -passwordResetToken'
  );
  if (!user) return next(new AppError('Incorrect email address', 404));

  // Generate a random token using inbuilt node crypto module
  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/reset-password/${token}`;

  try {
    await email({
      email: user.email,
      subject: 'Your password reset link valid for 10 minutes',
      html: `<div
      style="
        display: flex;
        flex-direction: column;
        align-items: start;
        font-family: sans-serif;
        max-width: 30rem;
        color: #333;
      "
    >
      <p style="margin-bottom: 0.5rem; font-size: 1.5rem; color: #333">
        Hi <span style="color: #7dd56f">${user.name},</span>
      </p>
      <p style="font-size: 1.2rem; margin-bottom: 0.5rem">
        We received a request to reset your Natours account password.
      </p>
      <p style="font-size: 1.2rem; margin-bottom: 2rem">
        If you're sure to reset your
        <span style="color: #28b487">${user.email}</span> account password,
        click 'Reset my password'
      </p>
      <a
        style="
          text-decoration: none;
          color: #fff;
          font-size: 1.2rem;
          border-radius: 10rem;
          padding: 0.5rem 1rem;
          background-image: linear-gradient(to right, #7dd56f, #28b487);
          margin-bottom: 1rem;
        "
        href="${resetUrl}"
      >
        Reset my password
      </a>

      <hr />
      <div
        style="
          font-size: 1rem;
          display: flex;
          flex-direction: column;
          color: #777;
        "
      >
        <p style="margin-bottom: -0.6rem">Sincerely,</p>
        <p>${process.env.EMAIL_FROM}</p>
      </div>
    </div>`,
    });

    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
    });
  } catch (err) {
    // console.log(err.response.body);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      message: 'Email sent',
    });
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // Check user exists and token not expired, then set the password
  if (!user) {
    return next(new AppError('Your password reset link has expired', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  user.password = undefined;
  user.passwordChangedAt = undefined;

  // Update the passwordChangedAt property method

  // Log in the user, send JWT
  createSendToken(user, 201, req, res);
});
