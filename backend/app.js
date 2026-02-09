const express = require('express');
const userRouter = require('./routes/user.route');
const authRouter = require('./routes/auth.route');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json())

app.use('/user', userRouter);
app.use('/auth', authRouter);
// post: http://localhost:3000/auth/signup

module.exports = app;