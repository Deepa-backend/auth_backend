import transporter from "../config/emailConfig.js";
import EmailVerificationModel from "../models/EmailVerification.js";
const sendEmailVerificationOTP = async(req,user) => {
  //Generate a random 4 digit number

   const otp = Math.floor(1000+Math.random()*9000);

   //save otp in db
   await new EmailVerificationModel({
    userId: user._id,otp:otp
   }).save();

   //OTP VERIFICATION lINK
   const otpverificationLink =`${process.env.Frontend_HOST}/account/verify-email`
   

   await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to :user.email,
    subject : "OTP - verify your account ",
    html : `<p>Dear ${user.name},</p><p> Thank You for signing up
    with our service. To complete your registration , please verify
    your email address by entering the following one time password
    (OTP) : </p>
    <h2>OTP : ${otp}</h2>
    <p> This otp is valid for 15 minutes. If you didn't request this otp
    ,please ignore this email.</p>`
   })

}

export default sendEmailVerificationOTP

