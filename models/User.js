import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    mobile: {
      type: String,
     required : true,
    //    required: function () {
    //     return !this.googleId; //
    // },
  },
    password: {
      type: String,
      // required: function () {
      //   return !this.googleId; // password is required if not Google login
      // },
      trim: true,
    },
      googleId: {
      type: String,
      default: null, // used to identify Google login users
    },
    is_verified: {
      type: Boolean,
      default: false,
    },

    roles: {
      type: [String],
      enum: ["user", "admin"],
      default: ["user"],
    },
  },

  {
    timestamps: true,
  }
  //timestamps: true,
);

//const UserModel = mongoose.model("users",userSchema)
const UserModel = mongoose.model("User", userSchema);

export default UserModel;
