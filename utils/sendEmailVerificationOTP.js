import EmailVerificationModel from '../models/EmailVerification.js';
import sendEmail from '../utils/sendEmail.js'

const sendEmailVerificationOTP = async (req, user) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

  await EmailVerificationModel.create({
    userId: user._id,
    email: user.email,
    otp,
    createdAt: new Date(),
  });

  const subject = "Verify your email address";
  const message = `Hi ${user.name},\n\nYour OTP for verifying your email is: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nThanks,\nTeam`;

  await sendEmail(user.email, subject, message);
};

export default sendEmailVerificationOTP;
