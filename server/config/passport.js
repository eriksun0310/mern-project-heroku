let JwtStrategy = require('passport-jwt').Strategy;
let ExtractJwt = require('passport-jwt').ExtractJwt;

const User = require("../models").user


module.exports = (passport)=>{
    console.log('passport ')
    let opts = {}
    opts.secretOrKey = process.env.PASSPORT_SECRET;
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt")

    passport.use(
        new JwtStrategy(opts, async function(jwt_payload, done){

            try{
                let foundUser =  await User.findOne({ _id:jwt_payload._id}).exec()
                if(foundUser){
                    done(null, foundUser)  //done():把foundUser 設定req.user
                }else{
                    done(null, false)
                }
            }catch(e){
                done(e, false)
            }
        })
    )
}
