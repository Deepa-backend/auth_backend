
import UserModel from "../models/User.js";
import UserRefreshTokenModel from "../models/UserRefreshToken.js";
import generateTokens from "./generateTokens.js";
import verifyRefreshToken from "./verifyRefreshToken.js";

const refreshAccessToken = async (req) => {
  try {

   const oldRefreshToken = req.cookies?.refreshtoken;

    const { tokenDetails, error } = await verifyRefreshToken(oldRefreshToken);
    if (error || !tokenDetails) {
      return { error: true, message: "Invalid or expired refresh token" };
    }

    // Find user
    const user = await UserModel.findById(tokenDetails._id);
    if (!user) {
      return { error: true, message: "Invalid user" };
    }

    // Find refresh token in DB
    const userRefreshToken = await UserRefreshTokenModel.findOne({
      userId: tokenDetails._id,
    });
console.log("▶ Refresh Token From Cookie:", oldRefreshToken);
console.log("▶ Refresh Token In DB:", userRefreshToken?.token);
console.log("▶ Token Blacklisted:", userRefreshToken?.blacklisted);
console.log("▶ User Refresh Token Found:", !!userRefreshToken);

    if (
      !userRefreshToken ||
      oldRefreshToken !== userRefreshToken.token ||
      userRefreshToken.blacklisted
    ) {
      return { error: true, message: "Unauthorized access" };
    }

    // Generate new tokens
    const {
      accessToken,
      accessTokenExp,
      refreshToken,
      refreshTokenExp,
    } = await generateTokens(user);

    return {
      error: false,
      newaccessToken: accessToken,
      newaccessTokenExp: accessTokenExp,
      newRefreshToken: refreshToken,
      newrefreshTokenExp: refreshTokenExp,
    };
  } catch (err) {
    console.error("refreshAccessToken error:", err);
    return { error: true, message: "Internal Server Error" };
  }
};

export default refreshAccessToken;
