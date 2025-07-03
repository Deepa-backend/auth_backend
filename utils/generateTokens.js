import jwt from "jsonwebtoken";

import UserRefreshTokenModel from "../models/UserRefreshToken.js";

const generateTokens = async(user)=>{
    try{

        const payload ={_id :user._id,
            roles: user.roles
        };
     
       // Generate access token (valid for 100s)
       const accessTokenExp = Math.floor(Date.now()/1000)+100;
    //expiration  to 100 second from nopw
    const accessToken = jwt.sign({
      ...payload,exp:accessTokenExp  
    },
    process.env.JWT_ACCESS_TOKEN_SECRET_KEY,
);

// generate referesh token
const refreshTokenExp = Math.floor(Date.now()/1000)+60 *60*24*5;

const refreshToken = jwt.sign({
    ...payload,exp: refreshTokenExp
    //{expires in '5d}
    
},
process.env.JWT_REFRESH_TOKEN_SECRET_KEY
);


const existingToken = await UserRefreshTokenModel.findOne({ userId: user._id });
    if (existingToken) {
      await existingToken.deleteOne(); // clean previous token
    }

    // Save new refresh token in DB
    await new UserRefreshTokenModel({
      userId: user._id,
      token: refreshToken,
    }).save();




return Promise.resolve({
    accessToken,
    refreshToken,
    accessTokenExp,
    refreshTokenExp});
    }
    catch(error)
    {
    return Promise.reject(error);
    }
}

export default generateTokens;