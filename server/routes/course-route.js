const { course } = require(".")

const router = require("express").Router()
const Course = require("../models").course
const courseValidation = require("../validation").courseValidation

router.use((req, res, next)=>{
    console.log('course route 正在接受一個request')
    next()
})
//獲得系統中的所有課程
router.get("/", async (req, res)=>{
    try{
        // query object(thenable object)
        let courseFound  = await Course.find({})
        .populate("instructor", ["username", "email"])
        .exec()
        return res.send(courseFound)
    }catch(e){
        return res.status(500).send(e)
    }
})

// 用講師id 來尋找課程
router.get("/instructor/:_instructor_id", async(req, res)=>{
    try{
        let { _instructor_id } = req.params
        let coursesFound = await Course.find({ instructor:_instructor_id })
        .populate("instructor", ["username", "email"])
        .exec()
    return res.send(coursesFound)
    }catch(e){
        return res.status(500).send(e)
    }

})

//用學生id 來尋找註冊過的課程
router.get("/student/:_student_id", async(req, res)=>{
    try{
        let {_student_id} = req.params
        let coursesFound =  await Course.find({student:_student_id})
                .populate("instructor", ["username", "email"])
                .exec()
        return res.send(coursesFound)
    }catch(e){
        return res.status(500).send(e)
    }
  
})

// 用課程名稱來尋找課程
router.get("/findByName/:name", async(req, res)=>{
    let { name } = req.params
    console.log('name',name)
    try{
        let courseFound = await Course.find({ title: name })
        .populate("instructor", ["email", "username"])
        .exec()
        return res.send(courseFound)
    }catch(e){
        return res.status(500).send(e)
    }
})


//用課程id 尋找課程
router.get("/:_id", async(req, res)=>{
    let { _id } = req.params
    try{
        let courseFound = await Course.findOne({ _id })
        .populate("instructor", ["email"])
        .exec()
        return res.send(courseFound)
    }catch(e){
        return res.status(500).send(e)
    }
})



// 新增課程
router.post("/",  async(req, res)=>{
    //驗證數據符合規範
    let {error} =  courseValidation(req.body)
    if (error) return res.status(500).send(error);

   
    if(req.user.isStudent()){
        return res
        .status(400)
        .send("只有講師才能發佈新課程,若你已經是講師,請透過講師帳號登入")
    }

    let {title, description, price} = req.body
    try{

        let newCourse = new Course({ 
            title, 
            description, 
            price,
            instructor: req.user._id
        })

        let savedCourse = await newCourse.save() 
        return res.send('新課程已經保存')
    }catch(e){
        return res.status(500).send("無法創建課程")
    }
   
})

// 讓學生透過課程id 註冊新課程
router.post("/enroll/:_id", async(req, res)=>{
    let { _id } = req.params 
    try{
        let course = await Course.findOne({ _id })
        course.student.push(req.user._id)
        await course.save()
        res.send("註冊完成")
    }catch(e){
        console.log('error',e)
    }
})



// 更改(編輯)課程
router.patch("/:_id", async(req, res)=>{
     //驗證數據符合規範
    let {error} =  courseValidation(req.body)
    if (error) return res.status(500).send(error);

    let { _id } = req.params
    
    try{
        let courseFound = await Course.findOne({ _id })
        //確認課程存在
        if(!courseFound){
            return res.status(400).send("找不到課程, 無法更新課程內容")
        }

        //使用者必須是此課程講師, 才能編輯課程
        if(courseFound.instructor.equals(req.user._id)){
            let updatedCourse = await Course.findOneAndUpdate({ _id }, req.body,{
                new: true,
                runValidators:true
            })
            return res.send({
                message:"課程已經被更新成功",
                updatedCourse
            })
        }else {
            return res.status(403).send("只有此課程的講師才能編輯此課程")
        }
    }catch(e){
        return res.status(500).send(e)
    }

   
})

//刪除課程
router.delete("/:_id", async(req, res)=>{
    let { _id } = req.params
    
    try{
        let courseFound = await Course.findOne({ _id }).exec()
        //確認課程存在
        if(!courseFound){
            return res.status(400).send("找不到課程, 無法刪除課程內容")
        }

        //使用者必須是此課程講師, 才能刪除課程
        if(courseFound.instructor.equals(req.user._id)){
            await Course.deleteOne({ _id }).exec()
            return res.send("課程已被刪除")
        }else {
            return res.status(403).send("只有此課程的講師才能刪除此課程")
        }
    }catch(e){
        return res.status(500).send(e)
    }
})


module.exports = router