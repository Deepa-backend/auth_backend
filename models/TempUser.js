// models/TempUser.js
import mongoose from "mongoose";

const TemporaryUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
 mobile: {
      type: String,
      required : true,
    },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600  // 10 minutes (in seconds)
  }
});

export default mongoose.model("TemporaryUser", TemporaryUserSchema);
