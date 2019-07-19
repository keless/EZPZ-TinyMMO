const SERVER_PORT = process.env.port || 2000
const SHARED_SECRET = "tricksie hobitses"
const SESSION_COOKIE_NAME = "cookieMonster"
const COMPILE_CLIENT_SCRIPTS = false

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

import path from 'path'
import linvoDB from 'linvodb3'
import express from 'express'
import expressLayouts from 'express-ejs-layouts'
import passport from 'passport'
import flash from 'connect-flash'
import session from 'express-session'


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
import configurePassport from './config/passport.js'
configurePassport(passport)

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
import indexRouter from './routes/index.js'
import userRouter from './routes/user.js'
app.use('/', indexRouter)
app.use('/user', userRouter)
app.use('/static', express.static(path.join(__dirname, '../static')))
app.use('/shared', express.static(path.join(__dirname, '../static/shared')))
app.use('/js', express.static(path.join(__dirname, '../static/client/')))
app.use('/data', express.static(path.join(__dirname, '../static/shared/data')))
app.use('/gfx', express.static(path.join(__dirname, '../static/gfx')))

// Initialize socket protocol
import ServerProtocol from './networking/protocol.js'
import http from 'http'
import socketIO from 'socket.io'
var serv = http.Server(app)
var io = socketIO(serv, {})
io.use((socket, next)=> {
  expressSessionMiddleware(socket.request, {}, next)
})
var protocol = new ServerProtocol(io)

// Start game simulation
import GameSimDatabaseConnector from './controllers/GameSimDatabaseConnector.js'
var gameSimDatabaseConnector = GameSimDatabaseConnector.instance

gameSimDatabaseConnector.startupFromDB((err)=>{
  if (err) {
    console.log("ERROR - could not start gameworld from database, abort starting server")
    return
  }

  // Start server
  serv.listen(SERVER_PORT, ()=>{
    console.log("Started server on port " + SERVER_PORT)
    protocol.beginListening()
  })
})

// Set up exit handling
function exitHandler(options, exitCode) {
  gameSimDatabaseConnector.flushToDB( (err)=>{
    if (options.cleanup) console.log('clean');
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
  })
}

function setExitHandlerFor( signal, params ) {
  params.signal = signal
  process.on(signal, exitHandler.bind(null, params));
}
//setExitHandlerFor('exit', { cleanup: true })
setExitHandlerFor('SIGINT', { exit: true })
setExitHandlerFor('SIGUSR1', { exit: true })
setExitHandlerFor('SIGUSR2', { exit: true })
setExitHandlerFor('uncaughtException', { exit: true })

/* debug 
const User = require('./models/linvoUser')
var dumpUsers = function() {
  User.find({}, (err, docs)=>{
    docs.forEach(element => {
      console.log("User: " + element.email)
    });
  })
}

dumpUsers()
*/