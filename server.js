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
  GetNewsSites, DeleteNewsSites, UpdateNewsSites, GetUpdateNewsSitesForm } = require('./routes/router_newssites');

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
app.get('/Login', checkNotAuthenticated, GetLoginPage);
app.post('/Login', checkNotAuthenticated, passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));
app.get('/register', checkNotAuthenticated, GetRegister);
app.post('/register', checkNotAuthenticated, PostRegister);
app.delete('/logout', Logout);
app.get("/NewsSite/All", checkAuthenticated, GetNewsSites);
app.get("/NewsSite/Create", checkAuthenticated, GetCreateNewsSite);
app.post("/NewsSite/Create", checkAuthenticated, PostCreateNewsSite);
app.delete('/NewsSite/Delete/:id', checkAuthenticated, DeleteNewsSites);
app.get('/NewsSite/Update/:id', checkAuthenticated, GetUpdateNewsSitesForm);
app.post('/NewsSite/Update/:id', checkAuthenticated, UpdateNewsSites);
app.use('/admin/queues', checkAuthenticated, Router);

StartProcesses();

app.listen(process.env.PORT, '0.0.0.0', () => {
  console.log("Connected !");
})
