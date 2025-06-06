import UserModel from "../models/User.js";

import bcrypt from "bcrypt";
import sendEmailVerificationOTP from "../utils/sendEmailVerificationOTP.js";
import EmailVerificationModel from "../models/EmailVerification.js";
import generateTokens from "../utils/generateTokens.js";
import setTokensCookies from "../utils/setTokenCookies.js";
import refreshAccessToken from "../utils/refreshAccessToken.js";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";
import transporter from "../config/emailConfig.js";
import jwt from "jsonwebtoken"

class UserController {
  //userRegistration
  static userRegistration = async (req, res) => {
    try {
      const { name, email, password, password_confirmation } = req.body;

      if (!name || !email || !password || !password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "All Fields Are required",
        });
      }

      // check if password and password_confirmation match

      if (password !== password_confirmation) {
        return res.status(400).json({
          status: "failed",
          message: "Password and Confirm password don't match",
        });
      }

      // check if email already exists

      const existingUser = await UserModel.findOne({ email });
      {
        if (existingUser) {
          return res.status(400).json({
            status: "failed",
            message: "Email Already Exists",
          });
        }
      }
      //generate salt and hashhpassword

      const salt = await bcrypt.genSalt(Number(process.env.SALT));
      const hashedPassword = await bcrypt.hash(password, salt);

      //create new user

      const newUser = await new UserModel({
        name,
        email,
        password: hashedPassword,
      }).save();

      sendEmailVerificationOTP(req, newUser);
      res.status(201).json({
        status: "success",
        message: "Registration Success",
        // user :{id : newUser._id,email:newUser.email}
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Unable to register,please try again later",
      });
    }
  };

  //userEmailVerification

  static verifyEmail = async (req, res) => {
    try {
      const { email, otp } = req.body;

      // checks  if all  required fields are provided
      if (!email || !otp) {
        return res
          .status(400)
          .json({ status: "failed", message: "All fields are required" });
      }

      const existingUser = await UserModel.findOne({ email });

      // check if email does not exist
      if (!existingUser) {
        return res.status(404).json({
          status: "failed",
          message: "Email does not exist",
        });
      }
      //check if email is already verified
      if (existingUser.is_verified) {
        return res.status(400).json({
          status: "failed",
          message: "Email is already verified",
        });
      }

      const emailVerification = await EmailVerificationModel.findOne({
        userId: existingUser._id,
        otp,
      });

      if (!emailVerification) {
        if (!existingUser.is_verified) {
          console.log(req, existingUser);
          await sendEmailVerificationOTP(req, existingUser);
          return res.status(400).json({
            status: "failed",
            message: "Invalid OTP. new otp send to your email",
          });
        }
        return res
          .status(400)
          .json({ status: "failed", message: "Invalid Otp" });
      }

      // check if OTP is expired

      const currentTime = new Date();
      //15*60*1000 calculates the expiration period in millisecond in minutes
      const expirationTime = new Date(
        emailVerification.createdAt.getTime() + 15 * 60 * 1000
      );

      if (currentTime > expirationTime) {
        //otp expired , send new otp
        await sendEmailVerificationOTP(req, existingUser);
        return res
          .status(400)
          .json({
            status: "failed",
            message: "OTP Expired , new OTP send to your email",
          });
      }
      // ✅ OTP is valid and not expired - mark user as verified
      existingUser.is_verified = true;
      await existingUser.save();

      // ✅ Remove the used OTP (optional but recommended)
      await EmailVerificationModel.deleteMany({ userId: existingUser._id });

      return res.status(200).json({
        status: "success",
        message: "Email verification successful",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: "failed",
        message: "Unable to verify email ,please try again later",
      });
    }
    
  };
  //userLogin
  static userLogin = async(req,res)=>{
    try{

        const {email,password}= req.body
        //check if email and password are provided

        if(!email || !password)
        {
            return res.status(400).json({
                status : "failed",
                message : "Email and password are required"
            })
        }
        
        // find user by email
        const user = await UserModel.findOne({email});
        //check  if user exists
        if(!user)
        {
            return res.status(404).json({
                status : "failed",
                message : "user not found"
                //message : Invalid email or password
            })
        }

        // check if verified user exist
        if(!user.is_verified)
        {
            return res.status(401).json({
                status : "failed",
                message : "your account is not verified"
            })
        }
        //compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
               return res.status(400).json({
            status : "failed",
            message : "Invalid Email  or password"
        });
    }
    
    // Generate Tokens
const {accessToken,accessTokenExp,refreshToken,refreshTokenExp
    } = await generateTokens(user)
    
    // set cookies
setTokensCookies(
  res,
  accessToken,        // ✅ token string
  accessTokenExp,     // ✅ number (timestamp)
  refreshToken,       // ✅ token string
  refreshTokenExp     // ✅ number (timestamp)
);


    //send  success with response with tokens
    res.status(200).json({
        user : {id :user._id,
            email: user.email,
            name : user.name,
            roles : user.roles[0]},

            status : "success",
            message : "Login Successful",
            access_Token : accessToken,
            refresh_Token : refreshToken,
            access_Token_Exp : accessTokenExp,
            is_auth : true
        });
    
      }
    
      catch(error)
    {
        console.error(error);
        res.status(500).json({status : "failed", message :
            "Unable to login,please try again later"
        });
    }
   //New Access Token or refresh token
 }
