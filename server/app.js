const SERVER_PORT = process.env.port || 2000
const SHARED_SECRET = "tricksie hobitses"


const path = require('path')
const linvoDB = require('linvodb3')
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');

// DB Config
linvoDB.dbPath = process.cwd() + "/db"

// Passport Config
require('./config/passport')(passport);

var app = express()

// EJS
app.use(expressLayouts)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: SHARED_SECRET,
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

// client javascript concatenation
const clientEZPZ = require('../client/clientEZPZ')

// Routes
app.use('/', clientEZPZ, require('./routes/index')) //
app.use('/user', require('./routes/user'))


// Start server
app.listen(SERVER_PORT, ()=>{
    console.log("Started server on port " + SERVER_PORT)
})
