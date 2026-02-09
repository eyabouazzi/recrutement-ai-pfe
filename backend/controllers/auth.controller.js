const  userModel= require('../models/user.model');
const sendEmail = require('../utils/mailer');
const {signUpSchema} = require('../schemas/user.schema');
const {generateToken} = require('../utils/jwt');
const {loginSchema} = require('../schemas/user.schema');


async function signUp(req, res) {
    try{
const validation = signUpSchema.safeParse(req.body);

if  (!validation.success){
    return res.status(400).json({
        status: false,
        errors: validation.error.flatten()
    });
}




 const {firstName, lastName, email, password, confirmPassword, dob} = req.body;

 const existingUser= await userModel.findOne({email});
    if (existingUser){
        return res.status(400).json({
            status: false,

            message: "User with this email already exists"
        });
    };

 const user = new userModel({
    email: email,
    firstName: firstName,
    lastName: lastName,
    password: password,
    confirmPassword: confirmPassword,
    dob: dob
});

await user.save();

// send welcome email 
const options={
    email: user.email,
    subject: "Welcome to our platform",
    content: `Hello ${user.firstName},\n\nWelcome to our recruitment platform! We're excited to have you on board.\n\nBest regards,\nThe Team`
};
// await sendEmail(options);
await sendEmail(options);

res.status(201).json({
    status: true,
    message: "User created successfully"
});

    }
    catch(error){
        res.status(500).json({
            status: false,
            error: error.message
        })
    }
    }

async function login(req, res) {
      try{
const validation = loginSchema.safeParse(req.body);

if  (!validation.success){
    return res.status(400).json({
        errors: validation.error.flatten()
    })
}

//password and email from req body
const {email, password} = req.body;
// find user by email
const user = await userModel.findOne({email}).select('+password');
// cas1: user not found _>return erreur 404
if (!user){
    return res.status(400).json({
        status: false,
        message: "Invalid email or password"
    });
}
// cas2: password is found
const matchPassword = await user.comparePassword(password);
// cas2.1 : password not match -> return erreur 401
if (!matchPassword){
    return res.status(401).json({
        status: false,
        message: "Invalid email or password"
    });
}
// cas2.2 : password match -> generate authentification token ( pasport , jwt)
const token = generateToken(user._id);
res.status(200).json({
    status: true,
    message: "Login successful",
    token: token
});


}catch(error){
        res.status(500).json({
            status: false,
            error: error.message
        })
    }
  }

module.exports = {signUp, login}
