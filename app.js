import express  from  'express'
import dotenv from 'dotenv'
dotenv.config()
import cors from 'cors';
import './config/connectDb.js';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js'
import './config/passport-google-strategy.js';

const app = express()
const PORT =process.env.PORT



// This will solve cors policy error
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? process.env.Frontend_HOST : true,
    credentials: true,
    optionsSuccessStatus: 200

    
}



app.use(cors(corsOptions))
//json
app.use(express.json())
//cookie parser
app.use(cookieParser());
//passport middleware
app.use(passport.initialize());



app.use("/api/user",userRoutes)

app.listen(PORT,()=>{

    console.log(`server is running on this ${PORT}`)
})