import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        trim:true
    },
  email:{
   type: String,
   required: true,
   trim: true,
   unique: true,
   lowercase: true
  },
  password:{
    type:String,
    required:true,
    trim:true
  },
  is_verified :{
    type:Boolean,
    default:false
  },

  roles:{
          type:[String],
          enum:["user","admin"],
          default:["user"]
  },

  //timestamps: true,
})

//const UserModel = mongoose.model("users",userSchema)
const UserModel = mongoose.model("User",userSchema)

export default UserModel;