//const LocalStrategy = require('passport-local').Strategy;
//const bcrypt = require('bcryptjs');
import PassportLocal from 'passport-local'
const LocalStrategy = PassportLocal.Strategy
import bcrypt from 'bcryptjs'

// Load User model
//const User = require('../models/linvoUser')
import User from '../models/linvoUser.js'

//module.exports = function(passport) {
export default function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      console.log("search for user " + email)
      User.findOne({ email: email }, (findErr, user) => {
        if (findErr) {
          return done(null, false, { message: findErr })
        }

        if (!user) {
          return done(null, false, { message: 'That email is not registered' })
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err
          if (isMatch) {
            return done(null, user)
          } else {
            return done(null, false, { message: 'Password incorrect' })
          }
        })
      })
    })
  )

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  })

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user)
    })
  })
}