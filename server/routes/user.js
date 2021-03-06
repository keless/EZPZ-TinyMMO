/*const express = require('express')
const passport = require('passport')
const bcrypt = require('bcryptjs')
const router = express.Router()
const User = require('../models/linvoUser')*/
import express from 'express'
import passport from 'passport'
import bcrypt from 'bcryptjs'
const userRouter = express.Router()
import User from '../models/linvoUser.js'

// Login page
userRouter.get('/login', (req, res)=> {
    res.render('login')
})

// Register page
userRouter.get('/register', (req, res)=> {
    res.render('register')
})

// Register
userRouter.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    console.log("begin trying to register new user")
    User.findOne({ email: email }, ((findErr, user) => {
      if (user) {
        console.log("error: found existing user with that email")
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {

        console.log("save user with shadow password - " + password)
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(password, salt, (err, hash) => {
            if (err) throw err

            var newUser = new User()
            newUser.name = name
            newUser.email = email
            newUser.password = hash
            
            newUser.save((saveErr)=>{
              console.log("save new user " + newUser.email)
              if (saveErr) {
                console.log(saveErr)
                throw saveErr
              } else {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/user/login');
              }
            })
          })
        })
      }
    }))
  }
})

// Login
userRouter.post('/login', (req, res, next) => {
  console.log("passport will now authenticate")
  passport.authenticate('local', {
    successRedirect: '/lobby',
    failureRedirect: '/user/login',
    failureFlash: true
  })(req, res, next)
})

// Logout
userRouter.get('/logout', (req, res) => {
  req.logout()
  req.flash('success_msg', 'You are logged out')
  res.redirect('/user/login')
})

//module.exports = router
export default userRouter