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
    email : String ,
    password:String
  }
);
//const secret = "Thisismysecret..";
//userSchema.plugin(encrypt , {secret:process.env.SECRET , encryptedFields:['password']});
userSchema.plugin(passportLocalMongoose);

// use static serialize and deserialize of model for passport session support
//const saltRound =10;
const User = mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
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

  if(req.isAuthenticated()){
    res.render("secrets");
  }
  else{
    res.redirect("/login");
  }

});
app.get("/logout" , function(req , res){
  req.logout();
  res.redirect("/");
});




// app.post("/register" , function(req , res){
//   const newUser = new User({
//     email: req.body.username,
//     password : md5(req.body.password)
//   });
//   newUser.save(function(err){
//     if(err){
//       console.log(err);
//     }
//     else{
//       res.render("secrets");
//     }
//   })
// });
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



app.listen(3000 , function(){
  console.log("Server started on port 3000");
});
