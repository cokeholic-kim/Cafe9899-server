const express = require("express");
const cors = require("cors");
const multer = require("multer")
const mysql = require("mysql");
const bcrypt = require('bcrypt'); //암호화 API
const saltRounds = 10;

//서버 생성
const app = express();

//포트번호
const port = process.env.PORT || 8080;
//브라우져의 cors이슈를 막기 위해 설정
app.use(cors());
// json형식 데이터를 처리하도록 설정
app.use(express.json());
// upload폴더 클라이언트에서 접근 가능하도록 설정
app.use("/upload",express.static("upload"));
//storage생성
const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'upload/menu')
    },
    filename:(req,file,cb)=>{
        const newFilename = file.originalname
        cb(null,newFilename)
    }
})

const posting = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'upload/post')
    },
    filename:(req,file,cb)=>{
        const newFilename = file.originalname
        cb(null,newFilename)
    }
})

//upload객체 생성하기
const upload = multer({ storage : storage });

app.post("/upload",upload.single("img"),async (req,res)=>{
    console.log("등록됨")
    res.send({
        imageURL:req.file.filename
    })
})

app.post("/uploadPost",multer({storage:posting}).single("imgpost"),async (req,res)=>{
    console.log("등록됨")
    res.send({
        imageURL:req.file.filename
    })
})

//mysql 연결 생성
const conn = mysql.createConnection({
    host:"customer-tutorial.cuukeoat8h7o.ap-northeast-1.rds.amazonaws.com",
    user:"admin",
    password:"kimdh991",
    port:"3306",
    database:"Cafe9899"
})
conn.connect();

//회원가입요청
app.post("/join",async (req,res)=>{
    //입력받은 비밀번호를 mytextpass로 저장
    const mytextpass = req.body.m_pass;
    let myPass = ""
    const {m_name,m_nickname,m_email} = req.body;

    // 빈문자열이 아니고 undefined가 아닐때
    if(mytextpass != '' && mytextpass != undefined){
        bcrypt.genSalt(saltRounds, function(err, salt) {
            //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화 하여 콜백함수 안 hash로 돌려준다
            bcrypt.hash(mytextpass, salt, function(err, hash) {// hash는 암호화시켜서 리턴되는값.
                // Store hash in your password DB.
                myPass = hash;
                conn.query(`insert into member(m_name,m_nickname,m_email,m_pass) 
                values('${m_name}','${m_nickname}','${m_email}','${myPass}')`
                ,(err,result,fields)=>{
                    if(err){
                        console.log(err) 
                    }
                    console.log(`insert into member(m_name,m_nickname,m_email,m_pass) 
                    values('${m_name}','${m_nickname}','${m_email}','${myPass}')`);
                    res.send("등록되었습니다.")
                })
            
            });
        });
    }
    console.log(req.body)
})

//로그인 요청
app.post("/login",async (req,res)=>{
    // 1) useremail 값에 일치하는 데이터가 있는지 확인
    // 2) userpass 암호화해서 쿼리 결과의 패스워드랑 일치하는지 체크
    const {userEmail , userPass } = req.body;
    console.log(req.body)
    conn.query(`select * from member where m_email = '${userEmail}'`,(error,result,field)=>{
        //결과가 undefined가 아니고 결과의 0번째가 undefined가 아닐때
        //결과가 있을때.
        if(result != undefined && result[0] != undefined){
            bcrypt.compare(userPass , result[0].m_pass,function(err,res2){
                //result == true / false
                if(res2){
                    console.log("로그인 성공")
                    res.send(result)
                }else{
                    console.log("로그인 실패")
                    res.send("실패")
                }
            })
        }else{
            console.log("데이터가 없습니다")
        }
    })
})

//비밀번호찾기 
app.post("/findPass", async (req,res) => {
    const {userEmail} = req.body;
    console.log(req.body)
    conn.query(`select * from member where m_email = '${userEmail}'`,(err,result,field)=>{
        if(result){
            console.log(`결과${result[0].useremail}`)
            res.send(result[0].m_email)
        }else{
            console.log(err)
        }
    })
})

//패스워드 변경 요청
app.patch("/updatePass",async (req, res)=>{
    console.log(req.body)
    const {m_pass,m_email} = req.body;
    //update 테이블이름 set 필드이름= 데이터값 where 조건
        const mytextpass = m_pass;
    let myPass = ""

    if(mytextpass != '' && mytextpass != undefined){
        bcrypt.genSalt(saltRounds, function(err, salt) {
            //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화 하여 콜백함수 안 hash로 돌려준다
            bcrypt.hash(mytextpass, salt, function(err, hash) {// hash는 암호화시켜서 리턴되는값.
                // Store hash in your password DB.
                myPass = hash;
                conn.query(`update member set m_pass='${myPass}' where m_email='${m_email}'`
                ,(err,result,fields)=>{
                    if(result){
                        res.send("등록되었습니다.")
                    }
                    console.log(err)
                })
            
            });
        });
    }
})

//객실등록요청
app.post('/menus',async (req,res)=>{
    const {m_name, m_price, m_desc, m_img} = req.body;
    conn.query(`insert into menus(m_name, m_price, m_desc, m_img) values(?,?,?,?)`,
    [m_name, m_price, m_desc, m_img]
    ,(err,result,field)=>{
        if(result){
            console.log(result)
            res.send('ok')
        }else{
            console.log(err)
        }
    })

})





app.listen(port,()=>{
    console.log("서버가 구동중입니다.")
})

