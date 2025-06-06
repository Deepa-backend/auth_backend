import jwt from "jsonwebtoken";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";
const  verifyRefreshToken = async(refreshToken)=>{
try{
const privateKey = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;

//find the refresh token document
const userRefreshToken = await UserRefreshTokenModel.findOne({
    token : refreshToken
});

//if refresh token not found ,reject with an error
// if(!userRefreshToken)
// {
//     throw {error : true, message  : "Invalid refresh token"}
// }
  if (!userRefreshToken || userRefreshToken.blacklisted) {
      return { error: true, message: "Refresh token not found or blacklisted" };
    }
// verify the refresh token
const tokenDetails = jwt.verify(refreshToken,privateKey);
//if verifuication successful , resolve with token details
return{
    tokenDetails,
    error: false,
    message : "valid refresh token"
}

}
catch(error)
{
      console.error("JWT verification failed:", err.message);
    throw {error: true,message : "Invalid refresh token"};

}
}
export  default verifyRefreshToken;