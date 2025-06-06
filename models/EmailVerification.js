import mongoose from "mongoose";

const emailVerificationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,ref:'users',
        required:true
    },
    otp:{
        type:String,
        required : true
    },
    createdAt:{
        type:Date,
        default : Date.now,
        expires : '15m'
    }
});

//Model
const EmailVerificationModel  = mongoose.model("EmailVerification",emailVerificationSchema)

export default EmailVerificationModel;