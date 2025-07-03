
const setTokensCookies = (res, accessToken, accessTokenExp, refreshToken, refreshTokenExp) => {
  const now = Math.floor(Date.now() / 1000);

  const accessTokenMaxAge = (accessTokenExp - now) * 1000;
  const refreshTokenMaxAge = (refreshTokenExp - now) * 1000;

  if (isNaN(accessTokenMaxAge) || isNaN(refreshTokenMaxAge)) {
    console.error("❌ Invalid token expiration time");
    return;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  console.log("✅ Setting cookies...");
  console.log("Access token maxAge (ms):", accessTokenMaxAge);
  console.log("Refresh token maxAge (ms):", refreshTokenMaxAge);
  console.log("Environment:", isProduction ? "Production" : "Development");

  res.cookie('accesstoken', accessToken, {
    httpOnly: true,
    secure: isProduction, // Must be true in production (HTTPS)
    maxAge: accessTokenMaxAge,
    sameSite: isProduction ? 'None' : 'Lax',
    path: '/',
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
