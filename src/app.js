import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))

//data can be taken as json, earlier body-parser was needed, now express does it by itself
app.use(express.json({
    limit: "20kb"
}))

//urlencoded to be used when data is taken or obtained from server, so that time, multiple challenges occur, hence we try to use this urlencoded
app.use(express.urlencoded({
    extended: true,
    limit: "20kb"
}))

//used so that if you wanna store images, favicon, assets in server, you can use this and this will be stored in public directory as passed 
app.use(express.static("public"))     
 
//from server, we can access/set all cookies of users(basically performing CRUD operations on cookies of users)
app.use(cookieParser())     

export { app }