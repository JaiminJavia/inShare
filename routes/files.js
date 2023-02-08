const router = require('express').Router();
const multer  = require('multer')
const path = require('path');
const File = require('../models/file')
const {v4:uuid4} = require('uuid')
let storage = multer.diskStorage({
    destination:(req,file,cb)=>cb(null,'uploads'),
    filename: (req,file,cb)=> {
        const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
        cb(null,uniqueFilename);
    }
})
let upload = multer({
    storage,
    limit:  {
        fileSize:1000000 * 100  // 1 mb == 1024 kb 50 mb == 50*1024
    }
}).single(`myfile`);

router.post('/',(req,res)=>{
       //store file
        upload(req,res,async(err)=>{
             //validate request
        if(!req.file){
            return res.json({errors: `all fields are required`});
        }
        if(err){
                return res.status(500).send({errors: err.message})
        }
        //store into database
        const file = new File({
            filename:req.file.filename,
            uuid:uuid4(),
            path:req.file.path,
            size:req.file.size
            
        })

        const response = await file.save()
        return res.json({file:`${process.env.APP_BASE_URL}/files/${response.uuid}`})
        });
    //response=>link

})


router.post('/send',async(req,res)=>{
    const {uuid,emailTo,emailFrom} = req.body;
    //validate request
    if(!uuid || !emailTo || !emailFrom){
        return res.status(422).json({error:'All Fields are required'} )
    }
    //get data from database
    const file = await File.findOne({uuid:uuid});
    if(file.sender){
        return res.status(422).json({error:'Email already sent'} )
        //here we are doing so we could avoid sending email more than once
    }
    file.sender = emailFrom;
    file.receiver = emailTo;
    const response = file.save();

    //send email 
    const sendMail = require('../services/emailService')
    sendMail({
        to:emailTo,
        from:emailFrom,
        subject:'inShare File Sharing',
        text:`${emailFrom} shared a file with you.`,
        html:require(`../services/emailTemplate`)({
            emailFrom:emailFrom,
            downloadLink:`${process.env.APP_BASE_URL}/files/${file.uuid}`,
            size:parseInt(file.size/1000) + 'KB',
            expires: '24 hours'
        })

    })
    return res.send({success:true});
})





module.exports = router;
