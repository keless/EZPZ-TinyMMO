const SERVER_PORT = process.env.port || 2000
const SHARED_SECRET = "tricksie hobitses"
const SESSION_COOKIE_NAME = "cookieMonster"
const COMPILE_CLIENT_SCRIPTS = false

const path = require('path')
const linvoDB = require('linvodb3')
const express = require('express')
const expressLayouts = require('express-ejs-layouts')
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');


// Minify client library
if (COMPILE_CLIENT_SCRIPTS) {
  console.log("begin minifying client scripts")
  console.time('generateClientEZPZ')
  require('./generateClientEZPZ')()
  console.timeEnd('generateClientEZPZ')
}


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
var expressSessionMiddleware = session({
  name:   SESSION_COOKIE_NAME,
  secret: SHARED_SECRET,
  resave: true,
  saveUninitialized: true
})

app.use(expressSessionMiddleware);

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

// Routes
app.use('/', require('./routes/index')) //
app.use('/user', require('./routes/user'))
app.use('/static', express.static(path.join(__dirname, '../client')))
app.use('/js', express.static(path.join(__dirname, '../client/js/')))
app.use('/model', express.static(path.join(__dirname, '../shared/model')))
app.use('/view', express.static(path.join(__dirname, '../client/js/view')))
app.use('/controller', express.static(path.join(__dirname, '../client/js/controller')))
app.use('/data', express.static(path.join(__dirname, '../shared/data')))
app.use('/gfx', express.static(path.join(__dirname, '../client/gfx')))

// Initialize socket protocol
const { ServerProtocol } = require('./networking/protocol.js')
var serv = require('http').Server(app)
var io = require('socket.io')(serv, {})
io.use((socket, next)=> {
  expressSessionMiddleware(socket.request, {}, next)
})
var protocol = new ServerProtocol(io)

// Start server
serv.listen(SERVER_PORT, ()=>{
  console.log("Started server on port " + SERVER_PORT)
  protocol.beginListening()
})


const User = require('./models/linvoUser')
var dumpUsers = function() {
  User.find({}, (err, docs)=>{
    docs.forEach(element => {
      console.log("User: " + element.email)
    });
  })
}

dumpUsers()