require('dotenv').config();
const express = require('express');
const userRouter = require('./routes/user.route');
const authRouter = require('./routes/auth.route');
const fileRouter = require('./routes/file.route');
const logRouter = require('./routes/log.route');
const testRouter = require('./routes/test.route');
const submissionRouter = require('./routes/submission.route');
const recommendationRouter = require('./routes/recommendation.route');
const chatRouter = require('./routes/chat.route');
const contactRouter = require('./routes/contact.route');
// Additional routes
const registerRouter = require('./routes/register.route');
const companyRouter = require('./routes/company.route');
const eventRouter = require('./routes/event.route');
const favoriteRouter = require('./routes/favorite.route');
const appNotificationRouter = require('./routes/appNotification.route');
const adminRouter = require('./routes/admin.route');

const cors = require('cors');
const path = require('path');

const app = express();
app.get('/health', (req, res) => res.json({ status: 'ok' }));
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
app.use('/chat', chatRouter);
app.use('/contact', contactRouter);

// Additional routes
app.use('/register', registerRouter);
app.use('/companies', companyRouter);
app.use('/events', eventRouter);
app.use('/favorites', favoriteRouter);
app.use('/app-notifications', appNotificationRouter);
app.use('/admin', adminRouter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

module.exports = app;