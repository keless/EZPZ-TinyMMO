const express = require('express')
const router = express.Router()
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Game Lobby
router.get('/lobby', ensureAuthenticated, (req, res) =>
  res.render('lobby', {
    user: req.user
  })
);

module.exports = router;