//jshint esversion:6
require('dotenv').config();
const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
const bcrypt = require("bcrypt");
app.set("view engine" , "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public/"));

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema(
  {
    email : String ,
    password:String
  }
);
//const secret = "Thisismysecret..";
//userSchema.plugin(encrypt , {secret:process.env.SECRET , encryptedFields:['password']});
const saltRound =10;
const User = mongoose.model("User",userSchema);
app.get("/" , function(req , res){
  res.render("home");
});
app.get("/login" , function(req , res){
  res.render("login");
});
app.get("/register" , function(req , res){
  res.render("register");
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
  bcrypt.hash(req.body.password , saltRound , function(err , hash){
    const newUser = new User({
      email:req.body.username,
      password:hash
    });
    newUser.save(function(err){
      if(err){
        console.log(err);
      }
      else{
        res.render("secrets");
      }
    });
  });
  });

app.post("/login" , function(req , res){
  User.findOne({email : req.body.username} , function(err , foundUser){
    //console.log(foundUser);
    if(foundUser){
      bcrypt.compare(req.body.password , foundUser.password , function(err ,result){

        if(result){
          res.render("secrets");
        }

      });
    }
       //console.log(req.body.password);
      // console.log(foundUser.password);
        // else{
        //   alert("Incorrect username or password");
        // }
      // else{
      //   alert("Account not found Please register");
      // }
  });
  });



app.listen(3000 , function(){
  console.log("Server started on port 3000");
});
