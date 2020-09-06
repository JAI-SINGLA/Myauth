//jshint esversion:6
require('dotenv').config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
//const bcrypt = require("bcrypt");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public/"));
app.use(session({
  secret: process.env.SECRET,
  saveUninitialized: false,
  resave: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.set('useCreateIndex', true);

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});




const userSchema = new mongoose.Schema(
  {
    email : String,
    password:String,
    googleId: String,
    secret:String
  }
);
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// use static serialize and deserialize of model for passport session support
const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.get("/" , function(req , res){
  res.render("home");
});
app.get("/login" , function(req , res){
  res.render("login");
});
app.get("/register" , function(req , res){
  res.render("register");
});
app.get("/secrets" , function(req , res){

  // if(req.isAuthenticated()){
  User.find({secret:{$ne : null}} , function(err , foundUsers){

    res.render("secrets" ,{ourSecrets:foundUsers});
  });
  // }
  // else{
  //   res.redirect("/login");
  // }

});
app.get("/logout" , function(req , res){
  req.logout();
  res.redirect("/");
});
app.get("/submit" , function(req , res){
  if(req.isAuthenticated()){
    res.render("submit");
  }
  else{
    res.redirect("/login");
  }
});
app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.post("/register" , function(req , res){
  User.register({username:req.body.username},req.body.password, function(err, user) {
  if (err) {
    console.log(err);
    res.redirect("/register");
  }
  else{
        passport.authenticate('local')(req , res , function(){
          res.redirect("/secrets");
        });
        }
    // Value 'result' is set to false. The user could not be authenticated since the user is not active
  });
});

app.post("/login" , function(req , res){
  const user = new User({
    username:req.body.username,
    password:req.password
  });
  req.login(user , function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }
    else{
      passport.authenticate('local')(req , res , function(){
        res.redirect("/secrets");
      });
    }
  });
// app.post('/login',
//   passport.authenticate('local', { successRedirect: '/secrets',
//                                    failureRedirect: '/login' }));

       //console.log(req.body.password);
      // console.log(foundUser.password);
        // else{
        //   alert("Incorrect username or password");
        // }
      // else{
      //   alert("Account not found Please register");
      // }
  });

app.post("/submit" , function(req , res){
  if(req.isAuthenticated()){
    const submittedSecret = req.body.secret;
      User.findById(req.user.id ,function(err , foundUser){
        foundUser.secret=submittedSecret;
        foundUser.save(function(){
              res.redirect("/secrets");
        });
  });
    }
    else{
      res.redirect("/login");
    }
});

app.listen(3000 , function(){
  console.log("Server started on port 3000");
});
