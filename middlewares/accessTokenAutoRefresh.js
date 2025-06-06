import isTokenExpired from "../utils/isTokenExpired.js";
import refreshAccessToken from "../utils/refreshAccessToken.js";

const accessTokenAutoRefresh = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accesstoken;

    if (accessToken && !isTokenExpired(accessToken)) {
      req.headers["authorization"] = `Bearer ${accessToken}`;
      return next();
    }

    // Token is missing or expired — try refreshing
    const refreshToken = req.cookies.refreshtoken;
    if (!refreshToken) {
      throw new Error("Refresh token missing");
    }

    const {
      newaccessToken,
      newaccessTokenExp,
      newRefreshToken,
      newrefreshTokenExp,
      error,
    } = await refreshAccessToken(req);

    if (error) throw new Error("Invalid refresh token");

    req.headers["authorization"] = `Bearer ${newaccessToken}`;

    const now = Math.floor(Date.now() / 1000);
    const accessTokenMaxAge = (newaccessTokenExp - now) * 1000;
    const refreshTokenMaxAge = (newrefreshTokenExp - now) * 1000;

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accesstoken", newaccessToken, {
      httpOnly: true,
      secure: isProduction,
      maxAge: accessTokenMaxAge,
      sameSite: isProduction ? "none" : "lax",
    });

    res.cookie("refreshtoken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      maxAge: refreshTokenMaxAge,
      sameSite: isProduction ? "none" : "lax",
    });

    next();
  } catch (error) {
    console.error("Auto-refresh error:", error.message);
    return res.status(401).json({
      status: "failed",
      message: "Authentication failed",
    });
  }
};

export default accessTokenAutoRefresh;
