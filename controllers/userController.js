import UserModel from "../models/User.js";
import TempUser from "../models/TempUser.js";
import bcrypt from "bcrypt";
import sendEmailVerificationOTP from "../utils/sendEmailVerificationOTP.js";
import EmailVerificationModel from "../models/EmailVerification.js";
import generateTokens from "../utils/generateTokens.js";
import setTokensCookies from "../utils/setTokenCookies.js";
import refreshAccessToken from "../utils/refreshAccessToken.js";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";
import transporter from "../config/emailConfig.js";
import jwt from "jsonwebtoken";
import sendResponse from "../utils/sendResponse.js";
import { generateAccessToken } from '../utils/tokenUtils.js';
class UserController {
  
static userRegistration = async (req, res) => {
  try {
    const { name, email, mobile, password, password_confirmation } = req.body;

    if (!name || !email || !mobile || !password || !password_confirmation) {
      return sendResponse(res, "All fields are required", 400, false);
    }

    if (password !== password_confirmation) {
      return sendResponse(res, "Password and confirm password do not match", 400, false);
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return sendResponse(res, "Email already registered", 400, false);
    }

    const existingTemp = await TempUser.findOne({ email });
    if (existingTemp) {
      return sendResponse(res, "Check your email for OTP", 400, false);
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    const tempUser = await TempUser.create({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    await sendEmailVerificationOTP(req, tempUser);

    return sendResponse(res, "OTP sent to your email. Please verify within 10 minutes.", 201, true);
  } catch (error) {
    console.error("User Registration Error:", error);
    return sendResponse(res, "Internal server error", 500, false);
  }
};

//   /userEmailVerification


static verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const tempUser = await TempUser.findOne({ email });
    if (!tempUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const emailVerification = await EmailVerificationModel.findOne({
      userId: tempUser._id,
      otp,
    });

    if (!emailVerification) {
      await sendEmailVerificationOTP(req, tempUser);
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. A new OTP has been sent.",
      });
    }

    const now = new Date();
    const expiry = new Date(emailVerification.createdAt.getTime() + 15 * 60 * 1000);
    if (now > expiry) {
      await sendEmailVerificationOTP(req, tempUser);
      return res.status(400).json({
        success: false,
        message: "OTP expired. A new OTP has been sent.",
      });
    }

    await UserModel.create({
      name: tempUser.name,
      email: tempUser.email,
      mobile: tempUser.mobile,
      password: tempUser.password,
      is_verified: true,
    });

    await TempUser.deleteOne({ _id: tempUser._id });
    await EmailVerificationModel.deleteMany({ userId: tempUser._id });

    return res.status(200).json({
      success: true,
      message: "Email verification successful. You are now registered.",
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during email verification.",
    });
  }
};


  //userLogin
  static userLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
      //check if email and password are provided

      if (!email || !password) {
        return sendResponse(
          res,
          "Email and password both are required",
          400,
          false
        );
      }

      // find user by email
      const user = await UserModel.findOne({ email });
      //check  if user exists
      if (!user) {
        return sendResponse(res, "user not found", 400, false);
      }

