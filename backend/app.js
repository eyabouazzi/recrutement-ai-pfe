require('dotenv').config();
const express = require('express');
const userRouter = require('./routes/user.route');
const authRouter = require('./routes/auth.route');
const fileRouter = require('./routes/file.route');
const logRouter = require('./routes/log.route');
const testRouter = require('./routes/test.route');
const submissionRouter = require('./routes/submission.route');
const recommendationRouter = require('./routes/recommendation.route');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/file', fileRouter);
app.use('/log', logRouter);
app.use('/test', testRouter);
app.use('/submission', submissionRouter);
app.use('/recommendations', recommendationRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// post: http://localhost:3000/auth/signup

module.exports = app;