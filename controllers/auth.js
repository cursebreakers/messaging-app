// Auth controller - auth.js

const expressAsyncHandler = require('express-async-handler');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const validator = require('validator');

const { User, Thread } = require('../models/appModels'); 

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};
  
const jwtStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      const user = await User.findById(payload.id);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
});

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

exports.checkAuth = (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
        return res.redirect('/auth');
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next(); 
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.redirect('/auth');
        } else {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
};
  
exports.get_inbox = expressAsyncHandler(async (req, res) => {

    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        console.log('user decoded:', userId)

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const threads = await Thread.find({ party: userId }).populate('party', 'username').populate('messages');

        const userObjects = { username: user.username, status: user.status, inbox: threads };
        console.log('Inbox found:', userObjects)
        res.render('index', { title: 'Inbox', userObjects});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// POST user log in
exports.auth_in = expressAsyncHandler(async (req, res) => {

    try {

      await Promise.all([
          body('username').notEmpty().run(req),
          body('password').notEmpty().run(req),
      ]);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          return res.status(400).json({ message: 'Invalid submission' });
      }

      const { username, password } = req.body;
      const sanitizedUsername = validator.escape(username);
      const sanitizedPassword = validator.escape(password);

      const user = await User.findOne({ username: sanitizedUsername });
      if (!user) {
          return res.status(401).json({ message: 'Invalid username or password' });
      }

      const passwordMatch = await bcrypt.compare(sanitizedPassword, user.password);
      if (!passwordMatch) {
          return res.status(401).json({ message: 'Invalid username or password' });
      }
  
      const AuthedUser = user;

      const token = generateToken(AuthedUser._id);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      console.log('User authenticated:', AuthedUser.username, 'token:', token)

        
      return res.status(200).json({ message: 'Authenticated successfully.', user: AuthedUser.username, token: token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
});

exports.auth_out = (req, res) => {
    res.clearCookie('token', { httpOnly: true });
    res.status(200).json({ message: 'Logged out successfully.' });
};

/* POST new user sign up */
exports.new_auth = expressAsyncHandler(async (req, res) => {

    const { username, password } = req.body;

    try {

      await Promise.all([
        body('username')
          .isAlphanumeric()
          .isLength({ max: 24 })
          .custom(async (value) => {
            const existingUser = await User.findOne({ username: value.toLowerCase() });
            if (existingUser) {
              throw new Error('Username already exists');
            }
          })
          .run(req),
        body('password')
          .isLength({ min: 8, max: 32 })
          .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/)
          .run(req),
        body('confirmPassword')
          .custom((value, { req }) => {
            if (value !== req.body.password) {
              throw new Error('Passwords do not match');
            }
            return true;
          })
          .run(req),
      ]);

      const sanitizedUsername = validator.escape(username);
      const sanitizedPassword = validator.escape(password);
  
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg);
        return res.status(400).json({ message: errorMessages.join('. ') });
    }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(sanitizedPassword, saltRounds);
        
      const newUser = await User.create({ 
          username: sanitizedUsername.toLowerCase(), 
          password: hashedPassword,
          status: 'Hello, World!' 
        });
  
      const token = generateToken(newUser._id);

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', 
      });

      console.log('New user authenticated!', newUser, 'token:', token)

      return res.status(200).json({ message: 'User created successfully.', user: newUser.username, token: token });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
});



