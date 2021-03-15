if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express');
const app = express();

const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const { Router, StartProcesses } = require('./tasks/tasks');
const { GetCreateNewsSite, PostCreateNewsSite,
  GetNewsSites } = require('./routes/router_newssites');

const { GetLoginPage, GetRegister,
  PostRegister, Logout, GetHomePage } = require('./routes/router_auth');

const { checkAuthenticated,
  checkNotAuthenticated, addLoginFlag } = require('./middleware/middleware');

const initializePassport = require('./auth/passport-config');

initializePassport(passport);
app.set('view-engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
app.use(addLoginFlag);
app.get('/', GetHomePage);
app.get('/login', checkNotAuthenticated, GetLoginPage);
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));
app.get('/register', checkNotAuthenticated, GetRegister);
app.post('/register', checkNotAuthenticated, PostRegister);
app.delete('/logout', Logout);
app.get("/NewSite/All", checkAuthenticated, GetNewsSites);
app.get("/NewSite/Create", checkAuthenticated, GetCreateNewsSite);
app.post("/NewSite/Create", checkAuthenticated, PostCreateNewsSite);
app.use('/admin/queues', checkAuthenticated, Router);

//StartProcesses();
app.listen(process.env.PORT, () => {
  console.log("Connected !");
})
