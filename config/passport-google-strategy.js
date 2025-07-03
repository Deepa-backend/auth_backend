import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

import UserModel from '../models/User.js'; // Assuming this is your Mongoose model
dotenv.config();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:'http://localhost:3001/api/user/google/callback' 
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      let user = await UserModel.findOne({ email });
      if (!user) {
        user = await UserModel.create({
          name: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos[0].value,
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

// (Optional) Session handling
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await UserModel.findById(id);
  done(null, user);
});

