
import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'TempUser',
  },
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const EmailVerificationModel = mongoose.model(
  'EmailVerification',
  emailVerificationSchema
);

export default EmailVerificationModel; // ✅ ESM export
