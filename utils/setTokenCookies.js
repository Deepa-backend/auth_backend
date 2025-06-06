
// const setTokensCookies = (res, accessToken, accessTokenExp, refreshToken, refreshTokenExp) => {
//   const now = Math.floor(Date.now() / 1000);

//   console.log("AccessTokenExp:", accessTokenExp);
//   console.log("RefreshTokenExp:", refreshTokenExp);
//   console.log("Current Time (seconds):", now);

//   const accessTokenMaxAge = (accessTokenExp - now) * 1000;
//   const refreshTokenMaxAge = (refreshTokenExp - now) * 1000;

//   // Validate expiration values
//   if (isNaN(accessTokenMaxAge) || isNaN(refreshTokenMaxAge)) {
//     console.error("❌ Invalid token expiration time");
//     return;
//   }

//   // Set access token cookie
//   res.cookie('accesstoken', accessToken, {
//     httpOnly: true,
//     secure: true,
//     maxAge: accessTokenMaxAge,
//     sameSite: "strict",
//   });

//   // Set refresh token cookie
//   res.cookie('refreshtoken', refreshToken, {
//     httpOnly: true,
//     secure: true,
//     maxAge: refreshTokenMaxAge,
//     sameSite: "strict",
//   });
// };

// export default setTokensCookies;
const setTokensCookies = (res, accessToken, accessTokenExp, refreshToken, refreshTokenExp) => {
  const now = Math.floor(Date.now() / 1000);

  const accessTokenMaxAge = (accessTokenExp - now) * 1000;
  const refreshTokenMaxAge = (refreshTokenExp - now) * 1000;

  if (isNaN(accessTokenMaxAge) || isNaN(refreshTokenMaxAge)) {
    console.error("❌ Invalid token expiration time");
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // Debugging logs
  console.log("✅ Setting cookies...");
  console.log("Access token maxAge (ms):", accessTokenMaxAge);
  console.log("Refresh token maxAge (ms):", refreshTokenMaxAge);
  console.log("Environment:", isProduction ? "Production" : "Development");

  res.cookie('accesstoken', accessToken, {
    httpOnly: true,
    secure: isProduction,                    // Only HTTPS in prod
    maxAge: accessTokenMaxAge,
    sameSite: isProduction ? 'None' : 'Lax', // Required for cross-site cookies
    path: '/',                               // Ensure it's accessible to all routes
  });

  res.cookie('refreshtoken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    maxAge: refreshTokenMaxAge,
    sameSite: isProduction ? 'None' : 'Lax',
    path: '/',
  });
};

export default setTokensCookies;
