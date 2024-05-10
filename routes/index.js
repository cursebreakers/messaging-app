const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it')();
const jwt = require('jsonwebtoken');

const authControl = require('../controllers/auth')
const threadControl = require('../controllers/thread')
const { User, Thread } = require('../models/appModels');


/* GET root: Redirect to inbox */
router.get('/', function(req, res, next) {
  res.redirect('/inbox');
});


/* GET Log in page. */
router.get('/auth', function(req, res, next) {
  res.render('auth', { title: 'Log in' });
});

/* GET sign up page. */
router.get('/auth/new', function(req, res, next) {  
  res.render('signup', { title: 'Sign up' });
});

/* POST log in */
router.post('/auth/in', authControl.auth_in)

/* POST log out */
router.post('/auth/out', authControl.auth_out)

/* POST new user signup */
router.post('/auth/new', authControl.new_auth)

// GET inbox
router.get('/inbox', authControl.checkAuth, authControl.get_inbox);

/* GET docs/README page */
router.get('/docs', function(req, res, next) {

  const readmePath = path.join(__dirname, '../README.md');

  fs.readFile(readmePath, 'utf8', (err, data) => {
    if (err) {
      next(err);
    } else {
      const markdownContent = markdownIt.render(data);
      res.render('docs', { title: 'Docs', markdownContent });
    }
  });
});

/* GET status update view */
router.get('/settings', authControl.checkAuth, async function(req, res, next) {
  try {
      const token = req.cookies.token;
      if (!token) {
          return res.status(401).json({ message: 'Unauthorized' });
      }

      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decodedToken.userId;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      res.render('settings', { title: 'Settings', user });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST account updates
router.post('/status', authControl.checkAuth, threadControl.status_update)
router.post('/bio', authControl.checkAuth, threadControl.bio_update)
router.post('/link', authControl.checkAuth, threadControl.link_update)

// POST new thread
router.post('/thread/new', authControl.checkAuth, threadControl.new_thread)

// Keep at bottom or routes will break!!!

/* GET message thread */
router.get('/thread/:id', authControl.checkAuth, threadControl.spec_thread);

/* POST message to thread */
router.post('/thread/:id', authControl.checkAuth, threadControl.thread_message);

/* GET Profile (will change to /:username) */
router.get('/:username', threadControl.user_profile)

module.exports = router;
