const express = require('express');
const router = express.Router()
const userModel = require('../../model/User');
const jwt = require('jsonwebtoken')
const passport = require('passport')
const secret = process.env.JWT_SECRET
const gravatar = require('gravatar');
const { v4: uuidv4 } = require("uuid");
const axios = require('axios');

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const auth = require('../../middlewares/auth');
const publicDir = path.join(__dirname, '../../public/avatars')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicDir)
  },
  filename: (req, file, cb) => {
    const newFilename = `${new Date().getTime()}_${file.originalname}`;
    cb(null, newFilename)
  },
})

const upload = multer({
  storage: storage,
})

router.patch('/avatars', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    const { path: temporaryName, originalname } = req.file;
    const fileName = path.join(publicDir, originalname)
    try{
      await fs.rename(temporaryName, fileName);
    } catch(err){
      await fs.unlink(temporaryName);
      console.log(err);
      res.status(500).send(err);
    }

    const { email } = req.user
    const user = await userModel.findOne({ email })
    user.avatarURL = `http://localhost:5000/avatars/${originalname}`
    user.save()
    res.json(user.avatarURL);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});



router.post('/signup', async (req, res, next) => {
  const { email, password } = req.body
  const user = await userModel.findOne({ email })
  if (user) {
    return res.status(409).json({
      status: 'error',
      code: 409,
      message: 'Email is already in use',
      data: 'Conflict',
    })
  }
  try {
    const newUser = new userModel({ email, password })
    const avatar = gravatar.url(email);
    const verifyToken = uuidv4();

    newUser.verificationToken = verifyToken;
    newUser.avatarURL = avatar;
    newUser.setPassword(password)

    const config = {
      headers: {
          "Authorization": `Bearer ${process.env.API_SENDGRID}`,
          "Content-Type": "application/json"
      }
    };

    axios.post('https://api.sendgrid.com/v3/mail/send', {
      "personalizations":[{"to":[{"email":`${email}`,"name":"New User"}],
      "subject":"Hello, Thanks for registrating in my app!"}],
      "content": [{"type": "text/plain", "value": "Heya! \nVerification link: http://localhost:5000/users/verify/" + newUser.verificationToken}],
      "from":{"email":"d.oliynyk@outlook.com","name":"Dmitriy Oliynyk"},
      "reply_to":{"email":"sam.smith@example.com","name":"Sam Smith"}
    }, config);

    await newUser.save()
    res.status(201).json({
      status: 'success',
      code: 201,
      data: {
        message: 'Registration successful',
        user: {
            email: newUser.email,
            subscription: newUser.subscription
          },
        
      },
    })
    
//     curl --request POST \
// --url https://api.sendgrid.com/v3/mail/send \
// --header 'Authorization: Bearer <<YOUR_API_KEY>>' \
// --header 'Content-Type: application/json' \
// --data '{"personalizations":[{"to":[{"email":"john.doe@example.com","name":"John Doe"}],"subject":"Hello, World!"}],"content": [{"type": "text/plain", "value": "Heya!"}],"from":{"email":"sam.smith@example.com","name":"Sam Smith"},"reply_to":{"email":"sam.smith@example.com","name":"Sam Smith"}}'

  } catch (error) {
    next(error)
  }
})


router.post('/login', async (req, res, next) => {
  const { email, password } = req.body
  const user = await userModel.findOne({ email })

  if (!user || !user.validPassword(password)) {
    return res.status(400).json({
      status: 'error',
      code: 400,
      message: 'Incorrect login or password',
      data: 'Bad request',
    })
  }

  if(user.verify === false){
    return res.status(400).json({
      status: 'error',
      code: 404,
      message: 'No verified',
    })
  }
  const payload = {
    id: user.id,
    username: user.username,
  }

  const token = jwt.sign(payload, secret, { expiresIn: '1h' })
  user.token = token
  user.save()
  console.log(user)
  res.json({
    status: 'success',
    code: 200,
    data: {
      token,
    },
  })
})

router.get('/list', auth, (req, res, next) => {
  const { email } = req.user
  res.json({
    status: 'success',
    code: 200,
    data: {
      message: `Authorization was successful: ${email}`,
    },
  })
})

// router.get('/logout', auth, (req, res, next) => {
//   console.log(req.user)
//   req.user.token = null;
//   req.user.save();

//   res.json({
//     status: 'success',
//     code: 200,
//     data: {
//       Authorization: `Bearer ${token}}`,
//     },
//   })
// })


router.get('/current', auth, (req, res, next) => {
  const { email, subscription } = req.user
  res.json({
    status: 'success',
    code: 200,
    data: {
      email: email,
      subscription: subscription
    },
  })
})

router.post('/verify', async (req, res, next) => {
  const { email } = req.body
  
  if(!email){
    return res.json({
      status: "Email required",
      code: 400,
      message: {"message": "Missing required field email"}
    })
  }

  const user = await userModel.findOne({email})
  
  if(!user){
    return res.json({
      status: 'Not Found',
      code: 404,
      message: "User not found"
    })
  }

  if(user.verify === true){
    return res.json({
      status: "Bad request",
      code: 400,
      message: { "message": "Verification has already been passed"}
    })
  }

  const config = {
    headers: {
        "Authorization": `Bearer ${process.env.API_SENDGRID}`,
        "Content-Type": "application/json"
    }
  };

  axios.post('https://api.sendgrid.com/v3/mail/send', {
    "personalizations":[{"to":[{"email":`${email}`,"name":"New User"}],
    "subject":"Hello, Thanks for registrating in my app!"}],
    "content": [{"type": "text/plain", "value": "Heya! \nVerification link: http://localhost:5000/users/verify/" + user.verificationToken}],
    "from":{"email":"d.oliynyk@outlook.com","name":"Dmitriy Oliynyk"},
    "reply_to":{"email":"sam.smith@example.com","name":"Sam Smith"}
  }, config);

  await user.save()
  res.json({
    status: 'OK',
    code: 200,
    message: "Verification email sent"
  })
})

router.get('/verify/:verificationToken', async (req, res, next) => {
  const { verificationToken } = req.params

  const user = await userModel.findOne({verificationToken})

  if(!user){
    return res.json({
      status: 'Not Found',
      code: 404,
      message: "User not found"
    })
  }

  user.verificationToken = null;
  user.verify = true;

  await user.save()
  res.json({
    status: 'OK',
    code: 200,
    message: "Verification successful"
  })
})

module.exports = router

