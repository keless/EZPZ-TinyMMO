//const express = require('express')
import express from 'express'
const indexRouter = express.Router()
//const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
import { ensureAuthenticated, forwardAuthenticated } from '../config/auth.js'

// Welcome Page
indexRouter.get('/', forwardAuthenticated, (req, res) => res.render('welcome'))

// Game Lobby
indexRouter.get('/lobby', ensureAuthenticated, (req, res) =>
  res.render('lobby', {
    user: req.user
  })
)

//module.exports = router;
export default indexRouter