      //compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        sendResponse(res, "Invalid email or password", 400, false);
      }

      
      // Generate Tokens
      const { accessToken, accessTokenExp, refreshToken, refreshTokenExp } =
        await generateTokens(user);

      // set cookies
      setTokensCookies(
        res,
        accessToken, // ✅ token string
        accessTokenExp, // ✅ number (timestamp)
        refreshToken, // ✅ token string
        refreshTokenExp // ✅ number (timestamp)
      );

      //send  success with response with tokens
      res.status(200).json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          roles: user.roles[0],
        },

        status: "success",
        message: "Login Successful",
        access_Token: accessToken,
        refresh_Token: refreshToken,
        access_Token_Exp: accessTokenExp,
        is_auth: true,
      });
    } catch (error) {
      console.error(error);

      return sendResponse(
        res,
        "Unable to login,please try again later",
        500,
        false
      );
    }
    //New Access Token or refresh token
  };
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
  static userProfile = async (req, res) => {
    console.log("user profile hit", req.user);
    res.json({ user: req.user });
  };
  //change password

  static changePassword = async (req, res) => {
    try {
      const { password, password_confirmation } = req.body;
      if (!password || !password_confirmation) {
        return sendResponse(
          res,
          "Password and confirm password are required",
          400,
          false
        );
      }
      //check if password password_confirmation match
      if (password !== password_confirmation) {
        return sendResponse(
          res,
          "Password and confirm password are  not match",
          400,
          false
        );
      }
      //Generate salt and hash new passowrd
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);
      //update and user's password
      await UserModel.findByIdAndUpdate(req.user._id, {
        $set: {
          password: newHashPassword,
        },
      });

      // send success message

      return sendResponse(res, "Password changed successfully", 200, true);
    } catch (error) {
      console.log(error);
      return sendResponse(res, "unable to change password", 400, false);
    }
  };

  // send password reset link via email
  static sendUserPasswordResetEmail = async (req, res) => {
    try {
      const { email } = req.body;
      //check if email is providesd
      if (!email) {
        return sendResponse(res, "Email is required", 400, false);
      }

      console.log("Finding user...");

      // find user by email
      const user = await UserModel.findOne({ email });
      if (!user) {
        return sendResponse(
          res,
          "Unable to login,please try again later",
          500,
          false
        );
      }

      //generate password reset link
      const secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
      console.log("Generating token...");
      const token = jwt.sign({ userId: user._id }, secret, {
        expiresIn: "15m",
      });

      //reset link
      const resetLink = `${process.env.Frontend_HOST}/account/reset-password-confirm/${user._id}/${token}`;
      console.log(resetLink);
      //send password reset link through ui
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "password reset link",
        html: `<p>hello ${user.name},</p><p>please <a href="${resetLink}">Click here</a> to reset your password.</p>`,
      });
      console.log("Email sent successfully.");
      //res.status(200).json({ status: "success", message: "  reset link has been sent." });
      return sendResponse(
        res,
        "Unable to login,please try again later",
        500,
        false
      );
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({
          status: "failed",
          message:
            "unble to send password and reset email, please try again later",
        });
    }
  };
  //password reset
  static userPasswordReset = async (req, res) => {
    try {
      const { password, password_confirmation } = req.body;

      const { id, token } = req.params;
      // find user by id
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({
          status: "failed",
          message: " user not found",
        });
      }
      //validate token
      const new_secret = user._id + process.env.JWT_ACCESS_TOKEN_SECRET_KEY;
      jwt.verify(token, new_secret);

      // check if password and password confirmation are provided
      if (password !== password_confirmation) {
        return sendResponse(
          res,
          "New password  and confirm new password don't match",
          500,
          false
        );
      }

      //Generate salt and hash new password
      const salt = await bcrypt.genSalt(10);
      const newHashPassword = await bcrypt.hash(password, salt);

      // update user's password
      await UserModel.findByIdAndUpdate(user._id, {
        $set: {
          password: newHashPassword,
        },
      });
      // send success message
      res
        .status(200)
        .json({ status: "success", message: "Password reset successfully" });
      // return sendResponse(res,  "password reset successfully", 500, false);
    } catch (error) {
      console.log(error);
      if (error.name === "TokenExpiredError") {
        //return res.status(400).json({status : "failed", message : "Token Expired. please request a new password reset link"})
        return sendResponse(
          res,
          "Token Expired. please request a new password reset link",
          400,
          false
        );
      }
      //return res.status(500).json({status : "failed" , message : "unable to reset password. please try again later"})
      return sendResponse(
        res,
        "unable to reset password. please try again late",
        400,
        false
      );
    }
  };

  
static userLogout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshtoken;

    // Optionally blacklist refresh token in DB
    await UserRefreshTokenModel.findOneAndUpdate(
      { token: refreshToken },
      { $set: { blacklisted: true } }
    );

    const isProduction = process.env.NODE_ENV === "production";

    // 🔥 Clear both cookies using same settings
    res.clearCookie("accesstoken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.clearCookie("refreshtoken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.status(200).json({
      status: "success",
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({
      status: "failed",
      message: "Unable to logout, please try again later",
    });
  }
};

//gmail


static googleAuthRedirect = async (req, res) => {
  try {
    const user = req.user;

    const accessToken = generateAccessToken(user);
    // Optionally: you can also generate a refresh token

    // Send token to frontend via query param or cookie
    return res.redirect(`http://localhost:3000/dashboard?token=${accessToken}`);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Google login failed" });
  }
}



// crud operations 
static getAllusers = async(req,res)=>{
  try{
    //pagination 
    const page = parseInt(req.query.page)||1;
    const limit = parseInt(req.query.limit) || 3;
    const skip =(page-1)*limit;
    const  total = await UserModel.countDocuments();
    const users = await UserModel.find().skip(skip).limit(limit);

    //Map  each user to  the required rsposnse format
 const userList = users.map(user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  mobile : user.mobile,
}));
return sendResponse(res,"Users fetched successfully",200,true,{
  users : userList,
  //page,
  //limit,
  //total,
});
  }
  catch(error)
  {
console.error("Get All Users Error:", error);
    return sendResponse(res, "Internal server error", 500, false);
  }
}
//getUsersById
static getUsersById = async(req,res)=>{
  try{

    const { id } = req.params;
    //validate Id presence
    if(!id){
      return sendResponse(res,"User Id is required",400,false)
    }
    const user = await UserModel.findById(id);
    if(!user){
      return sendResponse(res,"User not found",404,false)
    }
    const userData ={
      id : user._id,
      name : user.name,
      email : user.email,
      mobile : user.mobile,
    };

  
return sendResponse(res, "User fetched successfully", 200, true, { user: userData });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    return sendResponse(res, "Internal server error", 500, false);
  }
};

// update user by id
static updateUserById = async(req,res)=>{
try{
 //const { userId } = req.params;
    const { id: userId } = req.params;
 const  {name } = req.body;
 const user = await  UserModel.findById(userId);
 if(!user){
  return sendResponse(res,"User not found",404,false);

 }
 if (name) user.name = name;
  if (mobile) user.email = mobile;

    await user.save();
 return sendResponse(res,"User updated successfully",200,true,{
  user:{
    id : user._id,
    name : user.name,
    mobile : user.mobile,
  

  },

 });


}catch(error)
{
console.error("Update User Error:", error);
    return sendResponse(res, "Internal server error", 500, false);

}
};
}
export default UserController;
