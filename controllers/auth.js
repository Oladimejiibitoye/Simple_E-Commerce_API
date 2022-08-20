const User = require('../models/users');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')


// helper function for signing JWT tokens and sending them
const signJwtToken = (res,user,statusCode)=>{
  const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
      expiresIn : process.env.EXPIRY_DATE
  })
  
     res.status(statusCode).json({
          "message": "Success",
           user,
           token
      })

}

exports.SignUp = async (req, res, next) => {
  const {
    name,
    email,
    password
  } = req.body;

  const existingUser = await User.findOne({email: email});

  if(existingUser) 
    return res.status(400).json({
      'message': 'User already exists'
    });
  
  const user = new User( {
    name: name,
    email: email,
    password: password
  });

  if(user.email === 'admin@admin.com'){
    user.isAdmin = true
  }

  await user.save();
  signJwtToken(res,user,201)


}

exports.SendOTP = async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);

  if(!user){
    return res.status(404).json({
      'message': 'User not found'
    })
  }
  const otp = Math.floor(100000 + Math.random() * 900000);// generate 6 digit otp
  user.otp = otp;
  await user.save();
  return res.status(201).json({
    'message': 'OTP sent to user email',
    'OTP': otp
  })
}

exports.EmailVerification = async(req, res, next) => {
  const { otp } = req.body;
  const user = await User.findOne({otp: otp});

  if(!user){
    return res.status(404).json({
      'message': 'enter correct otp'
    })
  }

  user.isEmailVerified = true;
  await user.save();
  return res.status(201).json({
    'message': 'Email verification successful'
  })
}

exports.SignIn = async (req, res, next) => {
  const {email, password} = req.body
  // check if there is an email and password 
  if(!email || !password) 
    return res.status(400).json({
      'message': "please include an email and password"
    });

  //find the user with that email and confirm the password is the same as
  const userWithEmail = await User.findOne({email: email}).select('+password')

  //if the password isnt correct return error .if it is send a jwt token to the client 
  if(!userWithEmail || !(await userWithEmail.comparePasswords(password,userWithEmail.password))){   
    return res.status(400).json({
      'message': "you have entered an incorrect email or password"
    });
  };

  //check if email is verified
  if(!userWithEmail.isEmailVerified)
    return res.status(400).json({
      'message': "please verify email address"
    });

    signJwtToken(res,userWithEmail,201)
}


//for handling generation of password reset token
exports.forgotPassword  = async (req, res, next) => {
  //first check that the request comes with an email body
  const {email} = req.body
  if(!email) 
    return res.status(400).json({
      'message':'Please enter a valid email address'
    });

  //find user with email address
  const userWithEmail = await User.findOne({email : email})
  // console.log(userWithEmail);

  if(!userWithEmail) 
    return res.status(400).json({
      'message':'No user with email address exists please sign up to gain access'
    });


  //generate a reset token and store it in user 
  const passwordResetToken = userWithEmail.generateResetToken()

  await userWithEmail.save({validateBeforeSave:false}) 

  //build the password reset token url
  const resetPasswordUrl = `${req.protocol}://${req.get('host')}/api/v1/resetPassword/${passwordResetToken}`;

  //send reset token url  as email to user
    res.status(200).json({
      "message": "password reset token sent to email successfully",
      "passwordResetTokenUrl":resetPasswordUrl //for testing purpose dev can copy the reset url and try to reset password..would be removed in production
     })
}



//for handling updating of password 

exports.resetPassword = async (req, res, next)=>{
  // get reset token from url

  const {token} = req.params

  const {password} = req.body

  //hash the reset token and find the user it belongs to in our db
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const userWithToken = await User.findOne({resetToken: resetTokenHash, resetTokenExpired:{$gt:Date.now()}}) //find user with reset token whose expiry date hasnt been exceeded
  if(!userWithToken) 
    return res.status(400).json({
    'message':'Invalid reset token'
    }); 


  //update the password of the user 
  userWithToken.password = password
  userWithToken.resetToken = undefined
  userWithToken.resetTokenExpired = undefined 

  await userWithToken.save()
  
  //    sign new jwt token
  signJwtToken(res,userWithToken,200)

}