static async getNewAccessToken(req, res) {
  try {
    const tokenData = await refreshAccessToken(req);

    if (!tokenData || tokenData.error) {
      return res.status(401).json({
        status: "failed",
        message: tokenData?.message || "Failed to refresh token",
      });
    }

    const {
      newaccessToken,
      newaccessTokenExp,
      newRefreshToken,
      newrefreshTokenExp,
    } = tokenData;

    setTokensCookies(
      res,
      newaccessToken,
      newaccessTokenExp,
      newRefreshToken,
      newrefreshTokenExp
    );

    return res.status(200).json({
      status: "success",
      message: "New access token generated",
      access_Token: newaccessToken,
      refresh_Token: newRefreshToken,
      access_Token_Exp: newaccessTokenExp,
    });

  } catch (error) {
    console.error(error);
    return res.status(401).json({
      status: "failed",
      message: "Invalid or expired refresh token",
    });
  }
}


//profile or logged  in user
static userProfile = async(req,res) => {
    console.log("user profile hit", req.user);
    res.json({ user: req.user });
}
//change password
static changePassword  = async(req,res)=>{
  try{

    const {password,password_confirmation}= req.body;
    if(!password || !password_confirmation){
      return res.status(400).json({status : "failed", message : " Password and confirm password are required"})
    }
    //check if password password_confirmation match
    if(password !== password_confirmation)
    {
      return res.status (400).json({status : "failed", message: "new password and confirm new password don't match"})
    }
    //Generate salt and hash new passowrd
    const salt = await bcrypt.genSalt(10);
    const newHashPassword = await bcrypt.hash(password,salt);
  //update and user's password
  await UserModel.findByIdAndUpdate(req.user._id,{
    $set : {
      password : newHashPassword
    }
  });

  // send success message
  res.status(200).json({status : "success", message : "password changed successfully"})
  }
  catch(error)
  {
    console.log(error);
    res.status(500).json({status : "failed", message : " ubable to change password please try again later "})
  }

}

// send password reset link via email
static sendUserPasswordResetEmail = async(req,res)=>{
  try{

    const { email } = req.body;
    //check if email is providesd
    if(!email){
      return res.status(400).json
      ({status : "failed" , message : "Email is required"});
    }
    
  console.log("Finding user...");
 
  // find user by email 
  const user = await UserModel.findOne({email});
  if(!user){
    return res.status(404).json({status : "failed", message : "Email does not exist"})
  }
      
//generate password reset link
const secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
console.log("Generating token...")
const token = jwt.sign({userId : user._id},secret,{expiresIn:'15m'});

//reset link 
const resetLink =`${process.env.Frontend_HOST}/account/reset-password-confirm/${user._id}/${token}`;
console.log(resetLink)
//send password reset link through ui
await transporter.sendMail({
  from : process.env.EMAIL_FROM,
  to : user.email,
  subject : "password reset link",
  html:`<p>hello ${user.name},</p><p>please <a href="${resetLink}">Click here</a> to reset your password.</p>`
});
console.log("Email sent successfully.");
res.status(200).json({ status: "success", message: "  reset link has been sent." });
}
 catch(error){
    console.log(error);
    res.status(500).json({status : "failed",
       message : "unble to send password and reset email, please try again later"})
     
    }
}
//password reset
static userPasswordReset = async(req,res)=>{
  try{
const {password, password_confirmation}  = req.body;

const {id, token} = req.params;
// find user by id
const user = await UserModel.findById(id);
if(!user){
  return res.status(404).json({
    status : "failed",
    message : " user not found"
  })
}
//validate token
const new_secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY
jwt.verify(token,new_secret)
  
  // check if password and password confirmation are provided
 if(password !==password_confirmation)
{
  return res.status(400).json({status : "failed", message : "New passwor  and confirm new password don't match"})
}
  

  //Generate salt and hash new password
  const salt = await bcrypt.genSalt(10);
  const newHashPassword = await bcrypt.hash(password,salt)

  // update user's password
  await UserModel.findByIdAndUpdate(user._id,{$set : {
    password : newHashPassword
  }})
  // send success message
  res.status(200).json({status : "success", message : "Password reset successfully"})
}
  catch(error)
  {
    console.log(error)
    if(error.name === "TokenExpiredError"){
      return res.status(400).json({status : "failed", message : "Token Expired. please request a new password reset link"})
    }
    return res.status(500).json({status : "failed" , message : "unable to reset password. please try again later"})
  }
}
//logout
static  userLogout =async(req,res)=>{
  try{

    // clear cookies
 
    //optionally you can blacklist the refresh token in the DB
    const refreshToken = req.cookies.refreshToken;
    await UserRefreshTokenModel.findOneAndUpdate({
      token: refreshToken
    },
  {$set : {blacklisted : true}})
   // clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken'),
    res.clearCookie('is_auth')
    res.status(200).json({
      status : "success",
      "messgae" : "Logout Successful"
    });
  }
  
  catch(error)
  {
    console.log(error)
    res.status(500).json({status : "failed", message : "unable to logout  please try again later"});
  }

}
}

export default UserController;
