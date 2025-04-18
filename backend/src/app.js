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

//routes
import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//declaring routes as per production rules, using /api/v1 gives idea about version of api, also this is a good practice in industry level work
app.use("/api/v1/users", userRouter);
app.use("/api/v1/subscription", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/dashboard", dashboardRouter)

export { app }