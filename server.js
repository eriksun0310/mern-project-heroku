const express = require("express")
const app = express()
const mongoose = require("mongoose")
const dotenv = require("dotenv")
dotenv.config()
const authRoute = require("./routes").auth
const courseRoute = require("./routes").course
const passport = require("passport")
require("./config/passport")(passport)
const cors = require("cors")
const path = require("path")
const port = process.env.PORT || 8080 //  process.env.PORT 是heroku自動動態設定

mongoose
    .connect(process.env.MONGODB_CONNECTION)
    .then(()=>{
        console.log("connection mongoDB success !")
    })
    .catch((e)=>{
        console.log(e)
    }) 

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static(path.join(__dirname, "client","build")))


app.use("/api/user", authRoute)
//course route 應該被jwt 保護(只有驗證過jwt的人,才能新增課程或註冊課程)
//如果request header 內部沒有jwt, 則request 則會被視為是 unauthorized
app.use(
    "/api/courses",
    passport.authenticate("jwt", { session: false }), // 執行 new JwtStrategy
    courseRoute
);

if(process.env.NODE_ENV === "production" || 
    process.env.NODE_ENV === "staging"
){
    app.get("*", (req, res)=>{
        res.sendFile(path.join(__dirname, "client", "build", 'index.html'))
    })
}


app.listen(port, ()=>{
    console.log("後端伺服器聆聽在port 8080...")
})