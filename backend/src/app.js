import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from "./routes/user.route.js"
import recipeRouter from "./routes/recipe.route.js"
import commentRouter from "./routes/comment.route.js"
//routes declaration
app.use("/api/v1/user", userRouter)
// http://localhost:8000/api/v1/users/register

app.use("/api/v1/recipe", recipeRouter)

app.use("/api/v1/comment", commentRouter)

export { app }